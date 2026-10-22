import type { MaterialShape } from '@core/app/constants/innerEngraving';

export type MaterialRotation = [number, number, number];

/**
 * Rotates three.js's Y-up round geometries into this canvas's Z-up coordinates.
 *
 * The box must also receive an explicit zero rotation. React Three Fiber ignores an `undefined`
 * prop, so a region mesh reused after switching from a cylinder or sphere would otherwise retain
 * its old 90-degree rotation. Newly mounted regions would remain unrotated, making the blue and
 * out-of-range grey parts disagree and visually swapping the material's depth and height.
 */
export const getMaterialRotation = (shape: MaterialShape): MaterialRotation =>
  shape === 'box' ? [0, 0, 0] : [Math.PI / 2, 0, 0];
