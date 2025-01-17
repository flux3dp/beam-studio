import beamboxPrefernce from 'app/actions/beambox/beambox-preference';
import { getLayerName } from 'helpers/layer/layer-helper';
import { getSVGAsync } from 'helpers/svg-editor-helper';

import setElementsColor from './setElementsColor';
import updateLayerColorFilter from './updateLayerColorFilter';

let svgCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

// TODO: add test
const updateLayerColor = async (layer: SVGGElement): Promise<void> => {
  const useLayerColor = beamboxPrefernce.read('use_layer_color');
  const color = useLayerColor ? layer.getAttribute('data-color') : '#000';
  const isFullColor = layer.getAttribute('data-fullcolor') === '1';
  const elems = Array.from(layer.childNodes);
  const tempGroup = svgCanvas.getTempGroup();
  if (tempGroup) {
    const layerName = getLayerName(layer);
    const multiSelectedElems = tempGroup.querySelectorAll(`[data-original-layer="${layerName}"]`);
    elems.push(...multiSelectedElems);
  }
  await setElementsColor(elems as Element[], color, isFullColor);
  updateLayerColorFilter(layer);
};

export default updateLayerColor;
