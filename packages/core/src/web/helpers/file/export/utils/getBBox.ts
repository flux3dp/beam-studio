import findDefs from '@core/app/svgedit/utils/findDef';
import workareaManager from '@core/app/svgedit/workarea';
import svgStringToCanvas from '@core/helpers/image/svgStringToCanvas';
import symbolMaker from '@core/helpers/symbol-helper/symbolMaker';

/**
 * Get the actual bounding box of the SVG content,
 * use canvas image raster when content includes elements with `data-pass-through="1"`.
 * @returns The actual bounding box of the SVG content, including elements with `data-pass-through="1"`.
 */
export async function getSvgContentActualBBox(shouldSwitchSymbol = true): Promise<DOMRect> {
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

    if (shouldSwitchSymbol) symbolMaker.switchImageSymbolForAll(false);

    const svgString = `
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
      </svg>`;

    if (shouldSwitchSymbol) symbolMaker.switchImageSymbolForAll(true);

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
