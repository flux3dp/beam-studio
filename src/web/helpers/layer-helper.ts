import { getSVGAsync } from './svg-editor-helper';
import { cloneLayerConfig } from './laser-config-helper'
import * as i18n from './i18n';
const LANG = i18n.lang.beambox.right_panel.layer_panel;

let svgCanvas, svgedit;
getSVGAsync((globalSVG) => {
    svgCanvas = globalSVG.Canvas;
    svgedit = globalSVG.Edit;
});

export const sortLayerNamesByPosition = (layerNames: string[]) => {
    const layerNamePositionMap = {};
    const allLayers = document.querySelectorAll('g.layer');
    for (let i = 0; i < allLayers.length; i++) {
        const title = allLayers[i].querySelector('title');
        if (title) layerNamePositionMap[title.textContent] = i;
    }
    for (let i = layerNames.length - 1; i >= 0; i--) {
        if (!(layerNamePositionMap[layerNames[i]] > -1)) {
            layerNames.splice(i, 1);
        }
    }
    layerNames.sort((a, b) => {
        return layerNamePositionMap[a] - layerNamePositionMap[b];
    });
    return layerNames;
};

export const getLayerElementByName = (layerName: string) => {
    const allLayers = Array.from(document.querySelectorAll('g.layer'));
    const layer = allLayers.find((layer) => {
        const title = layer.querySelector('title');
        if (title) {
            return title.textContent === layerName;
        }
        return false;
    });
    return layer;
};

export const getLayerName = (layer: Element) => {
    const title = layer.querySelector('title');
    if (title) {
        return title.textContent;
    }
    return '';
};

