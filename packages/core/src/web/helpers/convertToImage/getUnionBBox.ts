import type { BBox } from './types';

/**
 * Calculates the final bounding box of a single element, including all transforms.
 *
 * @param el The SVG element to measure.
 * @param bbox The element's initial, untransformed bounding box.
 * @returns A new BBox that is the axis-aligned bounding box of the transformed element.
 */
const getTransformedBBox = (el: SVGGraphicsElement, bbox: BBox): BBox => {
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
  // Order: top-left, top-right, bottom-left, bottom-right
  const corners = [
    { x, y },
    { x: x + width, y },
    { x, y: y + height },
    { x: x + width, y: y + height },
  ];

  // Apply the consolidated matrix transformation to each corner
  const transformedCorners = corners.map(({ x, y }) => ({ x: a * x + c * y + e, y: b * x + d * y + f }));
  const xs = transformedCorners.map(({ x }) => x);
  const ys = transformedCorners.map(({ y }) => y);

  // Find the min and max coordinates of the new corner positions
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  // The new bounding box is the one that perfectly encloses the transformed corners
  return { height: maxY - minY, width: maxX - minX, x: minX, y: minY };
};

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

    return { height: maxY - minY, width: maxX - minX, x: minX, y: minY };
  });
};
