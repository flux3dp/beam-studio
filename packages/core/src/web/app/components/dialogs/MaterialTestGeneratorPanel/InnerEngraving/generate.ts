import { Vector3 } from 'three';

import constant from '@core/app/actions/beambox/constant';
import { IDENTITY_TRANSFORM } from '@core/app/components/beambox/InnerEngraving/utils/transform';
import type { BatchCommand } from '@core/app/svgedit/history/history';
import { create3dObject } from '@core/app/svgedit/operations/import/importStl';
import { outlineText } from '@core/app/svgedit/operations/import/importStl/importText';
import { STL_ATTR } from '@core/app/svgedit/stl/constants';
import type { ExtrusionSource } from '@core/app/svgedit/stl/extrusionSource';
import { buildExtrusion, createExtrusionSource, serializeExtrusionSource } from '@core/app/svgedit/stl/extrusionSource';
import { renderText } from '@core/app/svgedit/text/textedit';
import workareaManager from '@core/app/svgedit/workarea';
import getDefaultFont from '@core/helpers/fonts/getDefaultFont';
import { writeDataLayer } from '@core/helpers/layer/layer-config-helper';
import { createLayer } from '@core/helpers/layer/layer-helper';
import type { ConfigKey, ConfigKeyTypeMap } from '@core/interfaces/ILayerConfig';

import type { SvgInfo } from '../generateSvgInfo';
import type { TextSetting } from '../TextSetting';

import type { Affine, Box, ForceTransform } from './layout';
import { toSvgMatrix, transformBox } from './layout';

const NS = 'http://www.w3.org/2000/svg';
const { dpmm } = constant;
/** Labels are line-engraved outlines, so they stay thin whatever the forced Z size of the blocks. */
const LABEL_DEPTH = 0.1;

export const createConversionRoot = (): SVGSVGElement => {
  const root = document.createElementNS(NS, 'svg');

  root.setAttribute('height', String(workareaManager.height));
  root.setAttribute('width', String(workareaManager.width));
  Object.assign(root.style, { left: '-100000px', position: 'absolute', top: '0' });
  document.body.appendChild(root);

  return root;
};

/** A label converted to its outline once, at its base font size and at the origin. */
export interface LabelOutline {
  /** The outline's own bounds: the glyphs, not the font's line box. */
  box: Box;
  pathMarkup: string;
  /** Editable source, kept on the 3D object so the text can still be changed later. */
  text: SVGTextElement;
}

let labelId = 0;

/**
 * Convert a label to its outline.
 *
 * The outline is what both the layout and the extrusion use, so the measured size is exactly the
 * engraved one. It does not depend on where the label ends up — placement is a matrix applied
 * afterwards — which is what lets the panel cache it across previews.
 */
export const outlineLabel = async (
  root: SVGSVGElement,
  content: string,
  fontSize: number,
): Promise<LabelOutline | null> => {
  const { font_family: fontFamily, font_postscriptName: postscriptName } = getDefaultFont();
  const text = document.createElementNS(NS, 'text');

  labelId += 1;
  Object.entries({
    'data-ratiofixed': 'true',
    fill: '#000',
    'fill-opacity': '1',
    'font-family': fontFamily,
    'font-postscript': postscriptName,
    'font-size': String(fontSize),
    id: `material-test-label-${labelId}`,
    'stroke-width': '2',
    x: '0',
    'xml:space': 'preserve',
    y: '0',
  }).forEach(([key, value]) => text.setAttribute(key, value));
  root.appendChild(text);

  try {
    renderText(text, content);

    const pathMarkup = await outlineText(text);

    if (!pathMarkup) return null;

    const doc = new DOMParser().parseFromString(`<svg xmlns="${NS}">${pathMarkup}</svg>`, 'image/svg+xml');
    const path = document.importNode(doc.documentElement.firstElementChild!, true) as SVGGraphicsElement;

    root.appendChild(path);

    const { height, width, x, y } = path.getBBox();

    path.remove();

    return { box: { maxX: x + width, maxY: y + height, minX: x, minY: y }, pathMarkup, text };
  } finally {
    text.remove();
  }
};

