/**
 * Rectangle shape implementation.
 * Supports corner radius for rounded rectangle boundaries.
 */

import type { ShapeMetadata } from '../../types';

import { createExpandedBorderPath, type MetadataInput, type ShapeGenerator, type ShapeOptions } from './types';

const generateRectanglePath = (options: ShapeOptions): string => {
  const { centerX = 0, centerY = 0, cornerRadius = 0, height, width } = options;

  const left = centerX - width / 2;
  const top = centerY - height / 2;
  const right = centerX + width / 2;
  const bottom = centerY + height / 2;

  if (cornerRadius > 0) {
    const r = Math.min(cornerRadius, width / 2, height / 2);

    return [
      `M ${(left + r).toFixed(2)} ${top.toFixed(2)}`,
      `L ${(right - r).toFixed(2)} ${top.toFixed(2)}`,
      `A ${r} ${r} 0 0 1 ${right.toFixed(2)} ${(top + r).toFixed(2)}`,
      `L ${right.toFixed(2)} ${(bottom - r).toFixed(2)}`,
      `A ${r} ${r} 0 0 1 ${(right - r).toFixed(2)} ${bottom.toFixed(2)}`,
      `L ${(left + r).toFixed(2)} ${bottom.toFixed(2)}`,
      `A ${r} ${r} 0 0 1 ${left.toFixed(2)} ${(bottom - r).toFixed(2)}`,
      `L ${left.toFixed(2)} ${(top + r).toFixed(2)}`,
      `A ${r} ${r} 0 0 1 ${(left + r).toFixed(2)} ${top.toFixed(2)}`,
      'Z',
    ].join(' ');
  }

  return [
    `M ${left.toFixed(2)} ${top.toFixed(2)}`,
    `L ${right.toFixed(2)} ${top.toFixed(2)}`,
    `L ${right.toFixed(2)} ${bottom.toFixed(2)}`,
    `L ${left.toFixed(2)} ${bottom.toFixed(2)}`,
    'Z',
  ].join(' ');
};

export const rectangleShape: ShapeGenerator = {
  drawClipPath(ctx, width, height, cornerRadius = 0) {
    const left = -width / 2;
    const top = -height / 2;

    ctx.beginPath();

    if (cornerRadius > 0) {
      const r = Math.min(cornerRadius, width / 2, height / 2);

      ctx.moveTo(left + r, top);
      ctx.lineTo(left + width - r, top);
      ctx.arcTo(left + width, top, left + width, top + r, r);
      ctx.lineTo(left + width, top + height - r);
      ctx.arcTo(left + width, top + height, left + width - r, top + height, r);
      ctx.lineTo(left + r, top + height);
      ctx.arcTo(left, top + height, left, top + height - r, r);
      ctx.lineTo(left, top + r);
      ctx.arcTo(left, top, left + r, top, r);
    } else {
      ctx.rect(left, top, width, height);
    }

    ctx.closePath();
  },

  generateBorderPath: (options) => createExpandedBorderPath(generateRectanglePath, options),

  generatePath: generateRectanglePath,

  getMetadata(input: MetadataInput): ShapeMetadata {
    const gridH = input.rows * input.pieceSize;
    const puzzleRadius = input.radius ?? 0;

    return {
      borderCornerRadius: input.border.radius,
      boundaryCornerRadius: puzzleRadius,
      boundaryHeight: gridH,
      centerYOffset: 0,
      fillsBoundingBox: puzzleRadius <= 0,
      innerCutoutCornerRadius: puzzleRadius,
    };
  },

  isPointInside(x, y, width, height, cornerRadius = 0) {
    const hw = width / 2;
    const hh = height / 2;

    if (Math.abs(x) > hw || Math.abs(y) > hh) return false;

    if (cornerRadius <= 0) return true;

    const r = Math.min(cornerRadius, hw, hh);
    const ax = Math.abs(x);
    const ay = Math.abs(y);

    // Only check corner arcs when the point is in a corner region
    if (ax > hw - r && ay > hh - r) {
      const dx = ax - (hw - r);
      const dy = ay - (hh - r);

      return dx * dx + dy * dy <= r * r;
    }

    return true;
  },
};
