import type { BufferGeometry } from 'three';
import { Box3, Matrix4 } from 'three';

import { STL_ATTR } from '@core/app/svgedit/stl/constants';
import { todo } from '@core/helpers/is-dev';

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

todo('Check getProjection y');

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
    // scene Y grows towards the back, so the box's max maps to the rect's top edge
    y: sceneToSvgY(box.max.y),
  };
};

todo('Check updateProjectionRect 是否需要加進 history');

/**
 * Write the 3D object's state back onto its projection rect.
 *
 * The rect is derived: this is the only direction data flows. A 2D edit has to change the 3D
 * object's matrix first and then call this, never write the rect's geometry directly.
 */
export const updateProjectionRect = (elem: SVGRectElement, geometry: BufferGeometry, matrix: Matrix4): void => {
  const { height, width, x, y } = getProjection(geometry, matrix);

  elem.setAttribute('x', String(x));
  elem.setAttribute('y', String(y));
  elem.setAttribute('width', String(width));
  elem.setAttribute('height', String(height));
  elem.setAttribute(STL_ATTR.matrix, serializeMatrix(matrix));
};
