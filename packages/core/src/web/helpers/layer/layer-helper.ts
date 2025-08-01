import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import alertConstants from '@core/app/constants/alert-constants';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { printingModules } from '@core/app/constants/layer-module/layer-modules';
import history from '@core/app/svgedit/history/history';
import HistoryCommandFactory from '@core/app/svgedit/history/HistoryCommandFactory';
import undoManager from '@core/app/svgedit/history/undoManager';
import clipboard from '@core/app/svgedit/operations/clipboard';
import LayerPanelController from '@core/app/views/beambox/Right-Panels/contexts/LayerPanelController';
import updateLayerColor from '@core/helpers/color/updateLayerColor';
import updateLayerColorFilter from '@core/helpers/color/updateLayerColorFilter';
import i18n from '@core/helpers/i18n';
import { cloneLayerConfig, getData, initLayerConfig } from '@core/helpers/layer/layer-config-helper';
import { moveSelectedToLayer } from '@core/helpers/layer/moveToLayer';
import randomColor from '@core/helpers/randomColor';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { IBatchCommand, ICommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';
import type ISVGDrawing from '@core/interfaces/ISVGDrawing';

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

    if (title && title.textContent === layerName) {
      return i;
    }
  }

  return -1;
};

export const sortLayerNamesByPosition = (layerNames: string[]): string[] => {
  const layerNamePositionMap = {};
  const allLayers = document.querySelectorAll('g.layer');

  for (let i = 0; i < allLayers.length; i += 1) {
    const title = allLayers[i].querySelector('title');

    if (title) {
      layerNamePositionMap[title.textContent] = i;
    }
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
  opts: {
    addToHistory?: boolean;
    hexCode?: string;
    initConfig?: boolean;
    isFullColor?: boolean;
    parentCmd?: IBatchCommand;
  } = {},
): { layer: SVGGElement; name: string } => {
  const drawing = svgCanvas.getCurrentDrawing();
  const { addToHistory = true, hexCode, initConfig, isFullColor = false, parentCmd } = opts || {};
  const newLayer = drawing.createLayer(name);
  const finalName = getLayerName(newLayer);

  if (initConfig) initLayerConfig(newLayer);

  if (drawing.layer_map[finalName]) {
    if (name && /^#([0-9a-f]{3}){1,2}$/i.test(name)) {
      drawing.layer_map[finalName].setColor(name);
    } else if (hexCode) {
      drawing.layer_map[finalName].setColor(hexCode);
    } else {
      drawing.layer_map[finalName].setColor(randomColor.getColor());
    }

    if (isFullColor) {
      drawing.layer_map[finalName].setFullColor(true);
    }
  }

  const batchCmd = new history.BatchCommand('Create Layer');

  batchCmd.addSubCommand(new history.InsertElementCommand(newLayer));

  if (parentCmd) parentCmd.addSubCommand(batchCmd);
  else if (addToHistory) undoManager.addCommandToHistory(batchCmd);

  updateLayerColorFilter(newLayer);
  svgCanvas.clearSelection();

  return { layer: newLayer, name: finalName };
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
    const newLayer = new svgedit.draw.Layer(LANG.layer1, null, svgcontent, '#333333').getGroup() as Element;

    batchCmd.addSubCommand(new history.InsertElementCommand(newLayer));
    initLayerConfig(newLayer);
  }

  if (!batchCmd.isEmpty()) {
    svgCanvas.undoMgr.addCommandToHistory(batchCmd);
  }

  drawing.identifyLayers();
};

