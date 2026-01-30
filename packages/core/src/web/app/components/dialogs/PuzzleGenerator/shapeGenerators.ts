/**
 * Consolidated Shape Path Generators
 *
 * Single source of truth for all shape boundary paths used in:
 * - puzzleGenerator.ts (boundary generation)
 * - puzzleTypes.config.ts (clip path)
 * - Preview.tsx (preview clipping)
 * - svgExport.ts (border path generation)
 *
 * All shapes are generated centered at origin (0, 0) unless otherwise specified.
 */

// ============================================================================
// Constants
// ============================================================================

/**
 * Default heart sharpness value (0-50 scale where 0 = sharp, 50 = rounded)
 * Value of 25 creates a balanced, natural-looking heart shape
 */
export const DEFAULT_HEART_SHARPNESS = 25;

// ============================================================================
// Types
// ============================================================================

export type ShapeType = 'circle' | 'heart' | 'rectangle';

export interface ShapeOptions {
  /** Center X coordinate (default: 0) */
  centerX?: number;
  /** Center Y coordinate (default: 0) */
  centerY?: number;
  /** Corner radius for rectangle, bottom point sharpness for heart (0-50) */
  cornerRadius?: number;
  /** Total height of the shape */
  height: number;
  /** Total width of the shape */
  width: number;
}

export interface BorderOptions extends ShapeOptions {
  /** Border width to offset outward */
  borderWidth: number;
}

// ============================================================================
// Rectangle Shape
// ============================================================================

/**
 * Generate a rectangle path with optional corner radius
 * Centered at (centerX, centerY)
 */
