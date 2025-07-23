import { dpmm } from '@core/app/actions/beambox/constant';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import updateElementColor from '../color/updateElementColor';
import { moveToOtherLayer } from '../layer/layer-helper';
import { getSVGAsync } from '../svg-editor-helper'; // Assuming this path

import { getUnionBBox } from './getUnionBBox'; // Make sure this is imported

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

/**
 * Combines multiple SVG image elements into a single, large SVG image element on the canvas.
 *
 * @param elements - An array of SVGImageElement objects to combine.
 * @returns The final, single SVGImageElement that has been added to the canvas.
 */
export const combineImagesIntoSingleElement = async (
  elements: SVGImageElement[],
  { layer }: { layer?: string },
): Promise<SVGImageElement> => {
  // 1. Calculate the union bounding box of all the images.
  // This gives us the final position (x, y) and size (width, height) of our new image.
  const bbox = getUnionBBox(elements);

  if (!bbox) {
    throw new Error('Could not calculate the bounding box for the provided elements.');
  }

  // 2. Create a new <svg> element that will act as a container for all the images.
  const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

  wrapper.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  wrapper.setAttribute('width', String((bbox.width * 300) / (dpmm * 25.4)));
  wrapper.setAttribute('height', String((bbox.height * 300) / (dpmm * 25.4)));
  wrapper.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);

  // 3. Clone each image and position it correctly within the new SVG wrapper.
  elements.forEach((el) => {
    const clone = el.cloneNode(true) as SVGImageElement;

    wrapper.appendChild(clone);
  });

  // 4. Serialize the wrapper SVG into a string and create a data URL.
  const svgString = new XMLSerializer().serializeToString(wrapper);
  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
  const pngUrl = await new Promise<string>((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const renderWidth = (bbox.width * 300) / (dpmm * 25.4);
    const renderHeight = (bbox.height * 300) / (dpmm * 25.4);

    canvas.width = renderWidth;
    canvas.height = renderHeight;

    img.onload = () => {
      if (ctx) {
        ctx.drawImage(img, 0, 0, renderWidth, renderHeight);
        // Export the canvas content as a PNG data URL
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Failed to get 2D context from canvas.'));
      }
    };
    img.onerror = () => {
      reject(new Error('Failed to load the combined SVG for rasterization.'));
    };
    img.src = svgUrl;
  });

  // 5. Use `svgCanvas.addSvgElementFromJson` to create the final, large image element.
  const finalImage = svgCanvas.addSvgElementFromJson({
    attr: {
      'data-ratiofixed': true,
      'data-shading': true,
      'data-threshold': 254,
      id: svgCanvas.getNextId(),
      origImage: pngUrl,
      preserveAspectRatio: 'none',
      style: 'pointer-events:inherit',
      ...bbox,
    },
    element: 'image',
  }) as SVGImageElement;

  svgCanvas.setHref(finalImage, pngUrl);
  svgCanvas.selectOnly([finalImage]);
  moveToOtherLayer(layer!, () => {}, false);
  updateElementColor(finalImage);

  return finalImage;
};
