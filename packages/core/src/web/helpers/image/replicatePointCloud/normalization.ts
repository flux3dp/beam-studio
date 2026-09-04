import type { PointCloudConversionOptions } from './types';

export const DEFAULT_MAX_POINTS = 250_000;
export const DEFAULT_WIDTH_MM = 100;

const getQuantile = (sorted: number[], ratio: number): number =>
  sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * ratio)))];

const getRobustRange = (values: number[], lowerRatio = 0.01, upperRatio = 0.99): [number, number] => {
  if (!values.length) throw new Error('Point cloud has no finite positions');

  values.sort((a, b) => a - b);

  if (values.length < 100) {
    const lower = values[0];
    const upper = values.at(-1)!;

    return upper > lower ? [lower, upper] : [lower, lower + 1];
  }

  const lower = getQuantile(values, lowerRatio);
  const upper = getQuantile(values, upperRatio);

  return upper > lower ? [lower, upper] : [lower, lower + 1];
};

export interface CameraPointAxes {
  depth: { index: 0 | 1 | 2; sign: -1 | 1 };
  horizontal: { index: 0 | 1 | 2; sign: -1 | 1 };
  vertical: { index: 0 | 1 | 2; sign: -1 | 1 };
}

/**
 * Put camera-space points into Beam Studio coordinates with one uniform XYZ scale.
 *
 * The robust bounds discard extreme sky/outlier points, then the retained width is fitted to the
 * requested display width. Camera depth is flipped to Z-up, but is otherwise scaled by exactly the
 * same factor as X and Y. `reliefDepthMm` remains an explicit opt-in override for comparisons that
 * need a fixed relief thickness; normal imports leave it unset and preserve source proportions.
 */
export const cameraPointsToDisplayPositions = (
  source: Float32Array,
  axes: CameraPointAxes,
  options: PointCloudConversionOptions = {},
): Float32Array => {
  if (!source.length || source.length % 3 !== 0) throw new Error('Camera point map must contain XYZ triples');

  const pointCount = source.length / 3;
  const statsStride = Math.max(1, Math.floor(pointCount / 50_000));
  const horizontalValues: number[] = [];
  const verticalValues: number[] = [];
  const depthValues: number[] = [];

  for (let point = 0; point < pointCount; point += statsStride) {
    const offset = point * 3;
    const horizontal = source[offset + axes.horizontal.index] * axes.horizontal.sign;
    const vertical = source[offset + axes.vertical.index] * axes.vertical.sign;
    const depth = source[offset + axes.depth.index] * axes.depth.sign;

    if (!Number.isFinite(horizontal) || !Number.isFinite(vertical) || !Number.isFinite(depth)) continue;

    horizontalValues.push(horizontal);
    verticalValues.push(vertical);
    depthValues.push(depth);
  }

  const [left, right] = getRobustRange(horizontalValues);
  const [bottom, top] = getRobustRange(verticalValues);
  const [near, far] = getRobustRange(depthValues, 0.02, 0.98);
  const widthMm = options.widthMm ?? DEFAULT_WIDTH_MM;
  const { reliefDepthMm } = options;
  const maxPoints = options.maxPoints ?? DEFAULT_MAX_POINTS;

  if (!(widthMm > 0) || !(maxPoints > 0) || (reliefDepthMm !== undefined && !(reliefDepthMm > 0))) {
    throw new Error('Point-cloud conversion dimensions must be positive');
  }

  const scale = widthMm / (right - left);
  const centerX = (left + right) / 2;
  const centerY = (bottom + top) / 2;
  const outputStride = Math.max(1, Math.ceil(pointCount / maxPoints));
  const output: number[] = [];

  for (let point = 0; point < pointCount; point += outputStride) {
    const offset = point * 3;
    const horizontal = source[offset + axes.horizontal.index] * axes.horizontal.sign;
    const vertical = source[offset + axes.vertical.index] * axes.vertical.sign;
    const depth = source[offset + axes.depth.index] * axes.depth.sign;

    if (
      !Number.isFinite(horizontal) ||
      !Number.isFinite(vertical) ||
      !Number.isFinite(depth) ||
      horizontal < left ||
      horizontal > right ||
      vertical < bottom ||
      vertical > top ||
      depth < near ||
      depth > far
    ) {
      continue;
    }

    output.push(
      (horizontal - centerX) * scale,
      (vertical - centerY) * scale,
      reliefDepthMm === undefined ? (far - depth) * scale : ((far - depth) / (far - near)) * reliefDepthMm,
    );
  }

  if (!output.length) throw new Error('Point cloud has no usable positions');

  return new Float32Array(output);
};

export interface DepthMapOptions extends PointCloudConversionOptions {
  alphaMask?: Float32Array | Uint8Array;
  height: number;
  skyMask?: Uint8Array;
  width: number;
}

/** Back-project a row-major depth image, then fit it with the same uniform XYZ display scale. */
export const depthMapToDisplayPositions = (depth: Float32Array, options: DepthMapOptions): Float32Array => {
  const { alphaMask, height, skyMask, width } = options;

  if (width <= 0 || height <= 0 || depth.length !== width * height) {
    throw new Error('Depth map dimensions do not match its data');
  }

  if ((alphaMask && alphaMask.length !== depth.length) || (skyMask && skyMask.length !== depth.length)) {
    throw new Error('Depth-map mask dimensions do not match its data');
  }

  const focalLengthPx = options.focalLengthPx ?? Math.max(width, height);
  const maxPoints = options.maxPoints ?? DEFAULT_MAX_POINTS;

  if (!(focalLengthPx > 0) || !(maxPoints > 0)) {
    throw new Error('Depth-map conversion dimensions must be positive');
  }

  const sampleStep = Math.max(1, Math.ceil(Math.sqrt(depth.length / maxPoints)));
  const cameraPoints: number[] = [];

  for (let row = 0; row < height; row += sampleStep) {
    for (let column = 0; column < width; column += sampleStep) {
      const index = row * width + column;
      const value = depth[index];

      if (
        !Number.isFinite(value) ||
        value <= 0 ||
        (alphaMask && alphaMask[index] <= 0) ||
        (skyMask && skyMask[index] !== 0)
      ) {
        continue;
      }

      const xRatio = (column + 0.5) / width;
      const yRatio = (row + 0.5) / height;

      cameraPoints.push(
        (xRatio - 0.5) * width * (value / focalLengthPx),
        (0.5 - yRatio) * height * (value / focalLengthPx),
        value,
      );
    }
  }

  if (!cameraPoints.length) throw new Error('Depth map has no usable pixels');

  return cameraPointsToDisplayPositions(
    new Float32Array(cameraPoints),
    {
      depth: { index: 2, sign: 1 },
      horizontal: { index: 0, sign: 1 },
      vertical: { index: 1, sign: 1 },
    },
    options,
  );
};
