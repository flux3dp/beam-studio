import presprayArea from '@core/app/actions/canvas/prespray-area';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import layerManager from '@core/app/svgedit/layer/layerManager';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { getSVGAsync } from '../svg-editor-helper';

let svgcanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgcanvas = globalSVG.Canvas;
});

export const setLayerVisibility = (
  layerName: string,
  value: boolean,
  opts?: { addToHistory?: boolean; parentCmd?: IBatchCommand },
): void => {
  const batchCmd = new history.BatchCommand('Set Layer Visibility');
  const layerObject = layerManager.getLayerByName(layerName);

  if (!layerObject) return;

  const res = layerObject.setVisible(value, { parentCmd: batchCmd });

  // Value not changed
  if (!res) return;

  presprayArea.togglePresprayArea();

  batchCmd.onAfter = () => {
    presprayArea.togglePresprayArea();
  };

  const { addToHistory = true, parentCmd } = opts || {};

  if (parentCmd) parentCmd.addSubCommand(batchCmd);
  else if (addToHistory) undoManager.addCommandToHistory(batchCmd);

  if (layerObject === layerManager.getCurrentLayer()) {
    svgcanvas.clearSelection();
    svgcanvas.pathActions.clear();
  }
};
