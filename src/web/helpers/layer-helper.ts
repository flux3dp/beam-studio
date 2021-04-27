import { IBatchCommand, ICommand } from 'interfaces/IHistory';
import { getSVGAsync } from './svg-editor-helper';
import { cloneLayerConfig } from './laser-config-helper';
import * as i18n from './i18n';

const LANG = i18n.lang.beambox.right_panel.layer_panel;

let svgCanvas;
let svgedit;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
  svgedit = globalSVG.Edit;
});

export function getObjectLayer(elem: Element): { elem: Element, title: string } {
  let p: Element = elem;
  while (p) {
    p = p.parentNode as Element;
    if (p && p.getAttribute && p.getAttribute('class') && p.getAttribute('class').indexOf('layer') >= 0) {
      const title = $(p).find('title')[0];
      if (title) {
        return { elem: p, title: title.innerHTML };
      }
    }
  }
  // When multi selecting, elements does not belong to any layer
  // So get layer from data original layer
  const origLayer = elem.getAttribute('data-original-layer');
  if (origLayer) {
    const drawing = svgCanvas.getCurrentDrawing();
    const layer = drawing.getLayerByName(origLayer);
    if (layer) {
      return { elem: layer, title: origLayer };
    }
  }
  return null;
}

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

export const deleteLayerByName = (layerName: string): IBatchCommand => {
  const layer = getLayerElementByName(layerName);
  if (layer) {
    const { nextSibling } = layer;
    const parent = layer.parentNode;
    layer.remove();
    return new svgedit.history.RemoveElementCommand(layer, nextSibling, parent);
  }
  return null;
};

export const deleteLayers = (layerNames: string[]): void => {
  const drawing = svgCanvas.getCurrentDrawing();
  const batchCmd: IBatchCommand = new svgedit.history.BatchCommand('Delete Layer(s)');
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
    batchCmd.addSubCommand(new svgedit.history.InsertElementCommand(newLayer));
  }
  if (!batchCmd.isEmpty()) {
    svgCanvas.undoMgr.addCommandToHistory(batchCmd);
  }
  drawing.identifyLayers();
  svgCanvas.clearSelection();
};

export const cloneLayerByName = (layerName: string, newLayerName: string): ICommand => {
  const layer = getLayerElementByName(layerName);
  if (layer) {
    const color = layer.getAttribute('data-color') || '#333';
    const svgcontent = document.getElementById('svgcontent');
    const newLayer = new svgedit.draw.Layer(newLayerName, null, svgcontent, color).getGroup();
    const children = layer.childNodes;
    for (let i = 0; i < children.length; i += 1) {
      const child = children[i] as Element;
      if (child.tagName !== 'title') {
        const copiedElem = svgCanvas.getCurrentDrawing().copyElem(child);
        newLayer.appendChild(copiedElem);
      }
    }
    cloneLayerConfig(newLayerName, layerName);
    return new svgedit.history.InsertElementCommand(newLayer);
  }
  return null;
};

export const cloneSelectedLayers = (layerNames: string[]): string[] => {
  sortLayerNamesByPosition(layerNames);
  const newSelectLayers = [];
  const drawing = svgCanvas.getCurrentDrawing();
  const batchCmd = new svgedit.history.BatchCommand('Clone Layer(s)');
  for (let i = 0; i < layerNames.length; i += 1) {
    let newName = `${layerNames[i]} copy`;
    let j = 0;
    while (drawing.hasLayer(newName)) {
      j += 1;
      newName = `${newName} ${j}`;
    }
    const cmd = cloneLayerByName(layerNames[i], newName);
    if (cmd) {
      batchCmd.addSubCommand(cmd);
      newSelectLayers.push(newName);
    }
  }
  if (!batchCmd.isEmpty()) {
    svgCanvas.undoMgr.addCommandToHistory(batchCmd);
  }
  drawing.identifyLayers();
  svgCanvas.clearSelection();
  return newSelectLayers as string[];
};

export const setLayerLock = (layerName: string, isLocked: boolean): void => {
  const layer = getLayerElementByName(layerName);
  if (isLocked) {
    layer.setAttribute('data-lock', 'true');
  } else {
    layer.removeAttribute('data-lock');
  }
};

export const setLayersLock = (layerNames: string[], isLocked: boolean): void => {
  for (let i = 0; i < layerNames.length; i += 1) {
    setLayerLock(layerNames[i], isLocked);
  }
};

export const mergeLayer = (
  baseLayerName: string,
  layersToBeMerged: string[],
  shouldInsertBefore: boolean,
) : IBatchCommand => {
  const baseLayer = getLayerElementByName(baseLayerName);
  if (baseLayer) {
    const firstChildOfBase = Array.from(baseLayer.childNodes).find((node: Element) => !['title', 'filter'].includes(node.tagName));
    const batchCmd: IBatchCommand = new svgedit.history.BatchCommand(`Merge into ${baseLayer}`);
    for (let i = 0; i < layersToBeMerged.length; i += 1) {
      const layer = getLayerElementByName(layersToBeMerged[i]);
      if (layer) {
        const { childNodes } = layer;
        for (let j = 0; j < childNodes.length; j += 1) {
          const child = childNodes[j];
          if (!['title', 'filter'].includes(child.nodeName)) {
            const { nextSibling } = child;
            if (shouldInsertBefore) {
              baseLayer.insertBefore(child, firstChildOfBase);
            } else {
              baseLayer.appendChild(child);
            }
            const cmd = new svgedit.history.MoveElementCommand(child, nextSibling, layer);
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
    svgCanvas.updateLayerColor(baseLayer);
    return batchCmd;
  }
  return null;
};

export const mergeSelectedLayers = (layerNames: string[], baseLayerName?: string): string => {
  svgCanvas.clearSelection();
  const batchCmd = new svgedit.history.BatchCommand('Merge Layer(s)');
  const drawing = svgCanvas.getCurrentDrawing();
  sortLayerNamesByPosition(layerNames);
  const mergeBase = baseLayerName || layerNames[0];
  const baseLayerIndex = layerNames.findIndex(((layerName) => layerName === mergeBase));

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
  newPosition: number,
): { success: boolean, cmd?: ICommand } => {
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
  return { success: true, cmd: new svgedit.history.MoveElementCommand(layer, nextSibling, parent) };
};

const insertLayerBefore = (layerName: string, anchorLayerName: string) => {
  const layer = getLayerElementByName(layerName);
  const anchorLayer = getLayerElementByName(anchorLayerName);
  if (layer && anchorLayer) {
    const { nextSibling } = layer;
    const parent = layer.parentNode;
    parent.insertBefore(layer, anchorLayer);
    const cmd = new svgedit.history.MoveElementCommand(layer, nextSibling, parent);
    return { success: true, cmd };
  }
  return { success: false };
};

export const moveLayersToPosition = (layerNames: string[], newPosition: number): void => {
  const batchCmd = new svgedit.history.BatchCommand('Move Layer(s)');
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
