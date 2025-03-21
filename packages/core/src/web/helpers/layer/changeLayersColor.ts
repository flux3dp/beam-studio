import { PrintingColors } from '@core/app/constants/color-constants';
import { printingModules } from '@core/app/constants/layer-module/layer-modules';
import history from '@core/app/svgedit/history/history';
import updateLayerColor from '@core/helpers/color/updateLayerColor';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { getData, writeDataLayer } from './layer-config-helper';
import { getLayerByName } from './layer-helper';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const changeLayersColor = (layerNames: string[], color: string): IBatchCommand => {
  const layers = layerNames.map((layerName) => getLayerByName(layerName)).filter((layer) => layer);
  const batchCmd = new history.BatchCommand('Change Layers Color');
  const toWhite = color === PrintingColors.WHITE;

  layers.forEach((layer) => {
    writeDataLayer(layer, 'color', color, { batchCmd });

    if (toWhite && printingModules.has(getData(layer, 'module'))) {
      writeDataLayer(layer, 'ink', 4, { batchCmd });
    }
  });

  const updateDisplay = () => {
    if (svgCanvas) {
      layers.forEach((layer) => updateLayerColor(layer));
    }
  };

  updateDisplay();
  batchCmd.onAfter = () => updateDisplay();

  return batchCmd;
};

export default changeLayersColor;
