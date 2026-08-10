import type { BufferGeometry } from 'three';
import { Box3, Matrix4 } from 'three';

import { STL_ATTR } from '@core/app/svgedit/stl/constants';
import type { StlTransformAttr } from '@core/app/svgedit/stl/transformAttr';
import { serializeStlTransform } from '@core/app/svgedit/stl/transformAttr';
import workareaManager from '@core/app/svgedit/workarea';

import { sceneToSvgY } from './coordinates';
/**
 * Serialize a matrix for the `data-stl-matrix` attribute: 16 numbers, column-major, space separated.
 */
export const serializeMatrix = (matrix: Matrix4): string => matrix.elements.join(' ');

/** Inverse of {@link serializeMatrix}. Returns an identity matrix when the attribute is unusable. */
export const parseMatrix = (value: null | string): Matrix4 => {
  const numbers = value?.trim().split(/\s+/).map(Number);

  if (numbers?.length !== 16 || numbers.some(Number.isNaN)) return new Matrix4();

  return new Matrix4().fromArray(numbers);
};

/**
 * Scene space -> canvas space: the same points, with Y measured from the other end.
 *
 * The scene's Y points towards the back (CAD convention) and the canvas's points down (SVG), so a
 * conversion is unavoidable somewhere. It happens **here and nowhere else**: from this point on —
 * the rect's geometry, `data-stl-matrix`, the G-code the backend produces from either — everything
 * is in canvas coordinates.
 */
const toSvgMatrix = (matrix: Matrix4): Matrix4 =>
  new Matrix4()
    .makeTranslation(0, workareaManager.height, 0)
    .multiply(new Matrix4().makeScale(1, -1, 1))
    .multiply(matrix);

/**
 * The XY footprint of an STL 3D object, in SVG user units (Y down).
 *
 * Uses the transformed axis-aligned bounding box, which for a rotated mesh is slightly larger than
 * the true silhouette. Being conservative is the safe direction here: framing and alignment cover
 * the object rather than clipping it.
 */
export const getProjection = (
  geometry: BufferGeometry,
  matrix: Matrix4,
): { height: number; width: number; x: number; y: number } => {
  if (!geometry.boundingBox) geometry.computeBoundingBox();

  const box = new Box3().copy(geometry.boundingBox!).applyMatrix4(matrix);

  return {
    height: box.max.y - box.min.y,
    width: box.max.x - box.min.x,
    x: box.min.x,
    // the rect's y is its top edge in canvas terms, which is the box's **maximum** in scene terms:
    // the two Y axes run in opposite directions
    y: sceneToSvgY(box.max.y),
  };
};

/**
 * Write the 3D object's state back onto its projection rect.
 *
 * The rect is derived: this is the only direction data flows. A 2D edit has to change the 3D
 * object's matrix first and then call this, never write the rect's geometry directly.
 */
export const updateProjectionRect = (
  elem: SVGRectElement,
  geometry: BufferGeometry,
  matrix: Matrix4,
  /**
   * Omitted mid-drag, where only the matrix moves and the committed transform is written once the
   * drag ends. Everything that changes the stored transform must pass it, or reopening the file
   * would have to guess the decomposition back out of the matrix.
   */
  transforms?: StlTransformAttr,
): void => {
  const { height, width, x, y } = getProjection(geometry, matrix);

  elem.setAttribute('x', String(x));
  elem.setAttribute('y', String(y));
  elem.setAttribute('width', String(width));
  elem.setAttribute('height', String(height));
  // canvas coordinates, not scene ones: the backend applies this matrix to the mesh and its output
  // is a G-code position
  elem.setAttribute(STL_ATTR.matrix, serializeMatrix(toSvgMatrix(matrix)));

  if (transforms) elem.setAttribute(STL_ATTR.transform, serializeStlTransform(transforms));
};
