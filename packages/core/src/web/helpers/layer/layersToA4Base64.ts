import constant from '@core/app/actions/beambox/constant';
import findDefs from '@core/app/svgedit/utils/findDef';
import svgStringToCanvas from '@core/helpers/image/svgStringToCanvas';

import symbolMaker from '../symbol-maker';

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
  const uses = layers.flatMap((layer) => [...layer.querySelectorAll('use')]);
  const svgDefs = findDefs();
  const getCanvas = async (elements: SVGElement[]) => {
    const outerHTML = elements
      .map(({ outerHTML }) => `<g transform="translate(2100, 0) rotate(90)">${outerHTML}</g>`)
      .join('');
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

  uses.forEach((use) => symbolMaker.switchImageSymbol(use as SVGUseElement, false));

  const canvas = await getCanvas(layers.map((layer) => layer.cloneNode(true)) as SVGGElement[]);

  uses.forEach((use) => symbolMaker.switchImageSymbol(use as SVGUseElement, true));

  return canvas.toDataURL();
};
