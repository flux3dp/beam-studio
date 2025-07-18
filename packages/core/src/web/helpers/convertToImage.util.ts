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

export type ConvertSvgToImageParams = {
  isToSelect?: boolean;
  parentCmd?: IBatchCommand;
  svgElement: SVGGElement;
};
export type ConvertToImageResult = undefined | { imageElements: SVGImageElement[]; svgElements: SVGGElement[] };

type BBox = { height: number; width: number; x: number; y: number };
type CreateImageParams = Record<'angle' | 'height' | 'width' | 'x' | 'y', number> &
  Record<'href' | 'transform', string>;

/**
 * Calculates the union bounding box of multiple SVG elements, with special
 * handling for <g> and <use> elements.
 *
 * @param elements - An array of SVG elements.
 * @returns A single BBox that encloses all provided elements, or null if no valid elements are found.
 */
export const getUnionBBox = (elements: SVGElement[]): BBox | null => {
  if (!elements || elements.length === 0) {
    return null;
  }

  const bboxes = elements
    .map((el): BBox | null => {
      let untransformedBBox: BBox | null = null;
      const element = el as SVGGraphicsElement;

      // Special handling for <g> and <use> to find their untransformed box
      if (element.tagName === 'g') {
        untransformedBBox = getUnionBBox(Array.from(element.children) as SVGElement[]);
      } else if (element.tagName === 'use') {
        const dataXform = element.getAttribute('data-xform');
        const [formX = 0, formY = 0, width = 0, height = 0] =
          dataXform?.split(' ').map((v) => Number.parseFloat(v.split('=')[1])) || [];
        const x = Number.parseFloat(element.getAttribute('x') || '0') + formX;
        const y = Number.parseFloat(element.getAttribute('y') || '0') + formY;

        untransformedBBox = { height, width, x, y };
      } else {
        try {
          untransformedBBox = element.getBBox();
        } catch {
          return null;
        }
      }

      if (!untransformedBBox) {
        return null;
      }

      // Get the final, transformed bounding box using our new robust helper
      return getTransformedBBox(element, untransformedBBox);
    })
    .filter((b): b is BBox => b !== null);

  if (bboxes.length === 0) {
    return null;
  }

  // The reduce logic remains the same
  return bboxes.reduce((acc, current) => {
    const minX = Math.min(acc.x, current.x);
    const minY = Math.min(acc.y, current.y);
    const maxX = Math.max(acc.x + acc.width, current.x + current.width);
    const maxY = Math.max(acc.y + acc.height, current.y + current.height);

    return {
      height: maxY - minY,
      width: maxX - minX,
      x: minX,
      y: minY,
    };
  });
};
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
 * Calculates the final bounding box of a single element, including all transforms.
 *
 * @param el The SVG element to measure.
 * @param bbox The element's initial, untransformed bounding box.
 * @returns A new BBox that is the axis-aligned bounding box of the transformed element.
 */
export const getTransformedBBox = (el: SVGGraphicsElement, bbox: BBox): BBox => {
  // Use the standard SVGTransformList API to get the element's final transformation matrix.
  // This correctly handles any transform function (matrix, rotate, translate, etc.).
  // .consolidate() returns a single SVGTransform representing the combination of all transforms.
  const transformMatrix = el.transform.baseVal.consolidate()?.matrix;

  // If there's no transform, return the original box
  if (!transformMatrix) {
    return bbox;
  }

  const { a, b, c, d, e, f } = transformMatrix;
  const { height, width, x, y } = bbox;

  // Define the 4 corners of the original bounding box
  const corners = [
    { x, y }, // Top-left
    { x: x + width, y }, // Top-right
    { x, y: y + height }, // Bottom-left
    { x: x + width, y: y + height }, // Bottom-right
  ];

  // Apply the consolidated matrix transformation to each corner
  const transformedCorners = corners.map((p) => ({
    x: a * p.x + c * p.y + e,
    y: b * p.x + d * p.y + f,
  }));

  // Find the min and max coordinates of the new corner positions
  const minX = Math.min(...transformedCorners.map((p) => p.x));
  const minY = Math.min(...transformedCorners.map((p) => p.y));
  const maxX = Math.max(...transformedCorners.map((p) => p.x));
  const maxY = Math.max(...transformedCorners.map((p) => p.y));

  // The new bounding box is the one that perfectly encloses the transformed corners
  return {
    height: maxY - minY,
    width: maxX - minX,
    x: minX,
    y: minY,
  };
};

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
  { angle = 0, height, href, transform, width, x, y }: CreateImageParams,
  { isToSelect, parentCmd, svgElement }: Required<ConvertSvgToImageParams>,
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
  isToSelect = true,
  parentCmd = new history.BatchCommand('Convert Generic Svg to Image'),
  svgElement,
}: ConvertSvgToImageParams): Promise<ConvertToImageResult> {
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
