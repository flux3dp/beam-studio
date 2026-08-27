import { CanvasElements } from '@core/app/constants/canvasElements';
import { BatchCommand } from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import layerManager from '@core/app/svgedit/layer/layerManager';
import selectionManager from '@core/app/svgedit/selection';
import type { IBatchCommand, ICommand } from '@core/interfaces/IHistory';

import i18n from '../i18n';

import { initLayerConfig } from './layer-config-helper';

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

  selectionManager.clearSelection();

  for (let i = 0; i < layerNames.length; i += 1) {
    deleteLayerByName(layerNames[i], { parentCmd: batchCmd });
  }

  const layerCounts = document.querySelectorAll('g.layer').length;

  if (!layerCounts) {
    const newLayer = layerManager.createLayer(i18n.lang.beambox.right_panel.layer_panel.layer1, {
      parentCmd: batchCmd,
    })!;

    newLayer.setColor('#333333');
    initLayerConfig(newLayer.getGroup());
  }

  if (!batchCmd.isEmpty()) {
    undoManager.addCommandToHistory(batchCmd);
  }

  layerManager.resync();
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

      layerManager.resync();
      layerManager.setSelectedLayers([]);

      return cmd;
    }
  }

  return null;
};
