import progressCaller from '@core/app/actions/progress-caller';
import { MM_TO_SCENE } from '@core/app/components/beambox/InnerEngraving/utils/coordinates';
import { getEngravableBox } from '@core/app/components/beambox/InnerEngraving/utils/engravable';
import { selectStlObject } from '@core/app/components/beambox/InnerEngraving/utils/selection';
import { IDENTITY_TRANSFORM } from '@core/app/components/beambox/InnerEngraving/utils/transform';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import { performSvgPreChecks } from '@core/app/svgedit/operations/import/importSvg';
import { preprocessSvgString } from '@core/app/svgedit/operations/import/importSvg/utils/processOutputData';
import { uploadAndDivideSvg } from '@core/app/svgedit/operations/import/importSvg/utils/uploadAndDivideSvg';
import readBitmapFile from '@core/app/svgedit/operations/import/readBitmapFile';
import parseSvg from '@core/app/svgedit/operations/parseSvg';
import { buildExtrusion } from '@core/app/svgedit/stl/extrusionSource';
import { initializePhotoPlane } from '@core/app/svgedit/stl/photoPlane';
import { syncStlObjectsWithDom } from '@core/app/svgedit/stl/sync';
import workareaManager from '@core/app/svgedit/workarea';
import i18n from '@core/helpers/i18n';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { getPathScale } from './getPathScale';
import unitePathData from './unitePathData';

import { askToScaleDown, create3dObject } from '.';

let svgCanvas: ISVGCanvas;
let svgedit: any;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
  svgedit = globalSVG.Edit;
});

/** Same fixed thickness as every other 2D artwork extruded into 3D. */
const DEPTH_MM = 1;

interface Rect {
  height: number;
  width: number;
  x: number;
  y: number;
}

/**
 * One divided SVG output, as markup in canvas units (0.1mm).
 *
 * Sized by the same `parseSvg` the 2D import uses, so an SVG comes in at the size it would have on
 * the 2D canvas. `parseSvg` leaves a symbol in the document's defs; it is only read here and removed.
 */
const toCanvasMarkup = (svgString: string): string => {
  const doc = svgedit.utilities.text2xml(svgString) as Document;

  svgCanvas.prepareSvg(doc);

  const svg = document.adoptNode(doc.documentElement);
  const { symbols } = parseSvg(new history.BatchCommand('Parse SVG'), svg, 'nolayer');
  const serializer = new XMLSerializer();

  return symbols
    .filter(Boolean)
    .map((symbol) => {
      const markup = Array.from(symbol.childNodes)
        .map((node) => serializer.serializeToString(node))
        .join('');

      symbol.remove();

      return markup;
    })
    .join('');
};

const unionRect = (rects: Rect[]): Rect => {
  const minX = Math.min(...rects.map(({ x }) => x));
  const minY = Math.min(...rects.map(({ y }) => y));
  const maxX = Math.max(...rects.map(({ width, x }) => x + width));
  const maxY = Math.max(...rects.map(({ height, y }) => y + height));

  return { height: maxY - minY, width: maxX - minX, x: minX, y: minY };
};

const getImageRect = (elem: SVGImageElement): Rect => ({
  height: Number(elem.getAttribute('height')),
  width: Number(elem.getAttribute('width')),
  x: Number(elem.getAttribute('x')),
  y: Number(elem.getAttribute('y')),
});

/**
 * Import an SVG file into an inner engraving document.
 *
 * The file is divided by the backend as a single layer, the same as the 2D "no layer" import. With
 * one object selectable at a time, the artwork has to move as one piece, so all of its paths are
 * united into a single 1mm extrusion, as the Element panel does for icons. An embedded bitmap
 * cannot join a mesh and becomes a photo plane of its own, placed where it sits next to the
 * artwork. The two keep their real size and are centred on the engravable area like every other
 * import; when they do not fit, shrinking them together is offered, as for an STL model.
 */
const importSvgFileAsStl = async (file: Blob): Promise<void> => {
  const { lang } = i18n;

  if (!(await performSvgPreChecks(file, lang)).proceed) return;

  const outputData = await uploadAndDivideSvg(file, 'nolayer', lang);

  if (!outputData) return;

  const progressId = 'import-svg-3d';

  await progressCaller.openNonstopProgress({ caption: lang.beambox.popup.loading_image, id: progressId });

  try {
    let markup = '';

    // strokes and fills are divided into two files; in 3D both are extruded as filled outlines
    for (const key of ['strokes', 'colors'] as const) {
      if (outputData[key]) markup += toCanvasMarkup(preprocessSvgString(await outputData[key].text(), 'nolayer'));
    }

    const united = markup ? unitePathData(markup) : null;
    let photo: null | { cmd: IBatchCommand; elem: SVGImageElement; rect: Rect } = null;

    if (outputData.bitmap?.size > 0) {
      // its own command, so undo removes the image before syncing the store, as importPhotoPlane does
      const cmd = new history.BatchCommand('Import 3D Photo');
      const elem = await readBitmapFile(outputData.bitmap, { offset: outputData.bitmapOffset, parentCmd: cmd });

      // read now: placing the photo plane rewrites the image's x / y / size as its projection
      photo = { cmd, elem, rect: getImageRect(elem) };
    }

    const rects = [united?.bounds, photo?.rect].filter((rect): rect is Rect => Boolean(rect));

    if (rects.length === 0) return;

    // canvas units are scene units (0.1mm); the scene's Y points the other way from the canvas's
    const group = unionRect(rects);
    const box = getEngravableBox();
    const fitScale = getPathScale(group.width / MM_TO_SCENE, group.height / MM_TO_SCENE, box);
    let fit = 1;

    if (fitScale < 1) {
      // closed first: a modal alert behind a progress dialog is unanswerable
      progressCaller.popById(progressId);

      if (await askToScaleDown()) fit = fitScale;
    }

    const target: [number, number, number] = box.isValid
      ? box.center
      : [workareaManager.width / 2, workareaManager.height / 2, (DEPTH_MM * MM_TO_SCENE) / 2];
    const toScene = ({ height, width, x, y }: Rect): [number, number] => [
      target[0] + (x + width / 2 - (group.x + group.width / 2)) * fit,
      target[1] - (y + height / 2 - (group.y + group.height / 2)) * fit,
    ];
    const batchCmd = new history.BatchCommand('Import SVG');
    let selectedId: null | string = null;

    if (united) {
      const built = buildExtrusion({
        depth: DEPTH_MM,
        markup: `<path d="${united.d}"/>`,
        scale: fit / MM_TO_SCENE,
        type: 'svg',
      });

      if (built) {
        const { cmd, id } = create3dObject(built.buffer, built.geometry, {
          historyLabel: 'Import SVG',
          initialTransform: { ...IDENTITY_TRANSFORM, position: [...toScene(united.bounds), target[2]] },
        });

        batchCmd.addSubCommand(cmd);
        selectedId = id;
      }
    }

    if (photo) {
      const object = initializePhotoPlane(photo.elem, { position: toScene(photo.rect), scale: fit });

      photo.cmd.onAfter = () => syncStlObjectsWithDom([object]);
      batchCmd.addSubCommand(photo.cmd);
      selectedId ??= photo.elem.id;
    }

    if (!selectedId) return;

    undoManager.addCommandToHistory(batchCmd);
    selectStlObject(selectedId);
  } finally {
    progressCaller.popById(progressId);
  }
};

export default importSvgFileAsStl;
