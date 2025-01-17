import { sprintf } from 'sprintf-js';

import alertCaller from 'app/actions/alert-caller';
import alertConstants from 'app/constants/alert-constants';
import clipboard from 'app/svgedit/operations/clipboard';
import HistoryCommandFactory from 'app/svgedit/history/HistoryCommandFactory';
import history from 'app/svgedit/history/history';
import ISVGCanvas from 'interfaces/ISVGCanvas';
import ISVGDrawing from 'interfaces/ISVGDrawing';
import i18n from 'helpers/i18n';
import LayerModule from 'app/constants/layer-module/layer-modules';
import LayerPanelController from 'app/views/beambox/Right-Panels/contexts/LayerPanelController';
import randomColor from 'helpers/randomColor';
import updateLayerColor from 'helpers/color/updateLayerColor';
import updateLayerColorFilter from 'helpers/color/updateLayerColorFilter';
import { cloneLayerConfig, getData, initLayerConfig } from 'helpers/layer/layer-config-helper';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { moveSelectedToLayer } from 'helpers/layer/moveToLayer';
import { IBatchCommand, ICommand } from 'interfaces/IHistory';

const LANG = i18n.lang.beambox.right_panel.layer_panel;

let svgCanvas: ISVGCanvas;
let svgedit: ISVGDrawing;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
  svgedit = globalSVG.Edit;
});

export function getObjectLayer(elem: SVGElement): { elem: SVGGElement; title: string } {
  const layer = elem.closest('g.layer');
  if (layer) {
    const title = layer.querySelector('title');
    if (title) {
      return { elem: layer as SVGGElement, title: title.innerHTML };
    }
  }
  // When multi selecting, elements does not belong to any layer
  // So get layer from data original layer
  const origLayerName = elem.getAttribute('data-original-layer');
  if (origLayerName) {
    const drawing = svgCanvas.getCurrentDrawing();
    const origLayer = drawing.getLayerByName(origLayerName);
    if (origLayer) {
      return { elem: origLayer, title: origLayerName };
    }
  }
  return null;
}

export const getAllLayers = (): SVGGElement[] => {
  const allLayers = document.querySelectorAll('g.layer');
  return Array.from(allLayers) as SVGGElement[];
};

export const getAllLayerNames = (): string[] => {
  const allLayers = document.querySelectorAll('#svgcontent g.layer');
  const layerNames = [];
  for (let i = 0; i < allLayers.length; i += 1) {
    const title = allLayers[i].querySelector('title');
    if (title) {
      layerNames.push(title.textContent);
    }
  }
  return layerNames;
};

export const getLayerPosition = (layerName: string): number => {
  const allLayers = document.querySelectorAll('g.layer');
  for (let i = 0; i < allLayers.length; i += 1) {
    const title = allLayers[i].querySelector('title');
    if (title && title.textContent === layerName) return i;
  }
  return -1;
};

export const sortLayerNamesByPosition = (layerNames: string[]): string[] => {
  const layerNamePositionMap = {};
  const allLayers = document.querySelectorAll('g.layer');
  for (let i = 0; i < allLayers.length; i += 1) {
    const title = allLayers[i].querySelector('title');
    if (title) layerNamePositionMap[title.textContent] = i;
  }
  for (let i = layerNames.length - 1; i >= 0; i -= 1) {
    if (!(layerNamePositionMap[layerNames[i]] > -1)) {
      layerNames.splice(i, 1);
    }
  }
  layerNames.sort((a, b) => layerNamePositionMap[a] - layerNamePositionMap[b]);
  return layerNames;
};

export const getLayerElementByName = (layerName: string): Element => {
  const allLayers = Array.from(document.querySelectorAll('g.layer'));
  const layer = allLayers.find((l) => {
    const title = l.querySelector('title');
    if (title) {
      return title.textContent === layerName;
    }
    return false;
  });
  return layer;
};

export const getLayerName = (layer: Element): string => {
  const title = layer.querySelector('title');
  if (title) {
    return title.textContent;
  }
  return '';
};

