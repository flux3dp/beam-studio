import previewModeBackgroundDrawer from '@core/app/actions/beambox/preview-mode-background-drawer';
import workareaManager from '@core/app/svgedit/workarea';
import getOpenCV from '@core/helpers/api/open-cv';

import { markRadiusPx } from '../../constants';
import type { Point, RigidTransform } from '../rigidTransform';
import { applyRigidTransform, exceedsTolerance, fitRigidTransform, getMatchTolerance } from '../rigidTransform';

import { fitSummary, logAlign, pointMm } from './alignLog';

/** More detected blobs than this means the detection is too noisy to search */
const MAX_DETECTED_MARKS = 20;

/**
 * Detect the printed alignment marks in an image with the fluxghost blob
 * detector, using the shared size/circularity window around the printed mark
 * size. Kept in one place so the smart sweep and the background detection can
 * never drift apart.
 * @param blob the image
 * @param ratio image px per workarea canvas px
 * @returns blob centers in the image's own px; callers map them back to
 * canvas coordinates with their crop origin and `ratio`
 */
export const detectMarkBlobs = async (blob: Blob, ratio: number): Promise<Array<[number, number]>> => {
  const markRadiusOnImage = markRadiusPx * ratio;
  const markArea = Math.PI * markRadiusOnImage ** 2;
  const { points } = await getOpenCV().detectBlobs(blob, {
    max_area: markArea * 1.3,
    min_area: markArea * 0.7,
    min_circularity: 0.7,
  });

  return points;
};

const permutations = (items: number[]): number[][] => {
  if (items.length <= 1) return [items];

  return items.flatMap((item, index) =>
    permutations([...items.slice(0, index), ...items.slice(index + 1)]).map((rest) => [item, ...rest]),
  );
};

const combinations = (n: number, k: number): number[][] => {
  const result: number[][] = [];
  const current: number[] = [];
  const walk = (start: number) => {
    if (current.length === k) {
      result.push([...current]);

      return;
    }

    for (let i = start; i <= n - (k - current.length); i += 1) {
      current.push(i);
      walk(i + 1);
      current.pop();
    }
  };

  walk(0);

  return result;
};

export interface MarkSearch {
  /** Lowest-residual fit over all assignments, even when none is within tolerance: shown as a diagnostic */
  closest: null | RigidTransform;
  /** Number of mark-like blobs found, whatever the fit did with them */
  detectedCount: number;
  /** Where the fit puts the expected marks, in canvas px (`expected` order); null without a fit */
  marks: null | Point[];
  /** Best fit within tolerance, null when the marks could not be matched */
  transform: null | RigidTransform;
}

/**
 * Correspondence-free registration: the sheet can be placed anywhere at any
 * small rotation, so every assignment of detected blobs to the expected marks
 * is tried and scored by its best-fit rigid transform. The mark rectangle is
 * 180°-symmetric, so among well-fitting assignments the smallest rotation wins
 * — the sheet is assumed to be placed roughly in its printed orientation.
 */
export const findAlignment = (expected: Point[], detected: Point[]): MarkSearch => {
  const detectedCount = detected.length;

  if (detectedCount < expected.length || detectedCount > MAX_DETECTED_MARKS) {
    return { closest: null, detectedCount, marks: null, transform: null };
  }

  const tolerance = getMatchTolerance(expected);
  const expectedOrders = permutations([...expected.keys()]);
  let best: null | RigidTransform = null;
  let closest: null | RigidTransform = null;

  for (const combo of combinations(detectedCount, expected.length)) {
    const detectedPoints = combo.map((index) => detected[index]);

    for (const order of expectedOrders) {
      const fit = fitRigidTransform(
        order.map((index) => expected[index]),
        detectedPoints,
      );

      if (!closest || fit.residual < closest.residual) closest = fit;

      if (exceedsTolerance(fit, tolerance)) continue;

      if (
        !best ||
        Math.abs(fit.angle) < Math.abs(best.angle) ||
        (Math.abs(fit.angle) === Math.abs(best.angle) && fit.residual < best.residual)
      ) {
        best = fit;
      }
    }
  }

  return {
    closest,
    detectedCount,
    marks: best ? expected.map((point) => applyRigidTransform(point, best)) : null,
    transform: best,
  };
};

/**
 * Detect the marks in the current preview background (whole workarea) and fit them
 * @param stage which image is being searched, for the log
 */
export const detectFromBackground = async (expected: Point[], stage: string): Promise<MarkSearch & { url: string }> => {
  const url = await previewModeBackgroundDrawer.getCameraCanvasUrl({ useCache: false });
  const response = await fetch(url);
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);
  const ratio = bitmap.width / workareaManager.width;

  const points = await detectMarkBlobs(blob, ratio);
  const detected: Point[] = points.map(([x, y]) => ({ x: x / ratio, y: y / ratio }));
  const search = findAlignment(expected, detected);

  logAlign('detect', {
    closestFit: search.closest && fitSummary(search.closest),
    detectedMm: detected.map(pointMm),
    imageWidth: bitmap.width,
    matched: Boolean(search.transform),
    stage,
  });

  return { ...search, url };
};