export const cloneLayer = (
  layerName: string,
  opts: {
    configOnly?: boolean; // if true, only clone layer config
    isSub?: boolean; // if true, do not add command to history
    name?: string; // if provided, use this name instead of auto generated name
  },
): null | { cmd: ICommand; elem: SVGGElement; name: string } => {
  const layer = getLayerElementByName(layerName);

  if (!layer) {
    return null;
  }

  const { configOnly = false, isSub = false, name: clonedLayerName } = opts;

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

  return { cmd: batchCmd, elem: newLayer, name: newName };
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
  opts: { parentCmd?: IBatchCommand } = {},
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

  if (parentCmd) {
    parentCmd.addSubCommand(cmd);
  } else {
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

export const showMergeAlert = async (baseLayerName: string, layerNames: string[]): Promise<boolean> => {
  const targetModule = getData(getLayerElementByName(baseLayerName), 'module') as LayerModuleType;
  const isPrinting = printingModules.has(targetModule);
  const shouldShowAlert = layerNames.some((layerName) => {
    const module = getData(getLayerElementByName(layerName), 'module');

    return printingModules.has(module) !== isPrinting;
  });

  if (shouldShowAlert) {
    return new Promise<boolean>((resolve) => {
      alertCaller.popUp({
        buttonType: alertConstants.CONFIRM_CANCEL,
        caption: isPrinting
          ? LANG.notification.mergeLaserLayerToPrintingLayerTitle
          : LANG.notification.mergePrintingLayerToLaserLayerTitle,
        id: 'merge-layers',
        message: isPrinting
          ? LANG.notification.mergeLaserLayerToPrintingLayerMsg
          : LANG.notification.mergePrintingLayerToLaserLayerMsg,
        messageIcon: 'notice',
        onCancel: () => resolve(false),
        onConfirm: () => resolve(true),
      });
    });
  }

  return true;
};

const mergeLayer = (
  baseLayerName: string,
  layersToBeMerged: string[],
  shouldInsertBefore: boolean,
): IBatchCommand | null => {
  const baseLayer = getLayerElementByName(baseLayerName);

  if (!baseLayer) {
    return null;
  }

  const firstChildOfBase = Array.from(baseLayer.childNodes).find(
    (node: Element) => !['filter', 'title'].includes(node.tagName),
  );
  const batchCmd: IBatchCommand = new history.BatchCommand(`Merge into ${baseLayer}`);

  for (let i = 0; i < layersToBeMerged.length; i += 1) {
    const layer = getLayerElementByName(layersToBeMerged[i]);

    if (layer) {
      const { childNodes } = layer;

      for (let j = 0; j < childNodes.length; j += 1) {
        const child = childNodes[j];

        if (!['filter', 'title'].includes(child.nodeName)) {
          const { nextSibling } = child;

          if (shouldInsertBefore) {
            baseLayer.insertBefore(child, firstChildOfBase);
          } else {
            baseLayer.appendChild(child);
          }

          const cmd = new history.MoveElementCommand(child, nextSibling, layer);

          batchCmd.addSubCommand(cmd);
          j -= 1;
        }
      }
    }

    const cmd = deleteLayerByName(layersToBeMerged[i]);

    if (cmd) {
      batchCmd.addSubCommand(cmd);
    }
  }
  updateLayerColor(baseLayer as SVGGElement);

  return batchCmd;
};

export const mergeLayers = async (layerNames: string[], baseLayerName?: string): Promise<null | string> => {
  svgCanvas.clearSelection();

  const batchCmd = new history.BatchCommand('Merge Layer(s)');
  const drawing = svgCanvas.getCurrentDrawing();

  sortLayerNamesByPosition(layerNames);

  const mergeBase = baseLayerName || layerNames[0];
  const baseLayerIndex = layerNames.findIndex((layerName) => layerName === mergeBase);
  const res = await showMergeAlert(mergeBase, layerNames);

  if (!res) {
    return null;
  }

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
export const moveLayerToPosition = (layerName: string, newPosition: number): { cmd?: ICommand; success: boolean } => {
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
    return { cmd: null, success: true };
  }

  const anchorLayer = allLayers[newPosition]; // undefined if newPosition === allLayers.length
  const { nextSibling } = layer;
  const parent = layer.parentNode;

  if (anchorLayer) {
    parent.insertBefore(layer, anchorLayer);
  } else {
    parent.appendChild(layer);
  }

  return { cmd: new history.MoveElementCommand(layer, nextSibling, parent), success: true };
};

const insertLayerBefore = (layerName: string, anchorLayerName: string) => {
  const layer = getLayerElementByName(layerName);
  const anchorLayer = getLayerElementByName(anchorLayerName);

  if (layer && anchorLayer) {
    const { nextSibling } = layer;
    const parent = layer.parentNode;

    parent.insertBefore(layer, anchorLayer);

    const cmd = new history.MoveElementCommand(layer, nextSibling, parent);

    return { cmd, success: true };
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

export const moveToOtherLayer = (destLayer: string, callback: () => void, showAlert = true): void => {
  const moveToLayer = (ok: boolean) => {
    if (!ok) {
      return;
    }

    moveSelectedToLayer(destLayer);
    svgCanvas.getCurrentDrawing().setCurrentLayer(destLayer);
    LayerPanelController.setSelectedLayers([destLayer]);
    callback?.();
  };
  const selectedElements = svgCanvas.getSelectedElems();
  const origLayer = getObjectLayer(selectedElements[0])?.elem;
  const isPrintingLayer = origLayer && printingModules.has(getData(origLayer, 'module')!);
  const isDestPrintingLayer = printingModules.has(getData(getLayerByName(destLayer), 'module')!);
  const moveOutFromFullColorLayer = isPrintingLayer && !isDestPrintingLayer;
  const moveInToFullColorLayer = !isPrintingLayer && isDestPrintingLayer;

  if (origLayer && (moveOutFromFullColorLayer || moveInToFullColorLayer)) {
    alertCaller.popUp({
      buttonType: alertConstants.CONFIRM_CANCEL,
      caption: moveOutFromFullColorLayer
        ? sprintf(LANG.notification.moveElemFromPrintingLayerTitle, destLayer)
        : sprintf(LANG.notification.moveElemToPrintingLayerTitle, destLayer),
      id: 'move layer',
      message: moveOutFromFullColorLayer
        ? sprintf(LANG.notification.moveElemFromPrintingLayerMsg, destLayer)
        : sprintf(LANG.notification.moveElemToPrintingLayerMsg, destLayer),
      messageIcon: 'notice',
      onConfirm: () => moveToLayer(true),
    });
  } else if (showAlert) {
    alertCaller.popUp({
      buttonType: alertConstants.YES_NO,
      id: 'move layer',
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
    const isEmpty = childNodes.every((node) => ['filter', 'title'].includes((node as Element).tagName));

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
