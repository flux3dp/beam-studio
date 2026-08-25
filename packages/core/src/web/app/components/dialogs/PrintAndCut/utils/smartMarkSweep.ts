import { dpmm } from '@core/app/actions/beambox/constant';
import previewModeBackgroundDrawer from '@core/app/actions/beambox/preview-mode-background-drawer';
import previewModeController from '@core/app/actions/beambox/preview-mode-controller';
import workareaManager from '@core/app/svgedit/workarea';
import shortcuts from '@core/helpers/shortcuts';

import { MARK_DIAMETER_MM, markRadiusPx, MATCH_TOLERANCE, MAX_SMART_ANGLE_RAD } from '../constants';

import { reportAlignProgress } from './alignProgress';
import { detectMarkBlobs } from './detectMarkBlobs';
import type { Point } from './rigidTransform';
import { applyRigidTransform, distance, fitRigidTransform } from './rigidTransform';

/**
 * Search radius around a translation-only prediction: must tolerate the error a
 * small sheet rotation causes over the mark-rectangle span
 */
const CONFIRM_RADIUS_PX = 15 * dpmm;
/** Search radius around a rigid-fit prediction (two or more marks confirmed) */
const REFINED_CONFIRM_RADIUS_PX = 5 * dpmm;
const PAIR_DISTANCE_TOLERANCE_PX = 3 * dpmm;
const BLOB_DEDUPE_RADIUS_PX = MARK_DIAMETER_MM * dpmm;
/** Budget for targeted captures outside the serpentine (hypothesis confirmations) */
const MAX_TARGETED_CAPTURES = 10;
const MAX_BLOBS_PER_TILE = 10;
const SWEEP_OVERLAP_RATIO = 0.05;

/**
 * Expected-mark index pairs, most likely first: the serpentine sweeps the top
 * row first, so the top marks (TL=0, TR=1) are normally found first
 */
const PAIR_PRIORITY: Array<[number, number]> = [
  [0, 1],
  [0, 3],
  [1, 2],
  [2, 3],
  [0, 2],
  [1, 3],
];

/** Single-anchor assignment priority (serpentine prior: top marks first) */
const SINGLE_PRIORITY = [0, 1, 2, 3];

interface Hypothesis {
  /** initial correspondences: [expected mark index, index into `found`] */
  base: Array<[number, number]>;
  key: string;
}

export interface SmartSweepResult {
  /**
   * Mark centers ordered like the expected marks [TL, TR, BL, BR], in canvas px;
   * null when the smart flow degraded to a plain full sweep (the canvas is then
   * fully swept and the caller's image-detection path applies)
   */
  detectedMarks: null | Point[];
  /** A tile capture returned false (machine failure) — treat like a failed previewRegion */
  failed: boolean;
  /** The user pressed ESC; the partial capture is kept, no fallback sweep runs */
  stopped: boolean;
}

/** Thrown internally when a single tile capture fails, mirroring previewRegion's abort */
class CaptureFailedError extends Error {
  constructor() {
    super();
    this.name = 'CaptureFailedError';
  }
}

const hypothesisKey = (base: Array<[number, number]>): string =>
  base
    .map(([expectedIndex, blobIndex]) => `${expectedIndex}:${blobIndex}`)
    .sort()
    .join(',');

/**
 * Sweep the workarea like previewRegion, but detect the printed alignment marks
 * on each captured tile: once the found blobs pin down where the sheet is, the
 * camera is driven straight to the predicted positions of the remaining marks
 * and the sweep stops — usually after a handful of tiles instead of the whole
 * bed. On any dead end the flow degrades in place to the plain full sweep. The
 * returned centers are at sweep precision; refineMarkPatches sharpens them.
 */
/** Set by the running sweep so stopSmartMarkSweep can reach its local flag */
let requestStop: () => void = () => {};

/**
 * Stop the sweep runSmartMarkSweep is currently running, after its in-flight
 * tile; no-op when none is running. The align step's Stop button and the ESC
 * shortcut both stop the sweep through this.
 */
export const stopSmartMarkSweep = (): void => requestStop();

