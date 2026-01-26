import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import alertConstants from '@core/app/constants/alert-constants';
import { CanvasElements } from '@core/app/constants/canvasElements';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { printingModules } from '@core/app/constants/layer-module/layer-modules';
import useLayerStore from '@core/app/stores/layer/layerStore';
import history from '@core/app/svgedit/history/history';
import HistoryCommandFactory from '@core/app/svgedit/history/HistoryCommandFactory';
import undoManager from '@core/app/svgedit/history/undoManager';
import layerManager from '@core/app/svgedit/layer/layerManager';
import { handlePastedRef } from '@core/app/svgedit/operations/clipboard';
import updateLayerColor from '@core/helpers/color/updateLayerColor';
import updateLayerColorFilter from '@core/helpers/color/updateLayerColorFilter';
import i18n from '@core/helpers/i18n';
import { cloneLayerConfig, getData, initLayerConfig } from '@core/helpers/layer/layer-config-helper';
import { moveSelectedToLayer } from '@core/helpers/layer/moveToLayer';
import randomColor from '@core/helpers/randomColor';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { IBatchCommand, ICommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { deleteLayerByName } from './deleteLayer';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

export function getObjectLayer(elem: SVGElement): null | { elem: SVGGElement; title: string } {
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
    const origLayer = layerManager.getLayerElementByName(origLayerName);

    if (origLayer) return { elem: origLayer, title: origLayerName };
  }

  return null;
}

export const getAllLayers = (): SVGGElement[] => {
  return layerManager.getAllLayers().map((layer) => layer.getGroup());
};

export const getLayerPosition = (layerName: string): number => {
  const allLayers = layerManager.getAllLayerNames();

  return allLayers.indexOf(layerName);
};

export const sortLayerNamesByPosition = (layerNames: string[]): string[] => {
  return layerManager.getAllLayerNames().filter((name) => layerNames.includes(name));
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
  const { addToHistory = true, hexCode, initConfig, isFullColor = false, parentCmd } = opts || {};
  const batchCmd = new history.BatchCommand('Create Layer');
  const newLayer = layerManager.createLayer(name, { parentCmd: batchCmd })!;
  const layerElement = newLayer.getGroup();
  const finalName = newLayer.getName();

  if (initConfig) initLayerConfig(layerElement);

  if (name && /^#([0-9a-f]{3}){1,2}$/i.test(name)) {
    newLayer.setColor(name);
  } else if (hexCode) {
    newLayer.setColor(hexCode);
  } else {
    newLayer.setColor(randomColor.getColor());
  }

  if (isFullColor) newLayer.setFullColor(true);

  if (parentCmd) parentCmd.addSubCommand(batchCmd);
  else if (addToHistory) undoManager.addCommandToHistory(batchCmd);

  updateLayerColorFilter(layerElement);
  svgCanvas?.clearSelection();

  return { layer: layerElement, name: finalName };
};

export const cloneLayer = (
  layerName: string,
  {
    configOnly = false,
    isSub = false,
    name: clonedLayerName,
    parentCmd,
  }: {
    configOnly?: boolean; // if true, only clone layer config
    isSub?: boolean; // if true, do not add command to history
    name?: string; // if provided, use this name instead of auto generated name
    parentCmd?: IBatchCommand;
  },
): null | { cmd: ICommand; elem: SVGGElement; name: string } => {
  const layer = layerManager.getLayerElementByName(layerName);

  if (!layer) return null;

  const drawing = svgCanvas.getCurrentDrawing();
  const color = layer.getAttribute('data-color') || '#333';
  const baseName = clonedLayerName || `${layerName} copy`;
  let newName = baseName;
  let j = 0;

  while (layerManager.hasLayer(newName)) {
    j += 1;
    newName = `${baseName} ${j}`;
  }

  const batchCmd = HistoryCommandFactory.createBatchCommand('Clone Layer');
  const newLayer = layerManager.createLayer(newName, { parentCmd: batchCmd })!;
  const newLayerElem = newLayer.getGroup();

  newLayer.setColor(color);

  if (!configOnly) {
    const children = layer.childNodes;

    for (let i = 0; i < children.length; i += 1) {
      const child = children[i] as Element;

      if (child.tagName !== 'title') {
        const copiedElem = drawing.copyElem(child);

        newLayerElem.appendChild(copiedElem);
      }
    }
    handlePastedRef(newLayerElem, { parentCmd: batchCmd });
  }

  cloneLayerConfig(newName, layerName);

  if (parentCmd) {
    parentCmd.addSubCommand(batchCmd);
  } else if (!isSub) {
    undoManager.addCommandToHistory(batchCmd);
    layerManager.identifyLayers();
    svgCanvas.clearSelection();
  }

  return { cmd: batchCmd, elem: newLayerElem, name: newName };
};

