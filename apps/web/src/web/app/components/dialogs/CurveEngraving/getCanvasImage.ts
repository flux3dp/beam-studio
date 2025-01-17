import findDefs from 'app/svgedit/utils/findDef';
import svgStringToCanvas from 'helpers/image/svgStringToCanvas';
import symbolMaker from 'helpers/symbol-maker';
import workareaManager from 'app/svgedit/workarea';

// TODO: Add unit tests
const getCanvasImage = async (x: number, y: number, width: number, height: number): Promise<ImageBitmap> => {
  const svgContent = document.getElementById('svgcontent') as unknown as SVGSVGElement;
  const bbox = { x, y, width, height };
  if (bbox.width <= 0 || bbox.height <= 0) return null;
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