export const runSmartMarkSweep = async (expectedMarks: Point[]): Promise<SmartSweepResult> => {
  const { modelHeight: workareaHeight, width: workareaWidth } = workareaManager;
  const points = previewModeController.getRegionPreviewPoints(0, 0, workareaWidth, workareaHeight, {
    overlapRatio: SWEEP_OVERLAP_RATIO,
  });

  if (!points || points.length === 0 || expectedMarks.length !== 4) {
    return { detectedMarks: null, failed: true, stopped: false };
  }

  let minExpectedDistance = Infinity;

  for (let i = 0; i < expectedMarks.length; i += 1) {
    for (let j = i + 1; j < expectedMarks.length; j += 1) {
      minExpectedDistance = Math.min(minExpectedDistance, distance(expectedMarks[i], expectedMarks[j]));
    }
  }

  // a prediction may never be satisfied by a neighboring mark
  const confirmRadius = Math.min(CONFIRM_RADIUS_PX, minExpectedDistance / 2);

  const found: Point[] = [];
  const refuted = new Set<string>();
  let targetedCount = 0;
  let detectionBroken = false;
  let hypothesisEnabled = true;
  let stopped = false;
  let lastCapture: Point = { x: 0, y: 0 };

  /** Detect blobs in the tile a preview at the requested point stamped, in canvas px */
  const detectTile = async (requestedX: number, requestedY: number): Promise<null | Point[]> => {
    const tile = previewModeController.getRegionPreviewTile(requestedX, requestedY);

    if (!tile) return null;

    const crop = await previewModeBackgroundDrawer.getCanvasCrop(
      tile.centerX - tile.width / 2,
      tile.centerY - tile.height / 2,
      tile.width,
      tile.height,
    );

    if (!crop) return null;

    try {
      const blobPoints = await detectMarkBlobs(crop.blob, crop.ratio);

      if (blobPoints.length > MAX_BLOBS_PER_TILE) return [];

      return blobPoints.map(([x, y]) => ({ x: crop.x + x / crop.ratio, y: crop.y + y / crop.ratio }));
    } catch (error) {
      console.warn('print-and-cut smart sweep: blob detection failed, continuing as a plain sweep', error);
      detectionBroken = true;

      return null;
    }
  };

  /** Merge into `found`, skipping re-detections of the same physical mark; returns the new ones */
  const mergeNewBlobs = (points: Point[]): Point[] => {
    const fresh: Point[] = [];

    for (const point of points) {
      if (found.some((existing) => distance(existing, point) < BLOB_DEDUPE_RADIUS_PX)) continue;

      found.push(point);
      fresh.push(point);
    }

    return fresh;
  };

  /** Whether a mark at this position can be captured with a tile that contains it */
  const isCapturable = (mark: Point): boolean => {
    if (
      mark.x < markRadiusPx ||
      mark.x > workareaWidth - markRadiusPx ||
      mark.y < markRadiusPx ||
      mark.y > workareaHeight - markRadiusPx
    ) {
      return false;
    }

    const tile = previewModeController.getRegionPreviewTile(mark.x, mark.y);

    if (!tile) return false;

    return (
      Math.abs(mark.x - tile.centerX) <= tile.width / 2 - markRadiusPx &&
      Math.abs(mark.y - tile.centerY) <= tile.height / 2 - markRadiusPx
    );
  };

  /** The highest-priority hypothesis consistent with the found blobs that is not yet refuted */
  const selectHypothesis = (): Hypothesis | null => {
    // pair lock: two blobs whose distance matches an expected mark pair fix
    // the assignment (and the rotation) at once
    for (const [i, j] of PAIR_PRIORITY) {
      const expectedDistance = distance(expectedMarks[i], expectedMarks[j]);

      for (let a = 0; a < found.length; a += 1) {
        for (let b = a + 1; b < found.length; b += 1) {
          if (Math.abs(distance(found[a], found[b]) - expectedDistance) > PAIR_DISTANCE_TOLERANCE_PX) continue;

          for (const base of [
            [
              [i, a],
              [j, b],
            ],
            [
              [i, b],
              [j, a],
            ],
          ] as Array<Array<[number, number]>>) {
            const key = hypothesisKey(base);

            if (refuted.has(key)) continue;

            const fit = fitRigidTransform(
              base.map(([expectedIndex]) => expectedMarks[expectedIndex]),
              base.map(([, blobIndex]) => found[blobIndex]),
            );

            if (Math.abs(fit.angle) > MAX_SMART_ANGLE_RAD) continue;

            const assigned = new Set(base.map(([expectedIndex]) => expectedIndex));
            const others = SINGLE_PRIORITY.filter((index) => !assigned.has(index));

            if (!others.every((index) => isCapturable(applyRigidTransform(expectedMarks[index], fit)))) continue;

            return { base, key };
          }
        }
      }
    }

    // single anchor: assume near-0° rotation, so the blob fixes a pure translation
    for (let blobIndex = 0; blobIndex < found.length; blobIndex += 1) {
      for (const expectedIndex of SINGLE_PRIORITY) {
        const base: Array<[number, number]> = [[expectedIndex, blobIndex]];
        const key = hypothesisKey(base);

        if (refuted.has(key)) continue;

        const shift = {
          x: found[blobIndex].x - expectedMarks[expectedIndex].x,
          y: found[blobIndex].y - expectedMarks[expectedIndex].y,
        };
        const others = SINGLE_PRIORITY.filter((index) => index !== expectedIndex);

        if (
          !others.every((index) =>
            isCapturable({ x: expectedMarks[index].x + shift.x, y: expectedMarks[index].y + shift.y }),
          )
        ) {
          continue;
        }

        return { base, key };
      }
    }

    return null;
  };

  const targetedCapture = async (target: Point): Promise<void> => {
    const ok = await previewModeController.preview(target.x, target.y, { overlapRatio: 0 });

    if (!ok) throw new CaptureFailedError();

    targetedCount += 1;
    lastCapture = target;
  };

  /**
   * Confirm the hypothesis by driving the camera to each predicted mark.
   * @returns the 4 mark centers on success; null when refuted, stopped, or out
   * of capture budget
   */
  const confirmHypothesis = async (hypothesis: Hypothesis): Promise<null | Point[]> => {
    const confirmed = new Map<number, Point>(
      hypothesis.base.map(([expectedIndex, blobIndex]) => [expectedIndex, found[blobIndex]]),
    );

    while (confirmed.size < expectedMarks.length) {
      if (stopped) return null;

      reportAlignProgress('locate', { current: confirmed.size, total: expectedMarks.length });

      const unconfirmed = SINGLE_PRIORITY.filter((index) => !confirmed.has(index));
      let predict: (index: number) => Point;
      let radius: number;

      if (confirmed.size >= 2) {
        const indexes = [...confirmed.keys()];
        const fit = fitRigidTransform(
          indexes.map((index) => expectedMarks[index]),
          indexes.map((index) => confirmed.get(index)!),
        );

        predict = (index) => applyRigidTransform(expectedMarks[index], fit);
        radius = REFINED_CONFIRM_RADIUS_PX;
      } else {
        const [expectedIndex, blobIndex] = hypothesis.base[0];
        const shift = {
          x: found[blobIndex].x - expectedMarks[expectedIndex].x,
          y: found[blobIndex].y - expectedMarks[expectedIndex].y,
        };

        predict = (index) => ({ x: expectedMarks[index].x + shift.x, y: expectedMarks[index].y + shift.y });
        radius = confirmRadius;
      }

      const used = new Set(confirmed.values());
      const findNear = (prediction: Point) =>
        found.find((blob) => !used.has(blob) && distance(blob, prediction) <= radius);

      // marks already discovered during the sweep confirm without a capture
      let confirmedFree = false;

      for (const index of unconfirmed) {
        const near = findNear(predict(index));

        if (near) {
          confirmed.set(index, near);
          used.add(near);
          confirmedFree = true;
        }
      }

      // more confirmed marks tighten the fit, so re-predict before capturing
      if (confirmedFree) continue;

      if (targetedCount >= MAX_TARGETED_CAPTURES) {
        hypothesisEnabled = false;

        return null;
      }

      const [nearest] = unconfirmed
        .map((index) => ({ index, prediction: predict(index) }))
        .sort((a, b) => distance(a.prediction, lastCapture) - distance(b.prediction, lastCapture));

      await targetedCapture(nearest.prediction);

      const points = await detectTile(nearest.prediction.x, nearest.prediction.y);

      if (points) mergeNewBlobs(points);

      const near = findNear(nearest.prediction);

      if (!near) {
        refuted.add(hypothesis.key);

        return null;
      }

      confirmed.set(nearest.index, near);
    }

    const fit = fitRigidTransform(
      expectedMarks,
      SINGLE_PRIORITY.map((index) => confirmed.get(index)!),
    );

    if (fit.residual > MATCH_TOLERANCE || Math.abs(fit.angle) > MAX_SMART_ANGLE_RAD) {
      refuted.add(hypothesis.key);

      return null;
    }

    return SINGLE_PRIORITY.map((index) => {
      const { x, y } = confirmed.get(index)!;

      return { x, y };
    });
  };

  requestStop = () => {
    stopped = true;
  };

  const unregisterEsc = shortcuts.on(['Escape'], stopSmartMarkSweep, { isBlocking: true });

  try {
    for (let i = 0; i < points.length; i += 1) {
      if (stopped) break;

      reportAlignProgress('capture', { current: i, total: points.length });

      const { overlapFlag, point } = points[i];
      const ok = await previewModeController.preview(point[0], point[1], {
        overlapFlag,
        overlapRatio: SWEEP_OVERLAP_RATIO,
      });

      if (!ok) return { detectedMarks: null, failed: true, stopped };

      lastCapture = { x: point[0], y: point[1] };

      if (detectionBroken || !hypothesisEnabled) continue;

      const result = await detectTile(point[0], point[1]);

      if (!result || mergeNewBlobs(result).length === 0) continue;

      let hypothesis = selectHypothesis();

      while (hypothesis && hypothesisEnabled && !stopped) {
        const marks = await confirmHypothesis(hypothesis);

        if (marks) return { detectedMarks: marks, failed: false, stopped: false };

        hypothesis = selectHypothesis();
      }
    }

    return { detectedMarks: null, failed: false, stopped };
  } catch (error) {
    if (error instanceof CaptureFailedError) return { detectedMarks: null, failed: true, stopped };

    throw error;
  } finally {
    requestStop = () => {};
    unregisterEsc();
  }
};
