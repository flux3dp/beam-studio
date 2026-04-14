import paper from 'paper';
import { PaperOffset } from 'paperjs-offset';

import fontFuncs, { convertTextToPathByFontkit, getFontObj } from '@core/app/actions/beambox/font-funcs';
import NS from '@core/app/constants/namespaces';
import useLayerStore from '@core/app/stores/layer/layerStore';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import { moveElements } from '@core/app/svgedit/operations/move';
import updateElementColor from '@core/helpers/color/updateElementColor';
import i18n from '@core/helpers/i18n';
import { createLayer } from '@core/helpers/layer/layer-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { EXPLODED_GAP_PX, INNER_ALIGN_OFFSET_PX, KEYCHAIN_COLORS } from './constants';
import type { KeyChainShape } from './types';
import useKeychainShapeStore from './useKeychainShapeStore';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

/**
 * Converts all <text> elements to <path> elements using fontkit.
 * Create a SVG temporarily mounted to the DOM for SVG position methods to work.
 */
const convertTextsToPath = async (textElements: SVGTextElement[]): Promise<SVGPathElement[]> => {
  const svg = document.createElementNS(NS.SVG, 'svg');

  // Mount to DOM so getStartPositionOfChar / getNumberOfChars work
  svg.style.visibility = 'hidden';
  svg.style.position = 'absolute';
  document.body.appendChild(svg);

  textElements.forEach((el) => svg.appendChild(el));

  const results: SVGPathElement[] = [];

  try {
    for (const textEl of textElements) {
      const postscriptName = textEl.getAttribute('font-postscript');
      const family = textEl.getAttribute('font-family') ?? '';

      let fontDesc;

      if (postscriptName) {
        fontDesc = fontFuncs.getFontOfPostscriptName(postscriptName);
      }

      if (!fontDesc) {
        if (!family) continue;

        const fonts = fontFuncs.requestFontsOfTheFontFamily(family.slice(1, -1)); // remove quotes

        if (!fonts.length) {
          console.warn(`No fonts found for family: ${family}`);
          continue;
        }

        fontDesc = fonts[0];
      }

      const fontObj = await getFontObj(fontDesc);
      const result = convertTextToPathByFontkit(textEl, fontObj, false);

      if (!result?.d) continue;

      const pathEl = document.createElementNS(NS.SVG, 'path');

      pathEl.setAttribute('d', result.d as string);
      pathEl.setAttribute('fill', textEl.getAttribute('fill') ?? '#000');

      if (result.transform) {
        pathEl.setAttribute('transform', result.transform);
      }

      textEl.replaceWith(pathEl);
      results.push(pathEl);
    }

    return results;
  } finally {
    svg.remove();
    svg.style.removeProperty('visibility');
    svg.style.removeProperty('position');
  }
};

/**
 * Scales an SVG path's `d` attribute by the given ratio using Paper.js.
 * Returns the scaled path data string.
 */
const scalePathData = (d: string, ratio: number): string => {
  const p = new paper.CompoundPath(d);

  p.scale(ratio, new paper.Point(0, 0));

  const scaled = p.pathData;

  p.remove();

  return scaled;
};

/**
 * Adds every <path> to the canvas, then moves the resulting
 * elements by (-bounds.x, -bounds.y) so the layer aligns to the canvas origin.
 * When sizeRatio ≠ 1, each path is scaled before adding.
 */
const exportPathsToSvgCanvas = async (
  paths: SVGPathElement[],
  bounds: { x: number; y: number },
  batchCmd: IBatchCommand,
  sizeRatio: number = 1,
): Promise<void> => {
  const createdPaths: SVGPathElement[] = [];

  for (const path of paths) {
    let d = path.getAttribute('d');

    if (!d) continue;

    if (sizeRatio !== 1) {
      d = scalePathData(d, sizeRatio);
    }

    const fill = path.getAttribute('fill') ?? 'none';
    const pathEl = svgCanvas.addSvgElementFromJson({
      attr: {
        d,
        fill,
        'fill-opacity': fill === 'none' ? '0' : '1',
        id: svgCanvas.getNextId(),
        stroke: '#000',
        'stroke-width': 1,
        'vector-effect': 'non-scaling-stroke',
      },
      element: 'path',
    }) as SVGPathElement;

    pathEl.setAttribute('d', svgCanvas.pathActions.convertPath(pathEl, false));
    updateElementColor(pathEl);
    batchCmd.addSubCommand(new history.InsertElementCommand(pathEl));
    createdPaths.push(pathEl);
  }

  if (createdPaths.length > 0) {
    const dx = createdPaths.map(() => -bounds.x * sizeRatio);
    const dy = createdPaths.map(() => -bounds.y * sizeRatio);
    const moveCmd = moveElements(dx, dy, createdPaths, false);

    if (moveCmd && !moveCmd.isEmpty()) {
      batchCmd.addSubCommand(moveCmd);
    }
  }
};

/**
 * Builds a `<path>` element from a paper PathItem with the standard fill/stroke setup
 * used by the keychain export.
 */
const pathItemToSvgPath = (item: paper.PathItem): SVGPathElement => {
  const path = document.createElementNS(NS.SVG, 'path') as SVGPathElement;

  path.setAttribute('d', item.pathData);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', '#000');
  path.setAttribute('stroke-width', '1');
  path.setAttribute('vector-effect', 'non-scaling-stroke');

  return path;
};

const exportBaseLayer = async (shape: KeyChainShape, batchCmd: IBatchCommand, sizeRatio: number): Promise<void> => {
  const { layers: tLayers } = i18n.lang.keychain_generator;
  const { name } = createLayer(tLayers.keychain, { hexCode: KEYCHAIN_COLORS.exploded.base, parentCmd: batchCmd });

  useLayerStore.getState().setSelectedLayers([name]);

  const paths = [pathItemToSvgPath(shape.resultBasePath)];

  await exportPathsToSvgCanvas(paths, shape.bounds, batchCmd, sizeRatio);
};

