import presprayArea from '@core/app/actions/canvas/prespray-area';
import history from '@core/app/svgedit/history/history';
import { handleHistoryActionOptions } from '@core/app/svgedit/history/utils/handleHistoryActionOptions';
import layerManager from '@core/app/svgedit/layer/layerManager';
import type { HistoryActionOptions } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { getSVGAsync } from '../svg-editor-helper';

let svgcanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgcanvas = globalSVG.Canvas;
});

export const setLayerVisibility = (layerName: string, value: boolean, opts?: HistoryActionOptions): void => {
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

  handleHistoryActionOptions(batchCmd, opts);

  if (layerObject === layerManager.getCurrentLayer()) {
    svgcanvas.clearSelection();
    svgcanvas.pathActions.clear();
  }
};
