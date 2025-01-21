import ISVGCanvas from '@core/interfaces/ISVGCanvas';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { IBatchCommand } from '@core/interfaces/IHistory';

import history from '@core/app/svgedit/history/history';
import LayerModule from '@core/app/constants/layer-module/layer-modules';
import updateLayerColor from '@core/helpers/color/updateLayerColor';
import { PrintingColors } from '@core/app/constants/color-constants';

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
    if (toWhite && getData(layer, 'module') === LayerModule.PRINTER) {
      writeDataLayer(layer, 'ink', 4, { batchCmd });
    }
  });
  const updateDisplay = () => {
    if (svgCanvas) layers.forEach((layer) => updateLayerColor(layer));
  };
  updateDisplay();
  batchCmd.onAfter = () => updateDisplay();
  return batchCmd;
};

export default changeLayersColor;
