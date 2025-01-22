import updateLayerColor from '@core/helpers/color/updateLayerColor';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const toggleFullColorLayer = (layer: Element, opts: { val?: boolean } = {}): IBatchCommand => {
  const { val } = opts;
  const origVal = layer.getAttribute('data-fullcolor') === '1';
  const targetVal = val ?? !origVal;

  console.log('Toggle Full Color Layer', layer, 'from', origVal, 'to', targetVal);

  if (targetVal === origVal) {
    return null;
  }

  svgCanvas.undoMgr.beginUndoableChange('data-fullcolor', [layer]);

  if (targetVal) {
    layer.setAttribute('data-fullcolor', '1');
  } else {
    layer.removeAttribute('data-fullcolor');
  }

  const cmd = svgCanvas.undoMgr.finishUndoableChange();

  updateLayerColor(layer as SVGGElement);
  cmd.onAfter = () => updateLayerColor(layer as SVGGElement);

  return cmd;
};

export default toggleFullColorLayer;
