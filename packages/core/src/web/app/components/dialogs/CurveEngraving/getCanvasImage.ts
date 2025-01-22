import findDefs from '@core/app/svgedit/utils/findDef';
import workareaManager from '@core/app/svgedit/workarea';
import svgStringToCanvas from '@core/helpers/image/svgStringToCanvas';
import symbolMaker from '@core/helpers/symbol-maker';

// TODO: Add unit tests
const getCanvasImage = async (x: number, y: number, width: number, height: number): Promise<ImageBitmap> => {
  const svgContent = document.getElementById('svgcontent') as unknown as SVGSVGElement;
  const bbox = { height, width, x, y };

  if (bbox.width <= 0 || bbox.height <= 0) {
    return null;
  }

  bbox.width = Math.min(bbox.width, workareaManager.width);
  bbox.height = Math.min(bbox.height, workareaManager.height);

  const svgDefs = findDefs();
  const clonedSvgContent = svgContent.cloneNode(true) as SVGSVGElement;
  const useElements = clonedSvgContent.querySelectorAll('use');

  useElements.forEach((useElement) => symbolMaker.switchImageSymbol(useElement, false));

  const svgString = `
    <svg
      width="${bbox.width}"
      height="${bbox.height}"
      viewBox="${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}"
      xmlns:svg="http://www.w3.org/2000/svg"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
    >
      ${svgDefs.outerHTML}
      ${clonedSvgContent.innerHTML}
    </svg>`;
  const canvas = await svgStringToCanvas(svgString, bbox.width, bbox.height);
  const imageBitmap = await createImageBitmap(canvas);

  return imageBitmap;
};

export default getCanvasImage;
