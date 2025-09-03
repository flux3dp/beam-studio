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
    const x = Math.max(bbox.x, 0);
    const y = Math.max(bbox.y - minY, 0);
    const w = Math.min(bbox.width, workareaManager.width);
    const h = Math.min(bbox.height, workareaManager.height);

    layer.setAttribute('data-bbox', `${round(x, 2)},${round(y, 2)},${round(w, 2)},${round(h, 2)}`);
  });

  const revert = () => allLayers.forEach((layer) => layer.removeAttribute('data-bbox'));

  return revert;
};
