import presprayArea from '@core/app/actions/canvas/prespray-area';
import { PRINT_AND_CUT_HIDDEN_ATTR } from '@core/app/components/dialogs/PrintAndCut/constants';
import changeAttribute from '@core/app/svgedit/history/changeAttribute';
import history from '@core/app/svgedit/history/history';
import { handleHistoryActionOptions } from '@core/app/svgedit/history/utils/handleHistoryActionOptions';
import layerManager from '@core/app/svgedit/layer/layerManager';
import selectionManager from '@core/app/svgedit/selection';
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

  // a manual toggle strips print-and-cut's still-content marker (undo restores it)
  const stripTagCmd = changeAttribute(layerObject.getGroup(), { [PRINT_AND_CUT_HIDDEN_ATTR]: null });

  if (stripTagCmd) batchCmd.addSubCommand(stripTagCmd);

  presprayArea.togglePresprayArea();

  batchCmd.onAfter = () => {
    presprayArea.togglePresprayArea();
  };

  handleHistoryActionOptions(batchCmd, opts);

  if (layerObject === layerManager.getCurrentLayer()) {
    selectionManager.clearSelection();
    svgcanvas.pathActions.clear();
  }
};
