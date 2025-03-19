import constant from '@core/app/actions/beambox/constant';
import findDefs from '@core/app/svgedit/utils/findDef';
import svgStringToCanvas from '@core/helpers/image/svgStringToCanvas';

type Options = {
  dpi?: number;
  orientation?: 'landscape' | 'portrait';
};

export const layersToA4Base64 = async (layer: SVGGElement, options?: Options): Promise<string> => {
  const { dpi = 300, orientation = 'portrait' } = options || {};
  const layerClone = layer.cloneNode(true) as SVGGElement;
  const { height, width } = orientation === 'portrait' ? { height: 2970, width: 2100 } : { height: 2100, width: 2970 };
  const ratio = dpi / (constant.dpmm * 25.4);
  const canvasWidth = Math.round(width * ratio);
  const canvasHeight = Math.round(height * ratio);
  const svgDefs = findDefs();
  const getCanvas = async (element: SVGElement) => {
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
        <g transform="translate(2100, 0) rotate(90)">
          ${element.outerHTML}
        </g>
      </svg>`;

    console.log(svgString);

    return svgStringToCanvas(svgString, canvasWidth, canvasHeight);
  };
  const canvas = await getCanvas(layerClone);
  const context = canvas.getContext('2d', { willReadFrequently: true })!;
  const { data } = context.getImageData(0, 0, canvasWidth, canvasHeight);
  const bounds = { maxX: 0, maxY: 0, minX: canvasWidth, minY: canvasHeight };

  for (let y = 0; y < canvasHeight; y++) {
    for (let x = 0; x < canvasWidth; x++) {
      const i = (y * canvasWidth + x) * 4;
      const alpha = data[i + 3];

      if (alpha > 0) {
        bounds.minX = Math.min(bounds.minX, x);
        bounds.maxX = Math.max(bounds.maxX, x);
        bounds.minY = Math.min(bounds.minY, y);
        bounds.maxY = Math.max(bounds.maxY, y);
      }
    }
  }

  if (bounds.minX > bounds.maxX || bounds.minY > bounds.maxY) {
    return '';
  }

  return canvas.toDataURL();
};