// TODO: add unittest
export const createLayer = (
  name: string,
  opts?: { hexCode?: string; isFullColor?: boolean; isSubCmd?: boolean }
): { layer: SVGGElement; name: string; cmd: IBatchCommand } => {
  const drawing = svgCanvas.getCurrentDrawing();
  const { hexCode, isFullColor = false, isSubCmd = false } = opts || {};
  const newLayer = drawing.createLayer(name);
  const finalName = getLayerName(newLayer);
  if (drawing.layer_map[finalName]) {
    if (name && /^#([0-9a-f]{3}){1,2}$/i.test(name)) drawing.layer_map[finalName].setColor(name);
    else if (hexCode) drawing.layer_map[finalName].setColor(hexCode);
    else drawing.layer_map[finalName].setColor(randomColor.getColor());
    if (isFullColor) drawing.layer_map[finalName].setFullColor(true);
  }
  const batchCmd = new history.BatchCommand('Create Layer');
  batchCmd.addSubCommand(new history.InsertElementCommand(newLayer));
  if (!isSubCmd) svgCanvas.undoMgr.addCommandToHistory(batchCmd);
  updateLayerColorFilter(newLayer);
  svgCanvas.clearSelection();
  return { layer: newLayer, name: finalName, cmd: batchCmd };
};

export const deleteLayerByName = (layerName: string): ICommand => {
  const layer = getLayerElementByName(layerName);
  if (layer) {
    const { nextSibling } = layer;
    const parent = layer.parentNode;
    layer.remove();
    return new history.RemoveElementCommand(layer, nextSibling, parent);
  }
  return null;
};

export const deleteLayers = (layerNames: string[]): void => {
  const drawing = svgCanvas.getCurrentDrawing();
  const batchCmd: IBatchCommand = new history.BatchCommand('Delete Layer(s)');

  svgCanvas.clearSelection();

  for (let i = 0; i < layerNames.length; i += 1) {
    const cmd = deleteLayerByName(layerNames[i]);

    if (cmd) {
      batchCmd.addSubCommand(cmd);
    }
  }

  const layerCounts = document.querySelectorAll('g.layer').length;

  if (!layerCounts) {
    const svgcontent = document.getElementById('svgcontent');
    const newLayer = new svgedit.draw.Layer(
      LANG.layer1,
      null,
      svgcontent,
      '#333333'
    ).getGroup() as Element;

    batchCmd.addSubCommand(new history.InsertElementCommand(newLayer));
    initLayerConfig(LANG.layer1);
  }

  if (!batchCmd.isEmpty()) {
    svgCanvas.undoMgr.addCommandToHistory(batchCmd);
  }

  drawing.identifyLayers();
};

export const cloneLayer = (
  layerName: string,
  opts: {
    isSub?: boolean; // if true, do not add command to history
    name?: string; // if provided, use this name instead of auto generated name
    configOnly?: boolean; // if true, only clone layer config
  }
): { name: string; cmd: ICommand; elem: SVGGElement } | null => {
  const layer = getLayerElementByName(layerName);
  if (!layer) return null;
  const { isSub = false, name: clonedLayerName, configOnly = false } = opts;

  const drawing = svgCanvas.getCurrentDrawing();
  const color = layer.getAttribute('data-color') || '#333';
  const svgcontent = document.getElementById('svgcontent');
  const baseName = clonedLayerName || `${layerName} copy`;
  let newName = baseName;
  let j = 0;
  while (drawing.hasLayer(newName)) {
    j += 1;
    newName = `${baseName} ${j}`;
  }
  const newLayer = new svgedit.draw.Layer(newName, null, svgcontent, color).getGroup();
  const batchCmd = HistoryCommandFactory.createBatchCommand('Clone Layer');
  if (!configOnly) {
    const children = layer.childNodes;
    for (let i = 0; i < children.length; i += 1) {
      const child = children[i] as Element;
      if (child.tagName !== 'title') {
        const copiedElem = drawing.copyElem(child);
        newLayer.appendChild(copiedElem);
      }
    }
    clipboard.handlePastedRef(newLayer, { parentCmd: batchCmd });
  }
  cloneLayerConfig(newName, layerName);
  batchCmd.addSubCommand(new history.InsertElementCommand(newLayer));
  if (!isSub) {
    svgCanvas.undoMgr.addCommandToHistory(batchCmd);
    drawing.identifyLayers();
    svgCanvas.clearSelection();
  }
  return { name: newName, cmd: batchCmd, elem: newLayer };
};

export const cloneLayers = (layerNames: string[]): string[] => {
  sortLayerNamesByPosition(layerNames);
  const clonedLayerNames: string[] = [];
  const drawing = svgCanvas.getCurrentDrawing();
  const batchCmd = new history.BatchCommand('Clone Layer(s)');

  svgCanvas.clearSelection();

  for (let i = 0; i < layerNames.length; i += 1) {
    const res = cloneLayer(layerNames[i], { isSub: true });
    if (res) {
      const { cmd, name } = res;
      batchCmd.addSubCommand(cmd);
      clonedLayerNames.push(name);
    }
  }
  if (!batchCmd.isEmpty()) {
    svgCanvas.undoMgr.addCommandToHistory(batchCmd);
  }

  drawing.identifyLayers();

  return clonedLayerNames;
};

export const setLayerLock = (
  layerName: string,
  isLocked: boolean,
  opts: { parentCmd?: IBatchCommand } = {}
): ICommand => {
  const { parentCmd } = opts;
  const layer = getLayerElementByName(layerName);
  const origValue = layer.getAttribute('data-lock') === 'true';
  if (isLocked) {
    layer.setAttribute('data-lock', 'true');
  } else {
    layer.removeAttribute('data-lock');
  }
  const cmd = new history.ChangeElementCommand(layer, {
    'data-lock': origValue ? 'true' : undefined,
  });
  if (parentCmd) parentCmd.addSubCommand(cmd);
  else {
    cmd.onAfter = () => LayerPanelController.updateLayerPanel();
    svgCanvas.undoMgr.addCommandToHistory(cmd);
  }
  return cmd;
};

export const setLayersLock = (layerNames: string[], isLocked: boolean): IBatchCommand => {
  const batchCmd = HistoryCommandFactory.createBatchCommand('Set Layer(s) Lock');
  for (let i = 0; i < layerNames.length; i += 1) {
    setLayerLock(layerNames[i], isLocked, { parentCmd: batchCmd });
  }
  if (!batchCmd.isEmpty()) {
    batchCmd.onAfter = () => LayerPanelController.updateLayerPanel();
    svgCanvas.undoMgr.addCommandToHistory(batchCmd);
  }
  return batchCmd;
};

export const showMergeAlert = async (
  baseLayerName: string,
  layerNames: string[]
): Promise<boolean> => {
  const targetModule: LayerModule = getData(getLayerElementByName(baseLayerName), 'module');
  const modules = new Set<LayerModule>(
    layerNames.map((layerName) => getData(getLayerElementByName(layerName), 'module'))
  );
  modules.add(targetModule);
  if (modules.has(LayerModule.PRINTER) && modules.size > 1) {
    return new Promise<boolean>((resolve) => {
      alertCaller.popUp({
        id: 'merge-layers',
        caption:
          targetModule === LayerModule.PRINTER
            ? LANG.notification.mergeLaserLayerToPrintingLayerTitle
            : LANG.notification.mergePrintingLayerToLaserLayerTitle,
        message:
          targetModule === LayerModule.PRINTER
            ? LANG.notification.mergeLaserLayerToPrintingLayerMsg
            : LANG.notification.mergePrintingLayerToLaserLayerMsg,
        messageIcon: 'notice',
        buttonType: alertConstants.CONFIRM_CANCEL,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
  }
  return true;
};

const mergeLayer = (
  baseLayerName: string,
  layersToBeMerged: string[],
  shouldInsertBefore: boolean
): IBatchCommand | null => {
  const baseLayer = getLayerElementByName(baseLayerName);
  if (!baseLayer) return null;

  const firstChildOfBase = Array.from(baseLayer.childNodes).find(
    (node: Element) => !['title', 'filter'].includes(node.tagName)
  );
  const batchCmd: IBatchCommand = new history.BatchCommand(`Merge into ${baseLayer}`);
  for (let i = 0; i < layersToBeMerged.length; i += 1) {
    const layer = getLayerElementByName(layersToBeMerged[i]);
    if (layer) {
      const { childNodes } = layer;
      for (let j = 0; j < childNodes.length; j += 1) {
        const child = childNodes[j];
        if (!['title', 'filter'].includes(child.nodeName)) {
          const { nextSibling } = child;
          if (shouldInsertBefore) baseLayer.insertBefore(child, firstChildOfBase);
          else baseLayer.appendChild(child);

          const cmd = new history.MoveElementCommand(child, nextSibling, layer);
          batchCmd.addSubCommand(cmd);
          j -= 1;
        }
      }
    }
    const cmd = deleteLayerByName(layersToBeMerged[i]);
    if (cmd) batchCmd.addSubCommand(cmd);
  }
  updateLayerColor(baseLayer as SVGGElement);
  return batchCmd;
};

export const mergeLayers = async (
  layerNames: string[],
  baseLayerName?: string
): Promise<string | null> => {
  svgCanvas.clearSelection();
  const batchCmd = new history.BatchCommand('Merge Layer(s)');
  const drawing = svgCanvas.getCurrentDrawing();
  sortLayerNamesByPosition(layerNames);
  const mergeBase = baseLayerName || layerNames[0];
  const baseLayerIndex = layerNames.findIndex((layerName) => layerName === mergeBase);
  const res = await showMergeAlert(mergeBase, layerNames);
  if (!res) return null;
  let cmd = mergeLayer(mergeBase, layerNames.slice(0, baseLayerIndex), true);
  if (cmd && !cmd.isEmpty()) {
    batchCmd.addSubCommand(cmd);
  }
  cmd = mergeLayer(mergeBase, layerNames.slice(baseLayerIndex + 1), false);
  if (cmd && !cmd.isEmpty()) {
    batchCmd.addSubCommand(cmd);
  }

  if (!batchCmd.isEmpty()) {
    svgCanvas.undoMgr.addCommandToHistory(batchCmd);
  }
  drawing.identifyLayers();
  return mergeBase;
};

// pos  : 0 - 1 - 2 - 3 - 4 - 5 - 6
// array: | 0 | 1 | 2 | 3 | 4 | 5 |
// use insertBefore node[pos], so moving from i to pos i or i+1 means nothing.
export const moveLayerToPosition = (
  layerName: string,
  newPosition: number
): { success: boolean; cmd?: ICommand } => {
  const allLayers = document.querySelectorAll('g.layer');
  let layer = null as Element;
  let currentPosition = null;
  for (let i = 0; i < allLayers.length; i += 1) {
    const title = allLayers[i].querySelector('title');
    if (title && title.textContent === layerName) {
      currentPosition = i;
      layer = allLayers[i];
      break;
    }
  }
  if (!layer) {
    // console.error('Layer not exist');
    return { success: false };
  }
  if (newPosition < 0 || newPosition > allLayers.length) {
    // console.error('Position out of range');
    return { success: false };
  }
  if (newPosition === currentPosition || newPosition === currentPosition + 1) {
    return { success: true, cmd: null };
  }
  const anchorLayer = allLayers[newPosition]; // undefined if newPosition === allLayers.length
  const { nextSibling } = layer;
  const parent = layer.parentNode;
  if (anchorLayer) {
    parent.insertBefore(layer, anchorLayer);
  } else {
    parent.appendChild(layer);
  }
  return { success: true, cmd: new history.MoveElementCommand(layer, nextSibling, parent) };
};

const insertLayerBefore = (layerName: string, anchorLayerName: string) => {
  const layer = getLayerElementByName(layerName);
  const anchorLayer = getLayerElementByName(anchorLayerName);
  if (layer && anchorLayer) {
    const { nextSibling } = layer;
    const parent = layer.parentNode;
    parent.insertBefore(layer, anchorLayer);
    const cmd = new history.MoveElementCommand(layer, nextSibling, parent);
    return { success: true, cmd };
  }
  return { success: false };
};

export const moveLayersToPosition = (layerNames: string[], newPosition: number): void => {
  const batchCmd = new history.BatchCommand('Move Layer(s)');
  const drawing = svgCanvas.getCurrentDrawing();
  const currentLayerName = drawing.getCurrentLayerName();
  sortLayerNamesByPosition(layerNames);
  let lastLayerName = null;
  for (let i = layerNames.length - 1; i >= 0; i -= 1) {
    let res = null;
    if (!lastLayerName) {
      res = moveLayerToPosition(layerNames[i], newPosition);
    } else {
      res = insertLayerBefore(layerNames[i], lastLayerName);
    }
    if (res.success) {
      if (res.cmd) {
        batchCmd.addSubCommand(res.cmd);
      }
      lastLayerName = layerNames[i];
    }
  }
  if (!batchCmd.isEmpty()) {
    drawing.identifyLayers();
    drawing.setCurrentLayer(currentLayerName);
    svgCanvas.undoMgr.addCommandToHistory(batchCmd);
  }
};

export const highlightLayer = (layerName?: string): void => {
  let i: number;
  const curNames = [];
  const numLayers = svgCanvas.getCurrentDrawing().getNumLayers();
  for (i = 0; i < numLayers; i += 1) {
    curNames[i] = svgCanvas.getCurrentDrawing().getLayerName(i);
  }

  if (layerName) {
    for (i = 0; i < numLayers; i += 1) {
      if (curNames[i] !== layerName) {
        svgCanvas.getCurrentDrawing().setLayerOpacity(curNames[i], 0.5);
      }
    }
  } else {
    for (i = 0; i < numLayers; i += 1) {
      svgCanvas.getCurrentDrawing().setLayerOpacity(curNames[i], 1.0);
    }
  }
};

export const getCurrentLayerName = (): string => {
  const drawing = svgCanvas.getCurrentDrawing();
  return drawing.getCurrentLayerName();
};

export const getLayerByName = (layerName: string): SVGGElement => {
  const drawing = svgCanvas?.getCurrentDrawing();
  return drawing?.getLayerByName(layerName);
};

export const moveToOtherLayer = (
  destLayer: string,
  callback: () => void,
  showAlert = true
): void => {
  const moveToLayer = (ok) => {
    if (!ok) return;
    moveSelectedToLayer(destLayer);
    svgCanvas.getCurrentDrawing().setCurrentLayer(destLayer);
    LayerPanelController.setSelectedLayers([destLayer]);
    callback?.();
  };
  const selectedElements = svgCanvas.getSelectedElems();
  const origLayer = getObjectLayer(selectedElements[0])?.elem;
  const isPrintingLayer = origLayer && getData(origLayer, 'module') === LayerModule.PRINTER;
  const isDestPrintingLayer = getData(getLayerByName(destLayer), 'module') === LayerModule.PRINTER;
  const moveOutFromFullColorLayer = isPrintingLayer && !isDestPrintingLayer;
  const moveInToFullColorLayer = !isPrintingLayer && isDestPrintingLayer;
  if (origLayer && (moveOutFromFullColorLayer || moveInToFullColorLayer)) {
    alertCaller.popUp({
      id: 'move layer',
      buttonType: alertConstants.CONFIRM_CANCEL,
      caption: moveOutFromFullColorLayer
        ? sprintf(LANG.notification.moveElemFromPrintingLayerTitle, destLayer)
        : sprintf(LANG.notification.moveElemToPrintingLayerTitle, destLayer),
      message: moveOutFromFullColorLayer
        ? sprintf(LANG.notification.moveElemFromPrintingLayerMsg, destLayer)
        : sprintf(LANG.notification.moveElemToPrintingLayerMsg, destLayer),
      messageIcon: 'notice',
      onConfirm: () => moveToLayer(true),
    });
  } else if (showAlert) {
    alertCaller.popUp({
      id: 'move layer',
      buttonType: alertConstants.YES_NO,
      message: sprintf(LANG.notification.QmoveElemsToLayer, destLayer),
      messageIcon: 'notice',
      onYes: moveToLayer,
    });
  } else {
    moveToLayer(true);
  }
};

// TODO: add unittest
export const removeDefaultLayerIfEmpty = (): ICommand | null => {
  const defaultLayerName = LANG.layer1;
  const drawing = svgCanvas.getCurrentDrawing();
  const layer = drawing.getLayerByName(defaultLayerName);
  const layerCount = drawing.getNumLayers();
  if (layer && layerCount > 1) {
    const childNodes = Array.from(layer.childNodes);
    const isEmpty = childNodes.every((node: Element) => ['title', 'filter'].includes(node.tagName));
    if (isEmpty) {
      console.log('default layer is empty. delete it!');
      const cmd = deleteLayerByName(defaultLayerName);
      drawing.identifyLayers();
      LayerPanelController.setSelectedLayers([]);
      LayerPanelController.updateLayerPanel();
      return cmd;
    }
  }
  return null;
};
