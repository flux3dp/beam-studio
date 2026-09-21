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

const detectWithOnnx = async (blob: Blob): Promise<DetectedContour[]> => {
  const { objects } = await swiftrayClient.detectContours(blob);

  return objects.map(({ angle, bbox, center, polygon }) => ({ angle, bbox, center, contour: polygon }));
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
