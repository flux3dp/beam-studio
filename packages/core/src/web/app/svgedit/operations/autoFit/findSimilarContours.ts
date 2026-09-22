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
  const engine = getEffectiveContourEngine();
  const start = performance.now();
  let groups: AutoFitContour[][];

  if (engine === 'opencv') {
    groups = await utilWS.getAllSimilarContours(blob, opts);
  } else {
    const contours = await detectContours(blob, { engine, isSplicingImg: opts.isSplicingImg });

    groups = await utilWS.groupContours(
      contours.map(({ contour }) => contour),
      { isSplicingImg: opts.isSplicingImg },
    );
  }

  console.info(
    `[autoFit] ${engine} detect+group ${Math.round(performance.now() - start)} ms, ${groups.flat().length} contours in ${groups.length} groups`,
  );

  return groups;
};
