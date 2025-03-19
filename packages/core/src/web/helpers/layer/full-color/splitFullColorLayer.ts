import progressCaller from '@core/app/actions/progress-caller';
import { PrintingColors } from '@core/app/constants/color-constants';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import NS from '@core/app/constants/namespaces';
import history from '@core/app/svgedit/history/history';
import updateLayerColor from '@core/helpers/color/updateLayerColor';
import updateImageDisplay from '@core/helpers/image/updateImageDisplay';
import isDev from '@core/helpers/is-dev';
import { getData, writeDataLayer } from '@core/helpers/layer/layer-config-helper';
import {
  cloneLayer,
  deleteLayerByName,
  getAllLayerNames,
  getLayerElementByName,
} from '@core/helpers/layer/layer-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import symbolMaker from '@core/helpers/symbol-maker';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import layerToImage from '../layerToImage';

import splitColor from './splitColor';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const PROGRESS_ID = 'split-full-color';
const colorSet = {
  C: PrintingColors.CYAN,
  K: PrintingColors.BLACK,
  M: PrintingColors.MAGENTA,
  W: PrintingColors.WHITE,
  Y: PrintingColors.YELLOW,
} as const;

// TODO: add unit test
const splitFullColorLayer = async (
  layerName: string,
  opts: { addToHistory?: boolean } = {},
): Promise<null | { cmd: IBatchCommand; newLayers: Element[] }> => {
  const { addToHistory = true } = opts;
  const layer = getLayerElementByName(layerName);
  const fullColor = getData(layer, 'fullcolor');
  const ref = getData(layer, 'ref');
  const module = getData(layer, 'module');

  if (!fullColor || ref || module === LayerModule.UV_EXPORT) {
    return null;
  }

  progressCaller.openNonstopProgress({
    id: PROGRESS_ID,
    message: 'Splitting Full Color Layer',
    timeout: 120000,
  });

  const uses = [...layer.querySelectorAll('use')];

  uses.forEach((use) => symbolMaker.switchImageSymbol(use as SVGUseElement, false));

  const { bbox, cmykBlob, rgbBlob } = await layerToImage(layer as SVGGElement, {
    isFullColor: true,
  });

  uses.forEach((use) => symbolMaker.switchImageSymbol(use as SVGUseElement, true));

  if (!rgbBlob || bbox.width === 0 || bbox.height === 0) {
    progressCaller.popById(PROGRESS_ID);

    return null;
  }

  const whiteInkSaturation = getData(layer, 'wInk')!;
  const cRatio = getData(layer, 'cRatio');
  const mRatio = getData(layer, 'mRatio');
  const yRatio = getData(layer, 'yRatio');
  const kRatio = getData(layer, 'kRatio');

  const includeWhite = isDev() && whiteInkSaturation > 0;
  const channelBlobs = await splitColor(rgbBlob, cmykBlob || null, { includeWhite });

  const batchCmd = new history.BatchCommand('Split Full Color Layer');
  const newLayers: Array<Element | null> = [];
  const nameSuffix = ['W', 'K', 'C', 'M', 'Y'] as const;
  const params = [null, { strength: kRatio }, { strength: cRatio }, { strength: mRatio }, { strength: yRatio }];

  for (let i = 0; i < nameSuffix.length; i += 1) {
    if (i === 0 && !includeWhite) {
      newLayers.push(null);

      continue;
    }

    const color = colorSet[nameSuffix[i]];
    const res = cloneLayer(layerName, {
      configOnly: true,
      isSub: true,
      name: `${layerName} (${nameSuffix[i]})`,
    });

    if (res) {
      const { cmd, elem } = res;

      batchCmd.addSubCommand(cmd);
      writeDataLayer(elem, 'color', color);
      writeDataLayer(elem, 'fullcolor', false);
      writeDataLayer(elem, 'split', true);

      if (i === 0) {
        const whiteSpeed = getData(layer, 'wSpeed');
        const whiteMultipass = getData(layer, 'wMultipass');
        const whiteRepeat = getData(layer, 'wRepeat');

        writeDataLayer(elem, 'ink', whiteInkSaturation);
        writeDataLayer(elem, 'printingSpeed', whiteSpeed);
        writeDataLayer(elem, 'multipass', whiteMultipass);
        writeDataLayer(elem, 'repeat', whiteRepeat);
      } else {
        const { strength } = params[i]!;

        writeDataLayer(elem, 'printingStrength', strength);
      }

      layer.parentNode?.insertBefore(elem, layer.nextSibling);
      newLayers.push(elem);
    }
  }

  const promises = [];

  for (let i = 0; i < newLayers.length; i += 1) {
    if (!channelBlobs[i]) {
      continue;
    }

    const newImgUrl = URL.createObjectURL(channelBlobs[i]!);
    const newImage = document.createElementNS(NS.SVG, 'image') as unknown as SVGImageElement;

    newImage.setAttribute('x', bbox.x.toString());
    newImage.setAttribute('y', bbox.y.toString());
    newImage.setAttribute('width', bbox.width.toString());
    newImage.setAttribute('height', bbox.height.toString());
    newImage.setAttribute('id', svgCanvas.getNextId());
    newImage.setAttribute('style', 'pointer-events:inherit');
    newImage.setAttribute('preserveAspectRatio', 'none');
    newImage.setAttribute('origImage', newImgUrl);
    newImage.setAttribute('data-threshold', '254');
    newImage.setAttribute('data-shading', 'true');
    newImage.setAttribute('data-ratiofixed', 'true');
    newImage.removeAttribute('data-fullcolor');
    newLayers[i]?.appendChild(newImage);

    const promise = updateImageDisplay(newImage);

    promises.push(promise);
  }
  await Promise.all(promises);

  const cmd = deleteLayerByName(layerName);

  if (cmd) {
    batchCmd.addSubCommand(cmd);
  }

  if (addToHistory && !batchCmd.isEmpty()) {
    svgCanvas.undoMgr.addCommandToHistory(batchCmd);
  }

  const drawing = svgCanvas.getCurrentDrawing();

  drawing.identifyLayers();

  for (const newLayer of newLayers) {
    if (newLayer) {
      updateLayerColor(newLayer as SVGGElement);
    }
  }

  svgCanvas.clearSelection();
  progressCaller.popById(PROGRESS_ID);

  return { cmd: batchCmd, newLayers: newLayers.filter((l) => !!l) };
};

