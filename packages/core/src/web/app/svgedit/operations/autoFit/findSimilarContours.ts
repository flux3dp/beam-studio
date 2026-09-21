import getUtilWS from '@core/helpers/api/utils-ws';
import { detectContours, getEffectiveContourEngine } from '@core/helpers/contour/detectContours';
import type { AutoFitContour } from '@core/interfaces/IAutoFit';

/**
 * Auto Fit's detect + group pipeline. OpenCV engine: one fluxghost round trip (as before).
 * ONNX engine: detect via the model, then hand the polygons to fluxghost's validated grouping.
 */
export const findSimilarContours = async (
  blob: Blob,
  opts: { isSplicingImg?: boolean; onProgress?: (progress: number) => void } = {},
): Promise<AutoFitContour[][]> => {
  const utilWS = getUtilWS();

  if (getEffectiveContourEngine() === 'opencv') return utilWS.getAllSimilarContours(blob, opts);

  const contours = await detectContours(blob, { engine: 'onnx', isSplicingImg: opts.isSplicingImg });

  return utilWS.groupContours(
    contours.map(({ contour }) => contour),
    { isSplicingImg: opts.isSplicingImg },
  );
};
