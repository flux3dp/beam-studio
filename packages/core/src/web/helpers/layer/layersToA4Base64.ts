import { map, pipe, prop } from 'remeda';
import { match } from 'ts-pattern';

import { dpmm } from '@core/app/actions/beambox/constant';
import { rasterizeStandaloneSvg } from '@core/helpers/image/standaloneSvg';
import { buildWebFontFaceCss } from '@core/helpers/image/webFontFaceCss';

type Options = {
  dpi?: number;
  orientation?: 'landscape' | 'portrait';
};

export const layersToA4Base64 = async (layers: SVGGElement[], options?: Options): Promise<string> => {
  const { dpi = 300, orientation = 'portrait' } = options || {};
  const { height, width } = orientation === 'portrait' ? { height: 2970, width: 2100 } : { height: 2100, width: 2970 };
  const ratio = dpi / (dpmm * 25.4);
  const canvasWidth = Math.round(width * ratio);
  const canvasHeight = Math.round(height * ratio);
  // the isolated <img> render cannot see the app document's webfonts, so inline their bytes
  const fontFaceCss = await buildWebFontFaceCss(layers);
  const getCanvas = async (elements: SVGElement[]) => {
    const outerHTML = pipe(
      //
      elements,
      map(prop('outerHTML')),
      (outerHTML) =>
        match(orientation)
          .with('portrait', () => `<g transform="translate(${width}, 0) rotate(90)">${outerHTML}</g>`)
          .otherwise(() => `<g>${outerHTML}</g>`),
    );

    return rasterizeStandaloneSvg({
      content: [outerHTML],
      fontFaceCss,
      size: { height: canvasHeight, width: canvasWidth },
      viewBox: { height, width, x: 0, y: 0 },
    });
  };

  const canvas = await pipe(
    layers,
    map((layer) => layer?.cloneNode(true) as SVGGElement),
    getCanvas,
  );

  return canvas.toDataURL();
};
