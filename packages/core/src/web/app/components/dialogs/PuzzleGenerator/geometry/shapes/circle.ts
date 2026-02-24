/**
 * Circle (ellipse) shape implementation.
 * Uses standard ellipse path — stretches to fill grid dimensions.
 */

import type { ShapeMetadata } from '../../types';

import { createExpandedBorderPath, type MetadataInput, type ShapeGenerator, type ShapeOptions } from './types';

const generateEllipsePath = (options: ShapeOptions): string => {
  const { centerX = 0, centerY = 0, height, width } = options;

  const radiusX = width / 2;
  const radiusY = height / 2;

  return [
    `M ${(centerX + radiusX).toFixed(2)} ${centerY.toFixed(2)}`,
    `A ${radiusX.toFixed(2)} ${radiusY.toFixed(2)} 0 1 1 ${(centerX - radiusX).toFixed(2)} ${centerY.toFixed(2)}`,
    `A ${radiusX.toFixed(2)} ${radiusY.toFixed(2)} 0 1 1 ${(centerX + radiusX).toFixed(2)} ${centerY.toFixed(2)}`,
    'Z',
  ].join(' ');
};

export const circleShape: ShapeGenerator = {
  drawClipPath(ctx, { height, width }) {
    ctx.beginPath();
    ctx.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2);
    ctx.closePath();
  },

  generateBorderPath: (options) => createExpandedBorderPath(generateEllipsePath, options),

  generatePath: generateEllipsePath,

  getMetadata(input: MetadataInput): ShapeMetadata {
    const gridH = input.rows * input.pieceSize;

    return {
      borderCornerRadius: input.border.radius,
      boundaryCornerRadius: 0,
      boundaryHeight: gridH,
      centerYOffset: 0,
      fillsBoundingBox: false,
      innerCutoutCornerRadius: input.border.radius,
    };
  },

  isPointInside(x, y, { height, width }) {
    const radiusX = width / 2;
    const radiusY = height / 2;

    return (x * x) / (radiusX * radiusX) + (y * y) / (radiusY * radiusY) <= 1;
  },
};
