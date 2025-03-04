import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import constant from '@core/app/actions/beambox/constant';
import LayerModule from '@core/app/constants/layer-module/layer-modules';
import workareaManager from '@core/app/svgedit/workarea';
import { getData } from '@core/helpers/layer/layer-config-helper';
import { getAllLayers } from '@core/helpers/layer/layer-helper';

export const getRefModule = (): LayerModule => {
  const firstLayer = getAllLayers()
    .reverse()
    .find((layer) => layer.getAttribute('display') !== 'none');

  if (!firstLayer) {
    return LayerModule.LASER_UNIVERSAL;
  }

  return getData(firstLayer, 'module') as LayerModule;
};

const getJobOrigin = (px = false): { x: number; y: number } => {
  const { height: workareaHeight, width: workareaWidth } = workareaManager;
  const svgcontent = document.getElementById('svgcontent') as unknown as SVGSVGElement;
  const boundary = svgcontent.getBBox();
  const left = Math.max(boundary.x, 0);
  const top = Math.max(boundary.y, 0);
  const right = Math.min(boundary.x + boundary.width, workareaWidth);
  const bottom = Math.min(boundary.y + boundary.height, workareaHeight);
  const jobOrigin = beamboxPreference.read('job-origin');
  const xRef = (jobOrigin - 1) % 3;
  const yRef = Math.floor((jobOrigin - 1) / 3);
  const res = { x: 0, y: 0 };

  if (xRef === 0) {
    res.x = left;
  } else if (xRef === 1) {
    res.x = (left + right) / 2;
  } else {
    res.x = right;
  }

  if (yRef === 0) {
    res.y = top;
  } else if (yRef === 1) {
    res.y = (top + bottom) / 2;
  } else {
    res.y = bottom;
  }

  if (!px) {
    res.x /= constant.dpmm;
    res.y /= constant.dpmm;
  }

  return res;
};

export default getJobOrigin;