export const generateRectanglePath = (options: ShapeOptions): string => {
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

// ============================================================================
// Ellipse/Circle Shape
// ============================================================================

/**
 * Generate an ellipse path that fits the given dimensions
 * Centered at (centerX, centerY)
 */
export const generateEllipsePath = (options: ShapeOptions): string => {
  const { centerX = 0, centerY = 0, height, width } = options;

  const radiusX = width / 2;
  const radiusY = height / 2;

  // Ellipse using two arc commands
  return [
    `M ${(centerX + radiusX).toFixed(2)} ${centerY.toFixed(2)}`,
    `A ${radiusX.toFixed(2)} ${radiusY.toFixed(2)} 0 1 1 ${(centerX - radiusX).toFixed(2)} ${centerY.toFixed(2)}`,
    `A ${radiusX.toFixed(2)} ${radiusY.toFixed(2)} 0 1 1 ${(centerX + radiusX).toFixed(2)} ${centerY.toFixed(2)}`,
    'Z',
  ].join(' ');
};

// ============================================================================
// Heart Shape
// ============================================================================

/**
 * Generate a heart path with configurable bottom point sharpness
 * Centered at (centerX, centerY), point faces downward
 *
 * @param cornerRadius - Controls bottom point sharpness (0 = sharp, 50 = very rounded)
 *                       Defaults to DEFAULT_HEART_SHARPNESS (25) for optimal heart shape
 */
export const generateHeartPath = (options: ShapeOptions): string => {
  const { centerX = 0, centerY = 0, cornerRadius = DEFAULT_HEART_SHARPNESS, height, width } = options;

  const topCurveHeight = height * 0.3;
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  // Key y-positions (centered at centerY)
  const topY = centerY - halfHeight;
  const notchY = topY + topCurveHeight;
  const bottomY = centerY + halfHeight;

  // Bottom point sharpness: cornerRadius 0 = sharp point, 50 = very rounded
  // This affects how far the control points pull away from the bottom point
  const sharpness = 1 - cornerRadius / 50; // 1 = sharp, 0 = rounded
  const bottomPullFactor = 0.3 + sharpness * 0.5; // 0.3 (rounded) to 0.8 (sharp)

  // Control points for bottom curves
  // First control point stays close to the side
  const bottomCtrl1Y = notchY + (bottomY - notchY) * 0.4;
  // Second control point: closer to center when sharp, further when rounded
  const bottomCtrl2X = halfWidth * bottomPullFactor;
  const bottomCtrl2Y = bottomY - (bottomY - notchY) * (0.2 + (1 - sharpness) * 0.3);

  return [
    // Start at top center notch
    `M ${centerX.toFixed(2)} ${notchY.toFixed(2)}`,
    // Top left curve (notch to left peak)
    `C ${centerX.toFixed(2)} ${topY.toFixed(2)} ${(centerX - halfWidth).toFixed(2)} ${topY.toFixed(2)} ${(centerX - halfWidth).toFixed(2)} ${notchY.toFixed(2)}`,
    // Bottom left curve
    `C ${(centerX - halfWidth).toFixed(2)} ${bottomCtrl1Y.toFixed(2)} ${(centerX - bottomCtrl2X).toFixed(2)} ${bottomCtrl2Y.toFixed(2)} ${centerX.toFixed(2)} ${bottomY.toFixed(2)}`,
    // Bottom right curve (mirror of left)
    `C ${(centerX + bottomCtrl2X).toFixed(2)} ${bottomCtrl2Y.toFixed(2)} ${(centerX + halfWidth).toFixed(2)} ${bottomCtrl1Y.toFixed(2)} ${(centerX + halfWidth).toFixed(2)} ${notchY.toFixed(2)}`,
    // Top right curve (right peak to notch)
    `C ${(centerX + halfWidth).toFixed(2)} ${topY.toFixed(2)} ${centerX.toFixed(2)} ${topY.toFixed(2)} ${centerX.toFixed(2)} ${notchY.toFixed(2)}`,
    'Z',
  ].join(' ');
};

// ============================================================================
// Unified Shape Generator
// ============================================================================

/**
 * Generate a shape path based on type
 * Centered at (centerX, centerY) or origin if not specified
 */
export const generateShapePath = (shapeType: ShapeType, options: ShapeOptions): string => {
  switch (shapeType) {
    case 'circle':
      return generateEllipsePath(options);
    case 'heart':
      return generateHeartPath(options);
    case 'rectangle':
      return generateRectanglePath(options);
    default:
      return generateRectanglePath(options);
  }
};

/**
 * Generate a border path (shape expanded outward by borderWidth)
 */
export const generateBorderPath = (shapeType: ShapeType, options: BorderOptions): string => {
  const { borderWidth, cornerRadius = 0, height, width, ...rest } = options;

  const expandedOptions: ShapeOptions = {
    ...rest,
    cornerRadius,
    height: height + borderWidth * 2,
    width: width + borderWidth * 2,
  };

  return generateShapePath(shapeType, expandedOptions);
};

// ============================================================================
// Boundary Check Helpers
// ============================================================================

/**
 * Check if a point is inside an ellipse centered at origin
 */
export const isPointInEllipse = (x: number, y: number, radiusX: number, radiusY: number): boolean =>
  (x * x) / (radiusX * radiusX) + (y * y) / (radiusY * radiusY) <= 1;

/**
 * Check if a point is inside a heart shape centered at origin
 * Uses mathematical heart curve approximation
 */
export const isPointInHeart = (px: number, py: number, width: number, height: number): boolean => {
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  // Normalize to [-1, 1] range (flip y so positive is up)
  const nx = px / halfWidth;
  const ny = -py / halfHeight;

  // Heart curve: (x² + y² - 1)³ - x²y³ <= 0
  const x2 = nx * nx;
  const term1 = x2 + ny * ny - 1;

  return term1 * term1 * term1 - x2 * ny * ny * ny <= 0;
};

/**
 * Check if a point is inside a rectangle centered at origin
 */
export const isPointInRectangle = (x: number, y: number, width: number, height: number): boolean =>
  Math.abs(x) <= width / 2 && Math.abs(y) <= height / 2;

/**
 * Check if a point is inside a shape boundary
 */
export const isPointInShape = (x: number, y: number, shapeType: ShapeType, width: number, height: number): boolean => {
  switch (shapeType) {
    case 'circle':
      return isPointInEllipse(x, y, width / 2, height / 2);
    case 'heart':
      return isPointInHeart(x, y, width, height);
    case 'rectangle':
      return isPointInRectangle(x, y, width, height);
    default:
      return true;
  }
};

// ============================================================================
// Clip Path for Konva (Canvas Context Drawing)
// ============================================================================

/**
 * Draw shape path on a canvas context for Konva clipFunc
 * Shape is centered at origin (0, 0)
 *
 * @param cornerRadius - For rectangle: corner rounding. For heart: ignored (uses DEFAULT_HEART_SHARPNESS)
 */
export const drawShapeClipPath = (
  ctx: CanvasRenderingContext2D,
  shapeType: ShapeType,
  width: number,
  height: number,
  cornerRadius: number = 0,
): void => {
  ctx.beginPath();

  switch (shapeType) {
    case 'circle': {
      ctx.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2);
      break;
    }

    case 'heart': {
      const topCurveHeight = height * 0.3;
      const halfWidth = width / 2;
      const halfHeight = height / 2;

      const topY = -halfHeight;
      const notchY = topY + topCurveHeight;
      const bottomY = halfHeight;

      // Use default heart sharpness for consistent heart shape
      const sharpness = 1 - DEFAULT_HEART_SHARPNESS / 50;
      const bottomPullFactor = 0.3 + sharpness * 0.5;
      const bottomCtrl1Y = notchY + (bottomY - notchY) * 0.4;
      const bottomCtrl2X = halfWidth * bottomPullFactor;
      const bottomCtrl2Y = bottomY - (bottomY - notchY) * (0.2 + (1 - sharpness) * 0.3);

      ctx.moveTo(0, notchY);
      ctx.bezierCurveTo(0, topY, -halfWidth, topY, -halfWidth, notchY);
      ctx.bezierCurveTo(-halfWidth, bottomCtrl1Y, -bottomCtrl2X, bottomCtrl2Y, 0, bottomY);
      ctx.bezierCurveTo(bottomCtrl2X, bottomCtrl2Y, halfWidth, bottomCtrl1Y, halfWidth, notchY);
      ctx.bezierCurveTo(halfWidth, topY, 0, topY, 0, notchY);
      break;
    }

    case 'rectangle': {
      const left = -width / 2;
      const top = -height / 2;

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

      break;
    }
  }

  ctx.closePath();
};
