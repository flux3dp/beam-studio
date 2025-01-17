import history from 'app/svgedit/history/history';
import ISVGCanvas from 'interfaces/ISVGCanvas';
import isDev from 'helpers/is-dev';
import NS from 'app/constants/namespaces';
import progressCaller from 'app/actions/progress-caller';
import symbolMaker from 'helpers/symbol-maker';
import updateImageDisplay from 'helpers/image/updateImageDisplay';
import updateLayerColor from 'helpers/color/updateLayerColor';
import { getData, writeDataLayer } from 'helpers/layer/layer-config-helper';
import { PrintingColors } from 'app/constants/color-constants';
import {
  cloneLayer,
  deleteLayerByName,
  getAllLayerNames,
  getLayerElementByName,
} from 'helpers/layer/layer-helper';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { IBatchCommand } from 'interfaces/IHistory';

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
  opts: { addToHistory?: boolean } = {}
): Promise<{ cmd: IBatchCommand; newLayers: Element[] } | null> => {
  const { addToHistory = true } = opts;
  const layer = getLayerElementByName(layerName);
  const fullColor = getData(layer, 'fullcolor');
  const ref = getData(layer, 'ref');
  if (!fullColor || ref) return null;
  progressCaller.openNonstopProgress({
    id: PROGRESS_ID,
    message: 'Splitting Full Color Layer',
    timeout: 120000,
  });
  const uses = [...layer.querySelectorAll('use')];
  uses.forEach((use) => symbolMaker.switchImageSymbol(use as SVGUseElement, false));
  const { rgbBlob, cmykBlob, bbox } = await layerToImage(layer as SVGGElement, {
    isFullColor: true,
  });
  uses.forEach((use) => symbolMaker.switchImageSymbol(use as SVGUseElement, true));
  if (!rgbBlob || bbox.width === 0 || bbox.height === 0) {
    progressCaller.popById(PROGRESS_ID);
    return null;
  }
  const whiteInkStaturation = getData(layer, 'wInk');
  const cRatio = getData(layer, 'cRatio');
  const mRatio = getData(layer, 'mRatio');
  const yRatio = getData(layer, 'yRatio');
  const kRatio = getData(layer, 'kRatio');

  const includeWhite = isDev() && whiteInkStaturation > 0;
  const channelBlobs = await splitColor(rgbBlob, cmykBlob, { includeWhite });

  const batchCmd = new history.BatchCommand('Split Full Color Layer');
  const newLayers: Element[] = [];
  const nameSuffix = ['W', 'K', 'C', 'M', 'Y'];
  const params = [
    null,
    { strength: kRatio },
    { strength: cRatio },
    { strength: mRatio },
    { strength: yRatio },
  ];
  for (let i = 0; i < nameSuffix.length; i += 1) {
    // eslint-disable-next-line no-continue
    if (i === 0 && !includeWhite) {
      newLayers.push(null);
      // eslint-disable-next-line no-continue
      continue;
    }
    const color = {
      W: PrintingColors.WHITE,
      C: PrintingColors.CYAN,
      M: PrintingColors.MAGENTA,
      Y: PrintingColors.YELLOW,
      K: PrintingColors.BLACK,
    }[nameSuffix[i]];
    const res = cloneLayer(layerName, {
      isSub: true,
      name: `${layerName} (${nameSuffix[i]})`,
      configOnly: true,
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
        writeDataLayer(elem, 'ink', whiteInkStaturation);
        writeDataLayer(elem, 'printingSpeed', whiteSpeed);
        writeDataLayer(elem, 'multipass', whiteMultipass);
        writeDataLayer(elem, 'repeat', whiteRepeat);
      } else {
        const { strength } = params[i];
        writeDataLayer(elem, 'printingStrength', strength);
      }
      layer.parentNode.insertBefore(elem, layer.nextSibling);
      newLayers.push(elem);
    }
  }

  const promises = [];
  for (let i = 0; i < newLayers.length; i += 1) {
    // eslint-disable-next-line no-continue
    if (!channelBlobs[i]) continue;
    const newImgUrl = URL.createObjectURL(channelBlobs[i]);
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
    newLayers[i].appendChild(newImage);
    const promise = updateImageDisplay(newImage);
    promises.push(promise);
  }
  await Promise.all(promises);

  const cmd = deleteLayerByName(layerName);
  if (cmd) batchCmd.addSubCommand(cmd);
  if (addToHistory && !batchCmd.isEmpty()) svgCanvas.undoMgr.addCommandToHistory(batchCmd);
  const drawing = svgCanvas.getCurrentDrawing();
  drawing.identifyLayers();
  for (let i = 0; i < newLayers.length; i += 1) {
    if (newLayers[i]) updateLayerColor(newLayers[i] as SVGGElement);
  }
  svgCanvas.clearSelection();
  progressCaller.popById(PROGRESS_ID);
  return { cmd: batchCmd, newLayers: newLayers.filter((l) => !!l) };
};

export const tempSplitFullColorLayers = async (): Promise<() => void> => {
  const allLayerNames = getAllLayerNames();
  const addedLayers = [];
  const removedLayers = [];
  const drawing = svgCanvas.getCurrentDrawing();
  const currentLayerName = drawing.getCurrentLayerName();
  for (let i = 0; i < allLayerNames.length; i += 1) {
    const layerName = allLayerNames[i];
    const layer = getLayerElementByName(layerName);
    const fullColor = getData(layer, 'fullcolor');
    const ref = getData(layer, 'ref');
    if (fullColor && layer.getAttribute('display') !== 'none' && !ref) {
      const { parentNode, nextSibling } = layer;
      const children = [...layer.childNodes] as Element[];
      // eslint-disable-next-line no-continue
      if (children.filter((c) => !['title', 'filter'].includes(c.tagName)).length === 0) continue;
      // eslint-disable-next-line no-await-in-loop
      const res = await splitFullColorLayer(layerName, { addToHistory: false });
      if (res) {
        const { newLayers } = res;
        addedLayers.push(...newLayers);
        removedLayers.push({ layer, parentNode, nextSibling });
      }
    }
  }
  const revert = () => {
    for (let i = removedLayers.length - 1; i >= 0; i -= 1) {
      const { layer, parentNode, nextSibling } = removedLayers[i];
      parentNode.insertBefore(layer, nextSibling);
    }
    for (let i = 0; i < addedLayers.length; i += 1) {
      const layer = addedLayers[i];
      layer.remove();
    }
    drawing.identifyLayers();
    drawing.setCurrentLayer(currentLayerName);
  };
  return revert;
};

export default splitFullColorLayer;
