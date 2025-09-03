import { round } from 'remeda';

import workareaManager from '@core/app/svgedit/workarea';
import { getData } from '@core/helpers/layer/layer-config-helper';
import { getAllLayers } from '@core/helpers/layer/layer-helper';

export const annotateLayerBBox = (): (() => void) => {
  const allLayers = getAllLayers();
  const { height, minY, width } = workareaManager;

  allLayers.forEach((layer) => {
    const repeat = getData(layer, 'repeat');
    const ref = getData(layer, 'ref');
    const layerModule = getData(layer, 'module');

    if (ref || repeat === 0 || (layerModule && layerModule < 0)) return;

    const bbox = layer.getBBox();
    const right = Math.min(bbox.x + bbox.width, width);
    const bottom = Math.min(bbox.y + bbox.height, minY + height);
    const x = Math.max(bbox.x, 0);
    const y = Math.max(bbox.y, minY);
    const w = right - x;
    const h = bottom - y;

    layer.setAttribute('data-bbox', `${round(x, 2)},${round(y - minY, 2)},${round(w, 2)},${round(h, 2)}`);
  });

  const revert = () => allLayers.forEach((layer) => layer.removeAttribute('data-bbox'));

  return revert;
};