export interface BlockItem {
  box: Box;
  info: SvgInfo;
}

export interface LabelItem {
  matrix: Affine;
  outline: LabelOutline;
}

/** The final, forced-transformed footprint of a label. */
export const getLabelBox = ({ matrix, outline }: LabelItem): Box => transformBox(outline.box, matrix);

/**
 * Extrude a flat source and add it to the current layer as a 3D object.
 *
 * The geometry is built at its absolute canvas position, so the object's position is just the
 * centre of that geometry: X as is, Y flipped back into scene space (buildExtrusion flips SVG Y),
 * and Z where the forced offset puts it.
 */
const add3dObject = (
  source: ExtrusionSource,
  z: number,
  attributes: Record<string, number | string>,
  batchCmd: BatchCommand,
): void => {
  const built = buildExtrusion(source);

  if (!built) return;

  const center = built.geometry.boundingBox!.getCenter(new Vector3());
  const position: [number, number, number] = [center.x * dpmm, workareaManager.height + center.y * dpmm, z * dpmm];
  const { cmd } = create3dObject(built.buffer, built.geometry, {
    attributes: { ...attributes, [STL_ATTR.source]: serializeExtrusionSource(source) },
    historyLabel: 'Material Test Generator',
    initialTransform: { ...IDENTITY_TRANSFORM, position },
  });

  batchCmd.addSubCommand(cmd);
};

interface InsertOptions {
  blocks: BlockItem[];
  force: ForceTransform;
  labels: LabelItem[];
  /** The two params that vary across the grid; everything else keeps the layer defaults. */
  params: Array<keyof SvgInfo>;
  textSetting: TextSetting;
}

/**
 * Create the layers and 3D objects for a fully laid out test.
 *
 * Blocks take the forced Z size and labels a fixed {@link LABEL_DEPTH}. Both are centred on the
 * forced Z offset, which is therefore the centre of the whole.
 */
export const insertMaterialTest = (
  { blocks, force, labels, params, textSetting }: InsertOptions,
  batchCmd: BatchCommand,
): void => {
  const depth = force.scale[2];
  const z = force.offset[2];

  // reversed so the layer list reads in grid order from the top
  [...blocks].reverse().forEach(({ box, info }) => {
    const { layer } = createLayer(info.name, { initConfig: true, parentCmd: batchCmd });
    const attributes: Record<string, number | string> = { [STL_ATTR.mode]: 'dot' };

    params.forEach((key) => {
      const value = info[key] as number;

      if (key === 'pointSpacing') attributes[STL_ATTR.pointSpacing] = value;
      else writeDataLayer(layer, key as ConfigKey, value as ConfigKeyTypeMap[ConfigKey]);
    });

    const rect = document.createElementNS(NS, 'rect');

    rect.setAttribute('x', String(box.minX));
    rect.setAttribute('y', String(box.minY));
    rect.setAttribute('width', String(box.maxX - box.minX));
    rect.setAttribute('height', String(box.maxY - box.minY));
    add3dObject(createExtrusionSource(rect, { depth, unit: 'scene' }), z, attributes, batchCmd);
  });

  const { layer: infoLayer } = createLayer('Material Test - Info', {
    hexCode: '#000',
    initConfig: true,
    parentCmd: batchCmd,
  });

  writeDataLayer(infoLayer, 'power', textSetting.power);
  writeDataLayer(infoLayer, 'speed', textSetting.speed);

  labels.forEach(({ matrix, outline }) => {
    const transform = toSvgMatrix(matrix);
    const text = outline.text.cloneNode(true) as SVGTextElement;

    // the source is shared by every preview's copy, so it must not carry an id
    text.removeAttribute('id');
    text.setAttribute('transform', transform);
    add3dObject(
      {
        ...createExtrusionSource(text, { depth: LABEL_DEPTH, unit: 'scene' }),
        geometryMarkup: `<g transform="${transform}">${outline.pathMarkup}</g>`,
      },
      z,
      {},
      batchCmd,
    );
  });
};