export const cloneLayers = (layerNames: string[]): string[] => {
  layerNames = sortLayerNamesByPosition(layerNames);

  const clonedLayerNames: string[] = [];
  const batchCmd = new history.BatchCommand('Clone Layer(s)');

  svgCanvas.clearSelection();

  for (let i = 0; i < layerNames.length; i += 1) {
    const res = cloneLayer(layerNames[i], { isSub: true, parentCmd: batchCmd });

    if (res) {
      const { name } = res;

      clonedLayerNames.push(name);
    }
  }

  if (!batchCmd.isEmpty()) {
    undoManager.addCommandToHistory(batchCmd);
  }

  layerManager.identifyLayers();

  return clonedLayerNames;
};

export const setLayerLock = (
  layerName: string,
  isLocked: boolean,
  opts: { parentCmd?: IBatchCommand } = {},
): ICommand | null => {
  const { parentCmd } = opts;
  const layer = layerManager.getLayerElementByName(layerName);

  if (!layer) return null;

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
    cmd.onAfter = () => useLayerStore.getState().forceUpdate();
    undoManager.addCommandToHistory(cmd);
  }

  return cmd;
};

export const setLayersLock = (layerNames: string[], isLocked: boolean): IBatchCommand => {
  const batchCmd = HistoryCommandFactory.createBatchCommand('Set Layer(s) Lock');

  for (let i = 0; i < layerNames.length; i += 1) {
    setLayerLock(layerNames[i], isLocked, { parentCmd: batchCmd });
  }

  if (!batchCmd.isEmpty()) {
    batchCmd.onAfter = () => useLayerStore.getState().forceUpdate();
    undoManager.addCommandToHistory(batchCmd);
  }

  return batchCmd;
};

