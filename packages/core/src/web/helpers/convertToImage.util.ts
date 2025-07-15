import history from '@core/app/svgedit/history/history';
import { deleteElements } from '@core/app/svgedit/operations/delete';
import { getRotationAngle, setRotationAngle } from '@core/app/svgedit/transform/rotation';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import updateElementColor from './color/updateElementColor';
import { getSVGAsync } from './svg-editor-helper';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

type BBox = { height: number; width: number; x: number; y: number };

/**
 * A helper to add the newly created <image> element to the canvas and handle history.
 * This removes repetitive code from each conversion function.
 */
export function finalizeImageCreation(newImage: SVGImageElement, isToSelect: boolean, parentCmd: IBatchCommand) {
  const cmd = new history.InsertElementCommand(newImage);

  parentCmd.addSubCommand(cmd);

  if (isToSelect) {
    svgCanvas.selectOnly([newImage]);
  }
}

/**
 * Calculates the new bounding box of an element after a matrix transform.
 * Refactored for better readability and safety.
 */
export const getTransformedCoordinates = (bbox: BBox, transform: null | string): BBox => {
  if (!transform) return bbox;

  const matrixMatch = transform.match(/matrix\(([^)]+)\)/);

  if (!matrixMatch?.[1]) {
    console.warn('No valid matrix transform found. Returning original coordinates.');

    return bbox;
  }

  const matrixValues = matrixMatch[1].split(/[\s,]+/).map(Number);

  if (matrixValues.length !== 6 || matrixValues.some(Number.isNaN)) {
    console.warn('Invalid matrix values found. Returning original coordinates.');

    return bbox;
  }

  const [a, b, c, d, e, f] = matrixValues;
  const { height, width, x, y } = bbox;

  // Apply transformation to the top-left corner
  const newX = a * x + c * y + e;
  const newY = b * x + d * y + f;
  const newWidth = width * Math.sqrt(a * a + b * b);
  const newHeight = height * Math.sqrt(c * c + d * d);

  return { height: newHeight, width: newWidth, x: newX, y: newY };
};

/**
 * A generic function to rasterize an SVG element (shapes, text) into an image.
 * This function merges the logic of three previous functions.
 */
export async function rasterizeGenericSvgElement({
  isToSelect = true,
  parentCmd = new history.BatchCommand('Rasterize SVG Element'),
  svgElement,
}: {
  isToSelect: boolean;
  parentCmd: IBatchCommand;
  svgElement: SVGGElement;
}): Promise<SVGImageElement | undefined> {
  try {
    const angle = getRotationAngle(svgElement);
    const cloned = svgElement.cloneNode(true) as SVGGraphicsElement;
    const bbox = svgElement.getBBox();
    const isFilled = !['none', null].includes(svgElement.getAttribute('fill'));

    setRotationAngle(cloned, 0, { addToHistory: false });

    // get return-to-zero transform
    const previousTransform = cloned.getAttribute('transform');
    const strokeOffset = isFilled ? 0 : 5;

    // Prepare the cloned element for rasterization
    cloned.setAttribute('fill', '#000');
    cloned.setAttribute('stroke', '#000');

    if (!isFilled) {
      cloned.setAttribute('fill', 'none');
      cloned.setAttribute('stroke-width', String(strokeOffset));
    }

    // If the element is a text path, ensure it has a fill and stroke
    if (svgElement.getAttribute('data-textpath-g') === '1') {
      Array.from(cloned.children).forEach((child) => {
        if (child instanceof SVGGraphicsElement) {
          child.setAttribute('fill', '#000');
          child.setAttribute('stroke', '#000');
        }
      });
    }

    // Determine coordinates, dimensions, and transform based on element type
    let finalCoords = { x: bbox.x, y: bbox.y };
    let finalWidth = bbox.width + strokeOffset;
    let finalHeight = bbox.height + strokeOffset;
    const isTransformedElement = svgElement.tagName === 'text' || svgElement.getAttribute('data-textpath-g') === '1';
    // Create SVG wrapper and serialize
    const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    if (isTransformedElement) {
      const transformed = getTransformedCoordinates(bbox, previousTransform);
      const scale = Number.parseFloat(previousTransform?.match(/matrix\(([^,]+)/)?.[1] || '1');

      finalCoords = { x: transformed.x - (strokeOffset / 2) * scale, y: transformed.y - (strokeOffset / 2) * scale };
      finalWidth = bbox.width * scale;
      finalHeight = bbox.height * scale;

      if (previousTransform) cloned.setAttribute('transform', previousTransform);
    }

    wrapper.setAttribute('display', 'block');
    wrapper.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    wrapper.setAttribute('width', String(Math.abs(finalWidth)));
    wrapper.setAttribute('height', String(Math.abs(finalHeight)));

    if (finalWidth < 0) {
      finalCoords.x += finalWidth;
    }

    if (finalHeight < 0) {
      finalCoords.y += finalHeight;
    }

    wrapper.setAttribute(
      'viewBox',
      `${finalCoords.x} ${finalCoords.y} ${Math.abs(finalWidth) + strokeOffset} ${Math.abs(finalHeight) + strokeOffset}`,
    );
    wrapper.appendChild(cloned);

    const svgData = new XMLSerializer().serializeToString(wrapper);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(blob);
    // Load image from blob URL
    const img = new Image();

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load the generated SVG.'));
      img.src = svgUrl;
    });

    const { height, src: origImage, width } = img;

    // Create the new <image> element on the canvas
    const imageElement = svgCanvas.addSvgElementFromJson({
      attr: {
        'data-ratiofixed': true,
        'data-shading': true,
        'data-threshold': 254,
        height,
        id: svgCanvas.getNextId(),
        origImage,
        preserveAspectRatio: 'none',
        style: 'pointer-events:inherit',
        width,
        ...finalCoords,
      },
      element: 'image',
    }) as SVGImageElement;

    setRotationAngle(imageElement, angle, { parentCmd });
    svgCanvas.setHref(imageElement, origImage);
    updateElementColor(imageElement);
    finalizeImageCreation(imageElement, isToSelect, parentCmd);
    parentCmd.addSubCommand(deleteElements([svgElement], true));

    return imageElement as SVGImageElement;
  } catch (error) {
    console.error('Failed during SVG rasterization:', error);

    return undefined;
  }
}
