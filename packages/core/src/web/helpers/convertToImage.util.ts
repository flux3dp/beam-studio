import { pipe } from 'remeda';

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
type ConvertToImageResult = undefined | { imageElements: SVGImageElement[]; svgElements: SVGGElement[] };
type CreateImageParams = Record<'angle' | 'height' | 'width' | 'x' | 'y', number> &
  Record<'href' | 'transform', string>;

/**
 * A helper to add the newly created <image> element to the canvas and handle history.
 * This removes repetitive code from each conversion function.
 */
export function finalizeImageCreation(imageElement: SVGImageElement, isToSelect: boolean, parentCmd: IBatchCommand) {
  const cmd = new history.InsertElementCommand(imageElement);

  parentCmd.addSubCommand(cmd);

  if (isToSelect) {
    svgCanvas.selectOnly([imageElement]);
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
 * Creates the <image> element on the canvas and finalizes the operation.
 * This encapsulates all the common steps like setting attributes, color, rotation, and history.
 */
export const createAndFinalizeImage = async (
  { angle, height, href, transform, width, x, y }: CreateImageParams,
  { isToSelect, parentCmd, svgElement }: { isToSelect: boolean; parentCmd: IBatchCommand; svgElement: SVGGElement },
): Promise<ConvertToImageResult> => {
  const imageElement = svgCanvas.addSvgElementFromJson({
    attr: {
      'data-ratiofixed': true,
      'data-shading': true,
      'data-threshold': 254,
      height,
      id: svgCanvas.getNextId(),
      origImage: href,
      preserveAspectRatio: 'none',
      style: 'pointer-events:inherit',
      width,
      x,
      y,
    },
    element: 'image',
  }) as SVGImageElement;

  if (transform) imageElement.setAttribute('transform', transform);

  setRotationAngle(imageElement, angle, { parentCmd });
  svgCanvas.setHref(imageElement, href);
  updateElementColor(imageElement);
  finalizeImageCreation(imageElement, isToSelect, parentCmd);

  if (isToSelect) parentCmd.addSubCommand(deleteElements([svgElement], true));

  return { imageElements: [imageElement], svgElements: [svgElement] };
};

/**
 * A generic function to rasterize an SVG element (shapes, text) into an image.
 * This function merges the logic of three previous functions.
 */
export async function rasterizeGenericSvgElement({
  isToSelect,
  parentCmd,
  svgElement,
}: {
  isToSelect: boolean;
  parentCmd: IBatchCommand;
  svgElement: SVGGElement;
}): Promise<ConvertToImageResult> {
  try {
    const angle = getRotationAngle(svgElement);
    const cloned = svgElement.cloneNode(true) as SVGGraphicsElement;

    setRotationAngle(cloned, 0, { addToHistory: false });

    // Rasterization start
    const bbox = svgElement.getBBox();
    const isFilled = !['none', null].includes(svgElement.getAttribute('fill'));
    // Prepare return-to-zero transform
    const previousTransform = cloned.getAttribute('transform');
    const strokeOffset = isFilled ? 0 : 5;

    cloned.setAttribute('fill', '#000');
    cloned.setAttribute('stroke', '#000');

    if (!isFilled) cloned.setAttribute('stroke-width', String(strokeOffset));

    if (svgElement.getAttribute('data-textpath-g') === '1') {
      Array.from(cloned.children).forEach((child) => {
        if (child instanceof SVGGraphicsElement) {
          child.setAttribute('fill', '#000');
          child.setAttribute('stroke', '#000');
        }
      });
    }

    let finalCoords = { x: bbox.x, y: bbox.y };
    let finalWidth = bbox.width + strokeOffset;
    let finalHeight = bbox.height + strokeOffset;
    const isTransformedElement = svgElement.tagName === 'text' || svgElement.getAttribute('data-textpath-g') === '1';
    const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    if (isTransformedElement) {
      console.log('isTransformedElement', Boolean(previousTransform));

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

    if (finalWidth < 0) finalCoords.x += finalWidth;

    if (finalHeight < 0) finalCoords.y += finalHeight;

    wrapper.setAttribute(
      'viewBox',
      `${finalCoords.x} ${finalCoords.y} ${Math.abs(finalWidth) + strokeOffset} ${Math.abs(finalHeight) + strokeOffset}`,
    );
    wrapper.appendChild(cloned);

    // Create image from blob URL
    const svgUrl = pipe(
      new XMLSerializer().serializeToString(wrapper),
      (svgData) => new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' }),
      URL.createObjectURL,
    );
    const img = new Image();

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load the generated SVG.'));
      img.src = svgUrl;
    });

    return await createAndFinalizeImage(
      { angle, height: img.height, href: img.src, transform: '', width: img.width, x: finalCoords.x, y: finalCoords.y },
      { isToSelect, parentCmd, svgElement },
    );
  } catch (error) {
    console.error('Failed during SVG rasterization:', error);

    return undefined;
  }
}
