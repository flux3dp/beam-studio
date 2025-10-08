import constant from '@core/app/actions/beambox/constant';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import { useDocumentStore } from '@core/app/stores/documentStore';
import findDefs from '@core/app/svgedit/utils/findDef';
import workareaManager from '@core/app/svgedit/workarea';
import { switchSymbolWrapper } from '@core/helpers/file/export/utils/common';
import svgStringToCanvas from '@core/helpers/image/svgStringToCanvas';
import { getData } from '@core/helpers/layer/layer-config-helper';
import { getAllLayers } from '@core/helpers/layer/layer-helper';

export const getRefModule = (): LayerModuleType => {
  const firstLayer = getAllLayers()
    .reverse()
    .find((layer) => layer.getAttribute('display') !== 'none');

  if (!firstLayer) {
    return LayerModule.LASER_UNIVERSAL;
  }

  return getData(firstLayer, 'module') as LayerModuleType;
};

async function getJobOriginBBox(): Promise<DOMRect> {
  const svgcontent = document.getElementById('svgcontent') as unknown as SVGSVGElement;
  const passThroughElements = Array.from(
    svgcontent.querySelectorAll('g.layer:not([display="none"]) [data-pass-through="1"]'),
  );

  passThroughElements.forEach((elem) => elem.setAttribute('display', 'none'));

  const bbox = svgcontent.getBBox();

  passThroughElements.forEach((elem) => elem.removeAttribute('display'));

  if (passThroughElements.length > 0) {
    const { height, minY, width } = workareaManager;
    const svgDefs = findDefs();
    const svgString = switchSymbolWrapper(
      () => `
      <svg
        width="${width}"
        height="${height}"
        viewBox="0 ${minY} ${width} ${height}"
        xmlns:svg="http://www.w3.org/2000/svg"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
      >
        ${svgDefs.outerHTML}
        ${passThroughElements.map((el) => el.outerHTML).join('')}
      </svg>`,
    );

    const canvas = await svgStringToCanvas(svgString, width, height);
    const ctx = canvas.getContext('2d');

    if (ctx) {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let top = -1;
      let left = -1;
      let right = -1;
      let bottom = -1;

      for (let y = 0; y < imgData.height; y++) {
        for (let x = 0; x < imgData.width; x++) {
          const alpha = imgData.data[(y * imgData.width + x) * 4 + 3];

          if (alpha > 0) {
            if (top === -1) top = y;

            if (left === -1 || x < left) left = x;

            if (right === -1 || x > right) right = x;

            if (bottom === -1 || y > bottom) bottom = y;
          }
        }
      }

      if (bbox.width === 0 && bbox.height === 0) {
        if (top !== -1 && left !== -1 && right !== -1 && bottom !== -1) {
          bbox.x = left;
          bbox.y = top + minY;
          bbox.width = right - left;
          bbox.height = bottom + minY - top;
        }
      } else {
        if (top !== -1 && left !== -1 && right !== -1 && bottom !== -1) {
          const newX = Math.min(bbox.x, left);
          const newY = Math.min(bbox.y, top + minY);
          const newWidth = Math.max(bbox.x + bbox.width, right) - newX;
          const newHeight = Math.max(bbox.y + bbox.height, bottom + minY) - newY;

          bbox.x = newX;
          bbox.y = newY;
          bbox.width = newWidth;
          bbox.height = newHeight;
        }
      }
    }
  }

  return bbox;
}

const getJobOrigin = async (px = false): Promise<{ x: number; y: number }> => {
  const { maxY, width: workareaWidth } = workareaManager;
  // const svgcontent = document.getElementById('svgcontent') as unknown as SVGSVGElement;
  // const boundary = svgcontent.getBBox();
  const boundary = await getJobOriginBBox();
  const left = Math.max(boundary.x, 0);
  const top = Math.max(boundary.y, 0);
  const right = Math.min(boundary.x + boundary.width, workareaWidth);
  const bottom = Math.min(boundary.y + boundary.height, maxY);
  const jobOrigin = useDocumentStore.getState()['job-origin'];
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
