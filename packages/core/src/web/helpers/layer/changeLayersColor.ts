import ISVGCanvas from 'interfaces/ISVGCanvas';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { IBatchCommand } from 'interfaces/IHistory';

import history from 'app/svgedit/history/history';
import LayerModule from 'app/constants/layer-module/layer-modules';
import updateLayerColor from 'helpers/color/updateLayerColor';
import { PrintingColors } from 'app/constants/color-constants';

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
