import workareaManager from '@core/app/svgedit/workarea';
import { rasterizeStandaloneSvg } from '@core/helpers/image/standaloneSvg';
import { buildWebFontFaceCss } from '@core/helpers/image/webFontFaceCss';
import symbolMaker from '@core/helpers/symbol-helper/symbolMaker';

// TODO: Add unit tests
const getCanvasImage = async (x: number, y: number, width: number, height: number): Promise<ImageBitmap> => {
  const svgContent = document.getElementById('svgcontent') as unknown as SVGSVGElement;
  const bbox = { height, width, x, y };

  if (bbox.width <= 0 || bbox.height <= 0) {
    return null;
  }

  bbox.width = Math.min(bbox.width, workareaManager.width);
  bbox.height = Math.min(bbox.height, workareaManager.height);

  const clonedSvgContent = svgContent.cloneNode(true) as SVGSVGElement;
  const useElements = clonedSvgContent.querySelectorAll('use');

  useElements.forEach((useElement) => symbolMaker.switchImageSymbol(useElement, false));

  const canvas = await rasterizeStandaloneSvg({
    content: [clonedSvgContent.innerHTML],
    // the isolated <img> render cannot see the app document's webfonts, so text would otherwise
    // fall back to another face and sit differently over the measured surface
    fontFaceCss: await buildWebFontFaceCss([clonedSvgContent]),
    size: { height: bbox.height, width: bbox.width },
    viewBox: bbox,
  });
  const imageBitmap = await createImageBitmap(canvas);

  return imageBitmap;
};

export default getCanvasImage;
