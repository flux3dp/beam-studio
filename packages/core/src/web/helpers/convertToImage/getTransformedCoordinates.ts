import type { BBox } from './types';

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