export const deleteLayers = (layerNames: string[]) => {
    const drawing = svgCanvas.getCurrentDrawing();
    const batchCmd = new svgedit.history.BatchCommand('Delete Layer(s)');
    for (let i = 0; i < layerNames.length; i++) {
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

export const deleteLayerByName = (layerName: string) => {
    const layer = getLayerElementByName(layerName);
    if (layer) {
        const nextSibling = layer.nextSibling;
        const parent = layer.parentNode;
        layer.remove();
        return new svgedit.history.RemoveElementCommand(layer, nextSibling, parent);
    }
    return null;
};

export const cloneSelectedLayers = (layerNames: string[]) => {
    sortLayerNamesByPosition(layerNames);
    const newSelectLayers = [];
    const drawing = svgCanvas.getCurrentDrawing();
    const batchCmd = new svgedit.history.BatchCommand('Clone Layer(s)');
    for (let i = 0; i < layerNames.length; i++) {
        let newName = `${layerNames[i]} copy`;
        let j = 0;
        while (drawing.hasLayer(newName)) {
            newName = `${newName} ${++j}`;
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

export const cloneLayerByName = (layerName: string, newLayerName: string) => {
    const layer = getLayerElementByName(layerName);
    if (layer) {
        const color = layer.getAttribute('data-color') || '#333'
        const svgcontent = document.getElementById('svgcontent');
        const newLayer = new svgedit.draw.Layer(newLayerName, null, svgcontent, color).getGroup() as Element;
        const children = layer.childNodes;
        for (let i = 0; i < children.length; i++) {
            const child = children[i] as Element;
            if (child.tagName === 'title') continue;
            const copiedElem = svgCanvas.getCurrentDrawing().copyElem(child);
            newLayer.appendChild(copiedElem);
        }
        cloneLayerConfig(newLayerName, layerName);
        return new svgedit.history.InsertElementCommand(newLayer)
    }
    return null;
};

export const setLayersLock = (layerNames: string[], isLocked: boolean) => {
    for (let i = 0; i < layerNames.length; i++) {
        setLayerLock(layerNames[i], isLocked);
    }
}

export const setLayerLock = (layerName: string, isLocked: boolean) => {
    const layer = getLayerElementByName(layerName);
    if (isLocked) {
        layer.setAttribute('data-lock', 'true');
    } else {
        layer.removeAttribute('data-lock');
    }
};

export const mergeSelectedLayers = (layerNames: string[], baseLayerName?: string) => {
    svgCanvas.clearSelection();
    const batchCmd = new svgedit.history.BatchCommand('Merge Layer(s)');
    const drawing = svgCanvas.getCurrentDrawing();
    sortLayerNamesByPosition(layerNames);
    if (!baseLayerName) {
        baseLayerName = layerNames[0];
    }
    const baseLayerIndex = layerNames.findIndex(((layerName) => layerName === baseLayerName));

    let cmd = mergeLayer(baseLayerName, layerNames.slice(0, baseLayerIndex), true);
    if (cmd && !cmd.isEmpty()) {
        batchCmd.addSubCommand(cmd);
    }
    cmd = mergeLayer(baseLayerName, layerNames.slice(baseLayerIndex + 1), false);
    if (cmd && !cmd.isEmpty()) {
        batchCmd.addSubCommand(cmd);
    }

    if (!batchCmd.isEmpty()) {
        svgCanvas.undoMgr.addCommandToHistory(batchCmd);
    }
    drawing.identifyLayers();
    return baseLayerName;
};

export const mergeLayer = (baseLayerName: string, layersToBeMerged: string[], shouldInsertBefore: boolean) => {
    const baseLayer = getLayerElementByName(baseLayerName);
    if (baseLayer) {
        const firstChildOfBase = Array.from(baseLayer.childNodes).find((node: Element) => !['title', 'filter'].includes(node.tagName));
        const batchCmd = new svgedit.history.BatchCommand(`Merge into ${baseLayer}`);
        for (let i = 0; i < layersToBeMerged.length; i++) {
            const layer = getLayerElementByName(layersToBeMerged[i]);
            if (!layer) continue;

            const childNodes = layer.childNodes;
            for (let j = 0; j < childNodes.length; j++) {
                const child = childNodes[j];
                if (['title', 'filter'].includes(child.nodeName)) continue;

                const nextSibling = child.nextSibling;
                if (shouldInsertBefore) {
                    baseLayer.insertBefore(child, firstChildOfBase);
                } else {
                    baseLayer.appendChild(child);
                }
                batchCmd.addSubCommand(new svgedit.history.MoveElementCommand(child, nextSibling, layer));
                j -= 1;
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

export const moveLayersToPosition = (layerNames: string[], newPosition: number) => {
    const batchCmd = new svgedit.history.BatchCommand('Move Layer(s)');
    const drawing = svgCanvas.getCurrentDrawing();
    const currentLayerName = drawing.getCurrentLayerName();
    sortLayerNamesByPosition(layerNames);
    let lastLayerName = null;
    for (let i = layerNames.length - 1; i >= 0; i--) {
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
    return;
}

// pos  : 0 - 1 - 2 - 3 - 4 - 5 - 6
// array: | 0 | 1 | 2 | 3 | 4 | 5 |
// use insertBefore node[pos], so moving from i to pos i or i+1 means nothing.
export const moveLayerToPosition = (layerName: string, newPosition: number) => {
    const allLayers = document.querySelectorAll('g.layer');
    let layer = null as Element;
    let currentPosition = null;
    for (let i = 0; i < allLayers.length; i++) {
        const title = allLayers[i].querySelector('title');
        if (title && title.textContent === layerName) {
            currentPosition = i;
            layer = allLayers[i];
            break;
        }
    }
    if (!layer) {
        console.error('Layer not exist');
        return { success: false };
    } else if (newPosition < 0 || newPosition > allLayers.length ) {
        console.error('Position out of range');
        return { success: false };
    }
    if (newPosition === currentPosition || newPosition === currentPosition + 1) {
        return { success: true, cmd: null };
    } else {
        const anchorLayer = allLayers[newPosition]; // undefined if newPosition === allLayers.length
        const nextSibling = layer.nextSibling;
        const parent = layer.parentNode;
        if (anchorLayer) {
            parent.insertBefore(layer, anchorLayer);
        } else {
            parent.appendChild(layer);
        }
        return { success: true, cmd: new svgedit.history.MoveElementCommand(layer, nextSibling, parent) };
    }
};

const insertLayerBefore = (layerName: string, anchorLayerName: string) => {
    const layer = getLayerElementByName(layerName);
    const anchorLayer = getLayerElementByName(anchorLayerName);
    if (layer && anchorLayer) {
        const nextSibling = layer.nextSibling;
        const parent = layer.parentNode;
        parent.insertBefore(layer, anchorLayer);
        return { success: true, cmd: new svgedit.history.MoveElementCommand(layer, nextSibling, parent) };
    }
    return { success: false };
}