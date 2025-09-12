import progressCaller from '@core/app/actions/progress-caller';
import { colorMap, PrintingColors } from '@core/app/constants/color-constants';
import { LayerModule, printingModules } from '@core/app/constants/layer-module/layer-modules';
import NS from '@core/app/constants/namespaces';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import layerManager from '@core/app/svgedit/layer/layerManager';
import updateLayerColor from '@core/helpers/color/updateLayerColor';
import updateImageDisplay from '@core/helpers/image/updateImageDisplay';
import isDev from '@core/helpers/is-dev';
import { deleteLayerByName } from '@core/helpers/layer/deleteLayer';
import { getData, writeDataLayer } from '@core/helpers/layer/layer-config-helper';
import { cloneLayer, getAllLayerNames, getLayerElementByName } from '@core/helpers/layer/layer-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import symbolMaker from '@core/helpers/symbol-helper/symbolMaker';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import layerToImage from '../layerToImage';

import splitColor from './splitColor';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const PROGRESS_ID = 'split-full-color';

// TODO: add unit test
const splitFullColorLayer = async (
  layerName: string,
  opts: { addToHistory?: boolean } = {},
): Promise<null | { cmd: IBatchCommand; newLayers: Element[] }> => {
  const { addToHistory = true } = opts;
  const layer = getLayerElementByName(layerName)!;
  const fullColor = getData(layer, 'fullcolor');
  const ref = getData(layer, 'ref');
  const layerModule = getData(layer, 'module');
  const split = getData(layer, 'split');

  if (
    !layerModule ||
    !printingModules.has(layerModule) ||
    !fullColor ||
    ref ||
    split ||
    layerModule === LayerModule.UV_PRINT
  ) {
    return null;
  }

  svgCanvas.clearSelection();

  progressCaller.openNonstopProgress({
    id: PROGRESS_ID,
    message: 'Splitting Full Color Layer',
    timeout: 120000,
  });

  const is4c = layerModule === LayerModule.PRINTER_4C;
  const uses = [...layer.querySelectorAll('use')];

  uses.forEach((use) => symbolMaker.switchImageSymbol(use as SVGUseElement, false));

  const { bbox, cmykBlob, rgbBlob } = await layerToImage(layer as SVGGElement, {
    dpmm: is4c ? 600 / 25.4 : 300 / 25.4,
    isFullColor: true,
  });

  uses.forEach((use) => symbolMaker.switchImageSymbol(use as SVGUseElement, true));

  if (!rgbBlob || bbox.width === 0 || bbox.height === 0) {
    progressCaller.popById(PROGRESS_ID);

    return null;
  }

  const whiteInkSaturation = getData(layer, 'wInk')!;
  const includeWhite = isDev() && whiteInkSaturation > 0;
  const colorData = await splitColor(rgbBlob, cmykBlob, { includeWhite });

  const createImage = (blob: Blob) => {
    const imgUrl = URL.createObjectURL(blob);
    const image = document.createElementNS(NS.SVG, 'image') as unknown as SVGImageElement;

    image.setAttribute('x', bbox.x.toString());
    image.setAttribute('y', bbox.y.toString());
    image.setAttribute('width', bbox.width.toString());
    image.setAttribute('height', bbox.height.toString());
    image.setAttribute('id', svgCanvas.getNextId());
    image.setAttribute('style', 'pointer-events:inherit');
    image.setAttribute('preserveAspectRatio', 'none');
    image.setAttribute('origImage', imgUrl);
    image.setAttribute('data-threshold', '254');
    image.setAttribute('data-shading', 'true');
    image.setAttribute('data-ratiofixed', 'true');
    image.removeAttribute('data-fullcolor');

    return image;
  };

  const batchCmd = new history.BatchCommand('Split Full Color Layer');
  const newLayers: Array<Element | null> = [];
  const promises = [];

  if (is4c) {
    const cloneRes = cloneLayer(layerName, {
      configOnly: true,
      isSub: true,
      name: `${layerName} (4C)`,
      parentCmd: batchCmd,
    });

    if (cloneRes) {
      const { elem: newLayer } = cloneRes;

      writeDataLayer(newLayer, 'split', true);

      const CMYK_FIXED_RATIO = 0.9; // compensation for 4C printing, to avoid over saturation

      const cRatio = getData(layer, 'cRatio');

      if (cRatio) writeDataLayer(newLayer, 'cRatio', cRatio * CMYK_FIXED_RATIO);

      const mRatio = getData(layer, 'mRatio');

      if (mRatio) writeDataLayer(newLayer, 'mRatio', mRatio * CMYK_FIXED_RATIO);

      const yRatio = getData(layer, 'yRatio');

      if (yRatio) writeDataLayer(newLayer, 'yRatio', yRatio * CMYK_FIXED_RATIO);

      const kRatio = getData(layer, 'kRatio');

      if (kRatio) writeDataLayer(newLayer, 'kRatio', kRatio * CMYK_FIXED_RATIO);

      for (const { color, data } of colorData) {
        if (!data || color === PrintingColors.WHITE) continue;

        const newImage = createImage(data);

        newLayer.appendChild(newImage);

        const c = colorMap[color];
        const promise = updateImageDisplay(newImage);

        newImage.setAttribute('data-color', c);
        promises.push(promise);
      }

      layer.parentNode!.insertBefore(newLayer, layer.nextSibling);
      newLayers.push(newLayer);
    }
  } else {
    // split to 4 / 5 layers
    const cRatio = getData(layer, 'cRatio');
    const mRatio = getData(layer, 'mRatio');
    const yRatio = getData(layer, 'yRatio');
    const kRatio = getData(layer, 'kRatio');
    const params = [null, { strength: kRatio }, { strength: cRatio }, { strength: mRatio }, { strength: yRatio }];

    for (let i = 0; i < colorData.length; i++) {
      const { color, data } = colorData[i];

      if (color === PrintingColors.WHITE && !includeWhite) {
        newLayers.push(null);

        continue;
      }

      const nameSuffix = colorMap[color].toUpperCase();
      const res = cloneLayer(layerName, {
        configOnly: true,
        isSub: true,
        name: `${layerName} (${nameSuffix})`,
        parentCmd: batchCmd,
      });

      if (!res) continue;

      const { elem: newLayer } = res;

      writeDataLayer(newLayer, 'color', color);
      writeDataLayer(newLayer, 'fullcolor', false);
      writeDataLayer(newLayer, 'split', true);

      if (color === PrintingColors.WHITE) {
        const whiteSpeed = getData(layer, 'wSpeed');
        const whiteMultipass = getData(layer, 'wMultipass');
        const whiteRepeat = getData(layer, 'wRepeat');

        writeDataLayer(newLayer, 'ink', whiteInkSaturation);
        writeDataLayer(newLayer, 'printingSpeed', whiteSpeed);
        writeDataLayer(newLayer, 'multipass', whiteMultipass);
        writeDataLayer(newLayer, 'repeat', whiteRepeat);
      } else {
        const { strength } = params[i]!;

        writeDataLayer(newLayer, 'printingStrength', strength);
      }

      layer.parentNode!.insertBefore(newLayer, layer.nextSibling);
      newLayers.push(newLayer);

      if (!data) continue;

      const newImage = createImage(data);

      newLayer.appendChild(newImage);

      const promise = updateImageDisplay(newImage);

      promises.push(promise);
    }
  }

  await Promise.all(promises);

  deleteLayerByName(layerName, { parentCmd: batchCmd });

  if (addToHistory && !batchCmd.isEmpty()) {
    undoManager.addCommandToHistory(batchCmd);
  }

  layerManager.identifyLayers();

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
  const removedLayers: Array<{ layer: Element; nextSibling: Node | null; parentNode: Node | null }> = [];
  const currentLayerName = layerManager.getCurrentLayerName();

  for (const layerName of allLayerNames) {
    const layer = getLayerElementByName(layerName)!;
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

      parentNode!.insertBefore(layer, nextSibling);
    }

    addedLayers.forEach((layer) => {
      layer.remove();
    });

    layerManager.identifyLayers();
    layerManager.setCurrentLayer(currentLayerName!);
  };

  return revert;
};

export default splitFullColorLayer;
