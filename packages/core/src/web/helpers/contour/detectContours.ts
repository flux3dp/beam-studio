import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import { hasSwiftray, swiftrayClient } from '@core/helpers/api/swiftray-client';
import getUtilWS from '@core/helpers/api/utils-ws';
import isWeb from '@core/helpers/is-web';
import versionChecker from '@core/helpers/version-checker';
import type { AutoFitContour } from '@core/interfaces/IAutoFit';

export type ContourEngine = 'onnx' | 'opencv';
export type DetectedContour = AutoFitContour;

/**
 * Resolve the engine that will actually run: the user's preference, downgraded to 'opencv'
 * whenever the ONNX host is not available in this build/environment.
 */
export const getEffectiveContourEngine = (): ContourEngine => {
  if (isWeb() || !hasSwiftray || !versionChecker(swiftrayClient.version).meetRequirement('SWIFTRAY_SEGMENT')) {
    return 'opencv';
  }

  const preferred = useGlobalPreferenceStore.getState()['contour-engine'];

  return preferred;
};

/**
 * SAM encodes at 1024 px on the longest side regardless of input, so anything larger only makes the
 * full-resolution mask upsampling, contour tracing and transfer slower (a 10 px/mm bed preview is
 * 3000+ px wide). 1280 px is what the golden parity was validated at; 0.23 mm/px on a 300 mm bed.
 */
const ONNX_MAX_SIDE = 1280;

const downscaleForOnnx = async (blob: Blob, maxSide: number): Promise<{ blob: Blob; scale: number }> => {
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));

  if (scale === 1) return { blob, scale };

  const canvas = document.createElement('canvas');

  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const scaled = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));

  if (!scaled) throw new Error('Failed to downscale image');

  return { blob: scaled, scale };
};

const detectWithOnnx = async (blob: Blob): Promise<DetectedContour[]> => {
  const { blob: scaled, scale } = await downscaleForOnnx(blob, ONNX_MAX_SIDE);
  const { height, objects, timeMs, width } = await swiftrayClient.detectContours(scaled);
  const k = 1 / scale;

  console.info(
    `[detectContours] onnx model ${Math.round(timeMs)} ms at ${width}x${height} (scale ${scale.toFixed(3)})`,
  );

  return objects.map(({ angle, bbox, center, polygon }) => ({
    angle,
    bbox: bbox.map((v) => v * k),
    center: center.map((v) => v * k),
    contour: polygon.map(([x, y]) => [x * k, y * k] as [number, number]),
  }));
};

/**
 * Engine-agnostic "find every object in this preview image" — the single seam both Auto Fit and
 * image-contour Auto Align consume. Coordinates are image px of `blob`.
 * An ONNX failure falls back to OpenCV for this call only (the preference is left untouched).
 */
export const detectContours = async (
  blob: Blob,
  opts: { engine?: ContourEngine; isSplicingImg?: boolean } = {},
): Promise<DetectedContour[]> => {
  const engine = opts.engine ?? getEffectiveContourEngine();

  if (engine === 'onnx') {
    try {
      return await detectWithOnnx(blob);
    } catch (error) {
      console.warn('ONNX contour detection failed, falling back to OpenCV for this call', error);
    }
  }

  return getUtilWS().getContours(blob, { isSplicingImg: opts.isSplicingImg });
};
