import history from '@core/app/svgedit/history/history';
import { handleHistoryActionOptions } from '@core/app/svgedit/history/utils';
import updateLayerColor from '@core/helpers/color/updateLayerColor';
import type { HistoryActionOptions, IBatchCommand } from '@core/interfaces/IHistory';

import { getData, writeDataLayer } from '../layer-config-helper';

const toggleFullColorLayer = (
  layer: Element,
  { val, ...historyOptions }: HistoryActionOptions & { val?: boolean } = {},
): IBatchCommand | null => {
  const origVal = getData(layer, 'fullcolor');
  const targetVal = val ?? !origVal;

  console.log('Toggle Full Color Layer', layer, 'from', origVal, 'to', targetVal);

  if (targetVal === origVal) return null;

  const cmd = new history.BatchCommand('Toggle Full Color Layer');

  writeDataLayer(layer, 'fullcolor', targetVal, { batchCmd: cmd });

  updateLayerColor(layer as SVGGElement);
  cmd.onAfter = () => {
    updateLayerColor(layer as SVGGElement);
  };

  handleHistoryActionOptions(cmd, historyOptions);

  return cmd;
};

export default toggleFullColorLayer;
