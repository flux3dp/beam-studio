import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import history from '@core/app/svgedit/history/history';
import { handleHistoryActionOptions } from '@core/app/svgedit/history/utils';
import layerManager from '@core/app/svgedit/layer/layerManager';
import type { HistoryActionOptions } from '@core/interfaces/IHistory';

import { regulateEngraveDpiOption } from '../regulateEngraveDpi';

import { getData, writeDataLayer } from './layer-config-helper';

export const regulateAllLayersDpi = (workarea: WorkAreaModel, options: HistoryActionOptions): void => {
  const allLayers = layerManager.getAllLayers();
  const cmd = new history.BatchCommand('Regulate DPI for all layers');

  allLayers.forEach((layer) => {
    const dpi = getData(layer.getGroup(), 'dpi') || 'medium';
    const regulatedDpi = regulateEngraveDpiOption(workarea, dpi);

    if (dpi !== regulatedDpi) {
      writeDataLayer(layer.getGroup(), 'dpi', regulatedDpi, { batchCmd: cmd });
    }
  });

  handleHistoryActionOptions(cmd, options);
};
