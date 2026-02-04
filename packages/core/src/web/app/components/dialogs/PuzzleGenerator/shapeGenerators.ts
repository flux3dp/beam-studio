/**
 * Shape path generators for puzzle boundaries.
 * All shapes are centered at origin (0, 0).
 */

import { match } from 'ts-pattern';

export const DEFAULT_HEART_SHARPNESS = 25;

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
  borderWidth: number;
}

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

export const generateEllipsePath = (options: ShapeOptions): string => {
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

export const generateHeartPath = (options: ShapeOptions): string => {
  const { centerX = 0, centerY = 0, cornerRadius = DEFAULT_HEART_SHARPNESS, height, width } = options;

  const topCurveHeight = height * 0.3;
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const topY = centerY - halfHeight;
  const notchY = topY + topCurveHeight;
  const bottomY = centerY + halfHeight;

  const sharpness = 1 - cornerRadius / 50;
  const bottomPullFactor = 0.3 + sharpness * 0.5;
  const bottomCtrl1Y = notchY + (bottomY - notchY) * 0.4;
  const bottomCtrl2X = halfWidth * bottomPullFactor;
  const bottomCtrl2Y = bottomY - (bottomY - notchY) * (0.2 + (1 - sharpness) * 0.3);

  return [
    `M ${centerX.toFixed(2)} ${notchY.toFixed(2)}`,
    `C ${centerX.toFixed(2)} ${topY.toFixed(2)} ${(centerX - halfWidth).toFixed(2)} ${topY.toFixed(2)} ${(centerX - halfWidth).toFixed(2)} ${notchY.toFixed(2)}`,
    `C ${(centerX - halfWidth).toFixed(2)} ${bottomCtrl1Y.toFixed(2)} ${(centerX - bottomCtrl2X).toFixed(2)} ${bottomCtrl2Y.toFixed(2)} ${centerX.toFixed(2)} ${bottomY.toFixed(2)}`,
    `C ${(centerX + bottomCtrl2X).toFixed(2)} ${bottomCtrl2Y.toFixed(2)} ${(centerX + halfWidth).toFixed(2)} ${bottomCtrl1Y.toFixed(2)} ${(centerX + halfWidth).toFixed(2)} ${notchY.toFixed(2)}`,
    `C ${(centerX + halfWidth).toFixed(2)} ${topY.toFixed(2)} ${centerX.toFixed(2)} ${topY.toFixed(2)} ${centerX.toFixed(2)} ${notchY.toFixed(2)}`,
    'Z',
  ].join(' ');
};

/**
 * Shape metadata describing capabilities and parameter resolution.
 * Queried by consumer code instead of checking shape names directly.
 */
export interface ShapeMetadata {
  /** Corner radius for the outer border frame (resolved from state) */
  borderCornerRadius: number;
  /** Corner radius for the puzzle boundary (resolved from state) */
  boundaryCornerRadius: number;
  /** Whether the shape fills its entire bounding box (no clipping/merging needed when true) */
  fillsBoundingBox: boolean;
  /** Corner radius for the inner cutout of raised edges (resolved from state) */
  innerCutoutCornerRadius: number;
}

/**
 * Resolves shape metadata from state. Single source of truth for shape-specific behavior.
 * Adding a new shape to ShapeType will force an update here via .exhaustive().
 */
export const getShapeMetadata = (
  shapeType: ShapeType,
  state: { border: { radius: number }; radius?: number },
): ShapeMetadata =>
  match(shapeType)
    .with('circle', () => ({
      borderCornerRadius: state.border.radius,
      boundaryCornerRadius: 0,
      fillsBoundingBox: false,
      innerCutoutCornerRadius: state.border.radius,
    }))
    .with('heart', () => ({
      borderCornerRadius: DEFAULT_HEART_SHARPNESS,
      boundaryCornerRadius: DEFAULT_HEART_SHARPNESS,
      fillsBoundingBox: false,
      innerCutoutCornerRadius: DEFAULT_HEART_SHARPNESS,
    }))
    .with('rectangle', () => {
      const puzzleRadius = state.radius ?? 0;

      return {
        borderCornerRadius: state.border.radius,
        boundaryCornerRadius: puzzleRadius,
        fillsBoundingBox: puzzleRadius <= 0,
        innerCutoutCornerRadius: puzzleRadius > 0 ? puzzleRadius : state.border.radius,
      };
    })
    .exhaustive();

export const generateShapePath = (shapeType: ShapeType, options: ShapeOptions): string =>
  match(shapeType)
    .with('circle', () => generateEllipsePath(options))
    .with('heart', () => generateHeartPath(options))
    .with('rectangle', () => generateRectanglePath(options))
    .exhaustive();

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

export interface RaisedEdgesOptions extends BorderOptions {
  /** Corner radius for the inner cutout (defaults to cornerRadius if not specified) */
  innerCornerRadius?: number;
}

/**
 * Generates a frame/raised edges path with inner cutout.
 * The outer boundary matches the board base size, inner boundary is the puzzle shape.
 * Uses even-odd fill rule to create the cutout effect.
 */
export const generateRaisedEdgesPath = (shapeType: ShapeType, options: RaisedEdgesOptions): string => {
  const { borderWidth, cornerRadius = 0, height, innerCornerRadius, width, ...rest } = options;

  // Outer boundary (same size as board base)
  const outerOptions: ShapeOptions = {
    ...rest,
    cornerRadius,
    height: height + borderWidth * 2,
    width: width + borderWidth * 2,
  };

  // Inner boundary (puzzle shape) — uses innerCornerRadius if specified
  const innerOptions: ShapeOptions = {
    ...rest,
    cornerRadius: innerCornerRadius ?? cornerRadius,
    height,
    width,
  };

  const outerPath = generateShapePath(shapeType, outerOptions);
  const innerPath = generateShapePath(shapeType, innerOptions);

  // Combine paths - the inner path creates the cutout
  return `${outerPath} ${innerPath}`;
};

export const isPointInEllipse = (x: number, y: number, radiusX: number, radiusY: number): boolean =>
  (x * x) / (radiusX * radiusX) + (y * y) / (radiusY * radiusY) <= 1;

export const isPointInHeart = (px: number, py: number, width: number, height: number): boolean => {
  const nx = px / (width / 2);
  const ny = -py / (height / 2);
  const x2 = nx * nx;
  const term1 = x2 + ny * ny - 1;

  return term1 * term1 * term1 - x2 * ny * ny * ny <= 0;
};

export const isPointInRectangle = (x: number, y: number, width: number, height: number, cornerRadius = 0): boolean => {
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
};

export const isPointInShape = (
  x: number,
  y: number,
  shapeType: ShapeType,
  width: number,
  height: number,
  cornerRadius = 0,
): boolean =>
  match(shapeType)
    .with('circle', () => isPointInEllipse(x, y, width / 2, height / 2))
    .with('heart', () => isPointInHeart(x, y, width, height))
    .with('rectangle', () => isPointInRectangle(x, y, width, height, cornerRadius))
    .exhaustive();

/** Draw shape path on a canvas context for Konva clipFunc */
export const drawShapeClipPath = (
  ctx: CanvasRenderingContext2D,
  shapeType: ShapeType,
  width: number,
  height: number,
  cornerRadius: number = 0,
): void => {
  ctx.beginPath();

  match(shapeType)
    .with('circle', () => {
      ctx.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2);
    })
    .with('heart', () => {
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
    })
    .with('rectangle', () => {
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
    })
    .exhaustive();

  ctx.closePath();
};
