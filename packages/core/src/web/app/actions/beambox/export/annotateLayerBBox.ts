import { round } from 'remeda';

import workareaManager from '@core/app/svgedit/workarea';
import { getData } from '@core/helpers/layer/layer-config-helper';
import { getAllLayers } from '@core/helpers/layer/layer-helper';

export const annotateLayerBBox = (): (() => void) => {
  const allLayers = getAllLayers();
  const { minY } = workareaManager;

  allLayers.forEach((layer) => {
    const repeat = getData(layer, 'repeat');
    const ref = getData(layer, 'ref');
    const layerModule = getData(layer, 'module');

    if (ref || repeat === 0 || (layerModule && layerModule < 0)) return;

    const bbox = layer.getBBox();

    layer.setAttribute(
      'data-bbox',
      `${round(bbox.x, 2)},${round(bbox.y - minY, 2)},${round(bbox.width, 2)},${round(bbox.height, 2)}`,
    );
    console.log(layer, layer.getAttribute('data-bbox'));
  });

  const revert = () => allLayers.forEach((layer) => layer.removeAttribute('data-bbox'));

  return revert;
};