export const tempSplitFullColorLayers = async (): Promise<() => void> => {
  const allLayerNames = getAllLayerNames();
  const addedLayers: Element[] = [];
  const removedLayers: Array<{ layer: Element; nextSibling: ChildNode | null; parentNode: Node | null }> = [];
  const drawing = svgCanvas.getCurrentDrawing();
  const currentLayerName = drawing.getCurrentLayerName();

  for (const layerName of allLayerNames) {
    const layer = getLayerElementByName(layerName);
    const fullColor = getData(layer, 'fullcolor');
    const ref = getData(layer, 'ref');

    if (fullColor && layer.getAttribute('display') !== 'none' && !ref) {
      const { nextSibling, parentNode } = layer;
      const children = [...layer.childNodes] as Element[];

      if (children.filter((c) => !['filter', 'title'].includes(c.tagName)).length === 0) {
        continue;
      }

      const res = await splitFullColorLayer(layerName, { addToHistory: false });

      if (res) {
        const { newLayers } = res;

        addedLayers.push(...newLayers);
        removedLayers.push({ layer, nextSibling, parentNode });
      }
    }
  }

  const revert = () => {
    for (let i = removedLayers.length - 1; i >= 0; i -= 1) {
      const { layer, nextSibling, parentNode } = removedLayers[i];

      parentNode?.insertBefore(layer, nextSibling);
    }

    addedLayers.forEach((layer) => {
      layer.remove();
    });

    drawing.identifyLayers();
    drawing.setCurrentLayer(currentLayerName!);
  };

  return revert;
};

export default splitFullColorLayer;
