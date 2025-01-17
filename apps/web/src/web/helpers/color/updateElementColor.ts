import ISVGCanvas from 'interfaces/ISVGCanvas';
import setElementsColor from 'helpers/color/setElementsColor';
import { getObjectLayer } from 'helpers/layer/layer-helper';
import { getSVGAsync } from 'helpers/svg-editor-helper';

let svgCanvas: ISVGCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

// TODO: add test
const updateElementColor = (elem: Element): void => {
  const layer = getObjectLayer(elem as SVGElement)?.elem;
  const isFullColor = layer?.getAttribute('data-fullcolor') === '1';
  const color = svgCanvas.isUsingLayerColor ? layer?.getAttribute('data-color') : '#000';
  setElementsColor([elem], color, isFullColor);
};

export default updateElementColor;
