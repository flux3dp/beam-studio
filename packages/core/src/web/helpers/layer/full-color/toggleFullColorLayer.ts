import updateLayerColor from '@core/helpers/color/updateLayerColor';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { writeDataLayer } from '../layer-config-helper';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const toggleFullColorLayer = (layer: Element, opts: { val?: boolean } = {}): IBatchCommand | null => {
  const { val } = opts;
  const origVal = layer.getAttribute('data-fullcolor') === '1';
  const targetVal = val ?? !origVal;

  console.log('Toggle Full Color Layer', layer, 'from', origVal, 'to', targetVal);

  if (targetVal === origVal) return null;

  svgCanvas.undoMgr.beginUndoableChange('data-fullcolor', [layer]);

  if (targetVal) {
    writeDataLayer(layer, 'fullcolor', true);
  } else {
    writeDataLayer(layer, 'fullcolor', false);
  }

  const cmd = svgCanvas.undoMgr.finishUndoableChange();

  updateLayerColor(layer as SVGGElement);
  cmd.onAfter = () => {
    updateLayerColor(layer as SVGGElement);
  };

  return cmd;
};

export default toggleFullColorLayer;
