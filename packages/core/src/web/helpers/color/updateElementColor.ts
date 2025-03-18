import setElementsColor from '@core/helpers/color/setElementsColor';
import { getObjectLayer } from '@core/helpers/layer/layer-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

// TODO: add test
const updateElementColor = (elem: Element): void => {
  const layer = getObjectLayer(elem as SVGElement)?.elem;
  const isFullColor = layer?.getAttribute('data-fullcolor') === '1';
  const color = svgCanvas.isUsingLayerColor ? layer?.getAttribute('data-color') : '#000';

  setElementsColor([elem], color!, isFullColor);
};

export default updateElementColor;
