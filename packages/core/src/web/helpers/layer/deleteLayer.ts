import { CanvasElements } from '@core/app/constants/canvasElements';
import useLayerStore from '@core/app/stores/layer/layerStore';
import { BatchCommand, InsertElementCommand } from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import Layer from '@core/app/svgedit/layer/layer';
import layerManager from '@core/app/svgedit/layer/layerManager';
import type { IBatchCommand, ICommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import i18n from '../i18n';
import { getSVGAsync } from '../svg-editor-helper';

import { initLayerConfig } from './layer-config-helper';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

// TODO: add unittest

export const deleteLayerByName = (
  layerName: string,
  opts: { addToHistory?: boolean; parentCmd?: IBatchCommand } = {},
): ICommand | null => {
  const layer = layerManager.getLayerByName(layerName);

  if (!layer) return null;

  const cmd = layer.removeGroup(opts);

  return cmd;
};

export const deleteLayers = (layerNames: string[]): void => {
  const batchCmd: IBatchCommand = new BatchCommand('Delete Layer(s)');

  svgCanvas.clearSelection();

  for (let i = 0; i < layerNames.length; i += 1) {
    deleteLayerByName(layerNames[i], { parentCmd: batchCmd });
  }

  const layerCounts = document.querySelectorAll('g.layer').length;

  if (!layerCounts) {
    const svgcontent = document.getElementById('svgcontent')! as unknown as SVGSVGElement;
    // TODO: should use layerManager to create layer?
    const newLayer = new Layer(
      i18n.lang.beambox.right_panel.layer_panel.layer1,
      null,
      svgcontent,
      '#333333',
    ).getGroup() as Element;

    batchCmd.addSubCommand(new InsertElementCommand(newLayer));
    initLayerConfig(newLayer);
  }

  if (!batchCmd.isEmpty()) {
    undoManager.addCommandToHistory(batchCmd);
  }

  layerManager.identifyLayers();
};

export const removeDefaultLayerIfEmpty = ({ parentCmd }: { parentCmd?: IBatchCommand } = {}): ICommand | null => {
  const defaultLayerName = i18n.lang.beambox.right_panel.layer_panel.layer1;
  const layer = layerManager.getLayerElementByName(defaultLayerName);
  const layerCount = layerManager.getNumLayers();

  if (layer && layerCount > 1) {
    const childNodes = Array.from(layer.childNodes);
    const isEmpty = childNodes.every((node) => CanvasElements.defElems.includes((node as Element).tagName));

    if (isEmpty) {
      console.log('default layer is empty. delete it!');

      const cmd = deleteLayerByName(defaultLayerName, { parentCmd });

      layerManager.identifyLayers();
      useLayerStore.getState().setSelectedLayers([]);

      return cmd;
    }
  }

  return null;
};