export const showMergeAlert = async (baseLayerName: string, layerNames: string[]): Promise<boolean> => {
  const targetModule = getData(layerManager.getLayerElementByName(baseLayerName)!, 'module') as LayerModuleType;
  const isPrinting = printingModules.has(targetModule);
  const shouldShowAlert = layerNames.some((layerName) => {
    const module = getData(layerManager.getLayerElementByName(layerName)!, 'module')!;

    return printingModules.has(module) !== isPrinting;
  });

  if (shouldShowAlert) {
    const t = i18n.lang.beambox.right_panel.layer_panel.notification;

    return new Promise<boolean>((resolve) => {
      alertCaller.popUp({
        buttonType: alertConstants.CONFIRM_CANCEL,
        caption: isPrinting ? t.mergeLaserLayerToPrintingLayerTitle : t.mergePrintingLayerToLaserLayerTitle,
        id: 'merge-layers',
        message: isPrinting ? t.mergeLaserLayerToPrintingLayerMsg : t.mergePrintingLayerToLaserLayerMsg,
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
  const baseLayer = layerManager.getLayerElementByName(baseLayerName);

  if (!baseLayer) {
    return null;
  }

  const firstChildOfBase = Array.from(baseLayer.childNodes).find(
    (node) => !CanvasElements.defElems.includes((node as Element).tagName),
  );
  const batchCmd: IBatchCommand = new history.BatchCommand(`Merge into ${baseLayer}`);

  for (let i = 0; i < layersToBeMerged.length; i += 1) {
    const layer = layerManager.getLayerElementByName(layersToBeMerged[i]);

    if (layer) {
      const { childNodes } = layer;

      for (let j = 0; j < childNodes.length; j += 1) {
        const child = childNodes[j];

        if (!CanvasElements.defElems.includes(child.nodeName)) {
          const { nextSibling } = child;

          if (shouldInsertBefore && firstChildOfBase) {
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

    deleteLayerByName(layersToBeMerged[i], { parentCmd: batchCmd });
  }
  updateLayerColor(baseLayer as SVGGElement);

  return batchCmd;
};

export const mergeLayers = async (layerNames: string[], baseLayerName?: string): Promise<null | string> => {
  svgCanvas.clearSelection();

  const batchCmd = new history.BatchCommand('Merge Layer(s)');

  layerNames = sortLayerNamesByPosition(layerNames);

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
    undoManager.addCommandToHistory(batchCmd);
  }

  layerManager.identifyLayers();

  return mergeBase;
};

// pos  : 0 - 1 - 2 - 3 - 4 - 5 - 6
// array: | 0 | 1 | 2 | 3 | 4 | 5 |
// use insertBefore node[pos], so moving from i to pos i or i+1 means nothing.
export const moveLayerToPosition = (layerName: string, newPosition: number): { cmd?: ICommand; success: boolean } => {
  const allLayers = document.querySelectorAll('g.layer');
  let layer: Element | null = null;
  let currentPosition = -1;

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
    return { cmd: undefined, success: true };
  }

  const anchorLayer = allLayers[newPosition]; // undefined if newPosition === allLayers.length
  const { nextSibling } = layer;
  const parent = layer.parentNode!;

  if (anchorLayer) {
    parent.insertBefore(layer, anchorLayer);
  } else {
    parent.appendChild(layer);
  }

  return { cmd: new history.MoveElementCommand(layer, nextSibling, parent), success: true };
};

const insertLayerBefore = (layerName: string, anchorLayerName: string) => {
  const layer = layerManager.getLayerElementByName(layerName);
  const anchorLayer = layerManager.getLayerElementByName(anchorLayerName);

  if (layer && anchorLayer) {
    const { nextSibling } = layer;
    const parent = layer.parentNode!;

    parent.insertBefore(layer, anchorLayer);

    const cmd = new history.MoveElementCommand(layer, nextSibling, parent);

    return { cmd, success: true };
  }

  return { success: false };
};

export const moveLayersToPosition = (layerNames: string[], newPosition: number): void => {
  const batchCmd = new history.BatchCommand('Move Layer(s)');
  const currentLayerName = layerManager.getCurrentLayerName()!;

  layerNames = sortLayerNamesByPosition(layerNames);

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
    layerManager.identifyLayers();
    layerManager.setCurrentLayer(currentLayerName);
    undoManager.addCommandToHistory(batchCmd);
  }
};

export const highlightLayer = (layerName?: string): void => {
  const allLayerNames = layerManager.getAllLayerNames();

  if (layerName) {
    allLayerNames.forEach((name) => {
      if (name !== layerName) layerManager.setLayerOpacity(name, 0.5);
    });
  } else {
    allLayerNames.forEach((name) => {
      layerManager.setLayerOpacity(name, 1.0);
    });
  }
};

export const getLayerByName = (layerName: string): null | SVGGElement => {
  return layerManager.getLayerElementByName(layerName);
};

export const moveToOtherLayer = (destLayer: string, callback: () => void, showAlert = true): void => {
  const moveToLayer = (ok: boolean) => {
    if (!ok) {
      return;
    }

    moveSelectedToLayer(destLayer);
    layerManager.setCurrentLayer(destLayer);
    useLayerStore.getState().setSelectedLayers([destLayer]);
    callback?.();
  };
  const selectedElements = svgCanvas.getSelectedElems();
  const origLayer = getObjectLayer(selectedElements[0])?.elem;
  const isPrintingLayer = origLayer && printingModules.has(getData(origLayer, 'module')!);
  const isDestPrintingLayer = printingModules.has(getData(getLayerByName(destLayer)!, 'module')!);
  const moveOutFromFullColorLayer = isPrintingLayer && !isDestPrintingLayer;
  const moveInToFullColorLayer = !isPrintingLayer && isDestPrintingLayer;
  const t = i18n.lang.beambox.right_panel.layer_panel.notification;

  if (origLayer && (moveOutFromFullColorLayer || moveInToFullColorLayer)) {
    alertCaller.popUp({
      buttonType: alertConstants.CONFIRM_CANCEL,
      caption: moveOutFromFullColorLayer
        ? sprintf(t.moveElemFromPrintingLayerTitle, destLayer)
        : sprintf(t.moveElemToPrintingLayerTitle, destLayer),
      id: 'move layer',
      message: moveOutFromFullColorLayer
        ? sprintf(t.moveElemFromPrintingLayerMsg, destLayer)
        : sprintf(t.moveElemToPrintingLayerMsg, destLayer),
      messageIcon: 'notice',
      onConfirm: () => moveToLayer(true),
    });
  } else if (showAlert) {
    alertCaller.popUp({
      buttonType: alertConstants.YES_NO,
      id: 'move layer',
      message: sprintf(t.QmoveElemsToLayer, destLayer),
      messageIcon: 'notice',
      onYes: moveToLayer,
    });
  } else {
    moveToLayer(true);
  }
};
