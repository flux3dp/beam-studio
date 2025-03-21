import { map, pipe, prop } from 'remeda';

import constant from '@core/app/actions/beambox/constant';
import findDefs from '@core/app/svgedit/utils/findDef';
import svgStringToCanvas from '@core/helpers/image/svgStringToCanvas';

type Options = {
  dpi?: number;
  orientation?: 'landscape' | 'portrait';
};

export const layersToA4Base64 = async (layers: SVGGElement[], options?: Options): Promise<string> => {
  const { dpi = 300, orientation = 'portrait' } = options || {};
  const { height, width } = orientation === 'portrait' ? { height: 2970, width: 2100 } : { height: 2100, width: 2970 };
  const ratio = dpi / (constant.dpmm * 25.4);
  const canvasWidth = Math.round(width * ratio);
  const canvasHeight = Math.round(height * ratio);
  const svgDefs = findDefs();
  const getCanvas = async (elements: SVGElement[]) => {
    const outerHTML = pipe(
      elements,
      map(prop('outerHTML')),
      (outerHTML) => `<g transform="translate(${width}, 0) rotate(90)">${outerHTML}</g>`,
    );
    const svgString = `
    <svg
    width="${canvasWidth}"
    height="${canvasHeight}"
    viewBox="0 0 ${width} ${height}"
    xmlns:svg="http://www.w3.org/2000/svg"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    >
    ${svgDefs.outerHTML}
    ${outerHTML}
    </svg>`;

    return svgStringToCanvas(svgString, canvasWidth, canvasHeight);
  };

  const canvas = await pipe(
    layers,
    map(({ cloneNode }) => cloneNode(true) as SVGGElement),
    getCanvas,
  );

  return canvas.toDataURL();
};