const convertSvgElementsToPath = async (elements: SVGElement[]): Promise<SVGPathElement[]> => {
  const textElements: SVGTextElement[] = [];
  const pathElements: SVGPathElement[] = [];

  for (const element of elements) {
    const clone = element.cloneNode(true) as SVGElement;

    if (clone.tagName.toLowerCase() === 'text') {
      textElements.push(clone as SVGTextElement);
    } else {
      pathElements.push(clone as SVGPathElement);
    }
  }

  const convertedPaths = await convertTextsToPath(textElements);

  pathElements.push(...convertedPaths);

  return pathElements;
};

/**
 * Converts SVGElements to Paper.js PathItems.
 * used when need to perform boolean operations on decorations (e.g. unite emboss with inner path)
 */
const convertSvgElementsToPathItems = async (elements: SVGElement[]): Promise<paper.PathItem[]> => {
  const paths = await convertSvgElementsToPath(elements);
  const items: paper.PathItem[] = paths
    .map((path) => {
      const d = path.getAttribute('d');

      return d ? new paper.CompoundPath(d) : null;
    })
    .filter(Boolean);

  return items;
};

const exportEngravingLayer = async (
  shape: KeyChainShape,
  batchCmd: IBatchCommand,
  sizeRatio: number,
): Promise<void> => {
  if (shape.decorations.engraving.length === 0) return;

  const { layers: tLayers } = i18n.lang.keychain_generator;
  const { name } = createLayer(tLayers.keychain_deco_engraving, {
    hexCode: KEYCHAIN_COLORS.exploded.engraving,
    parentCmd: batchCmd,
  });

  useLayerStore.getState().setSelectedLayers([name]);

  const paths = await convertSvgElementsToPath(shape.decorations.engraving);

  await exportPathsToSvgCanvas(paths, shape.bounds, batchCmd, sizeRatio);
};

/**
 * Exports inner path and emboss decorations.
 * Use paper.js to unite inner path with emboss decorations and then export to in position guide layer and standalone layer.
 */
const exportEmbossLayers = async (shape: KeyChainShape, batchCmd: IBatchCommand, sizeRatio: number): Promise<void> => {
  let combinedInnerPath = shape.innerPath?.clone() ?? null;

  if (shape.decorations.emboss.length > 0) {
    const embossPathItems = await convertSvgElementsToPathItems(shape.decorations.emboss);

    for (const item of embossPathItems) {
      combinedInnerPath = combinedInnerPath ? combinedInnerPath.unite(item) : item;
    }
  }

  if (!combinedInnerPath) return;

  const { layers: tLayers } = i18n.lang.keychain_generator;

  // Position guide layer - inset the combined inner path by `INNER_ALIGN_OFFSET_PX` so it's slightly smaller than the base path,
  const { name: posName } = createLayer(tLayers.keychain_deco_emboss_guide, {
    hexCode: KEYCHAIN_COLORS.exploded.embossAlign,
    parentCmd: batchCmd,
  });

  useLayerStore.getState().setSelectedLayers([posName]);

  const insetPath = PaperOffset.offset(combinedInnerPath.clone() as paper.Path, -INNER_ALIGN_OFFSET_PX / sizeRatio, {
    insert: false,
  });

  await exportPathsToSvgCanvas([pathItemToSvgPath(insetPath)], shape.bounds, batchCmd, sizeRatio);

  // Standalone layer — translated below the base by `bounds.height + GAP`.
  const { name: aloneName } = createLayer(tLayers.keychain_deco_emboss, {
    hexCode: KEYCHAIN_COLORS.exploded.emboss,
    parentCmd: batchCmd,
  });

  useLayerStore.getState().setSelectedLayers([aloneName]);

  const shiftedBounds = new paper.Rectangle(
    shape.bounds.x,
    shape.bounds.y - shape.bounds.height - EXPLODED_GAP_PX / sizeRatio,
    shape.bounds.width,
    shape.bounds.height,
  );

  await exportPathsToSvgCanvas([pathItemToSvgPath(combinedInnerPath)], shiftedBounds, batchCmd, sizeRatio);
};

/**
 * Exports the keychain shape to the Beam Studio canvas as new layers.
 *
 * - Always creates the `Keychain` layer (base cutting path).
 * - When decorations exist, creates `Keychain Engraving` layer (text + element shapes).
 * - When the shape has an inner path, additionally creates `Keychain Inner Position`
 *   (inner path overlaid on the base) and `Keychain Inner` (inner path translated below
 *   the base region by `bounds.height + EXPLODED_GAP_MM`).
 *
 * Reads the already-computed shape from the store; rebuilds it on demand if missing.
 */
export const exportToCanvas = async (): Promise<void> => {
  let { shape, sizeRatio } = useKeychainShapeStore.getState();

  if (!shape) {
    const { applyOptions, buildBaseShape, category } = useKeychainShapeStore.getState();

    await buildBaseShape(category);
    shape = await applyOptions();
    sizeRatio = useKeychainShapeStore.getState().sizeRatio;
  }

  const batchCmd = new history.BatchCommand('Export Keychain');

  await exportBaseLayer(shape, batchCmd, sizeRatio);
  await exportEngravingLayer(shape, batchCmd, sizeRatio);
  await exportEmbossLayers(shape, batchCmd, sizeRatio);

  if (!batchCmd.isEmpty()) undoManager.addCommandToHistory(batchCmd);
};
