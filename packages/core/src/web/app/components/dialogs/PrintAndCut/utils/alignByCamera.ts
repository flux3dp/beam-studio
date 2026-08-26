import alertCaller from '@core/app/actions/alert-caller';
import { dpmm } from '@core/app/actions/beambox/constant';
import previewModeBackgroundDrawer from '@core/app/actions/beambox/preview-mode-background-drawer';
import previewModeController from '@core/app/actions/beambox/preview-mode-controller';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import { PreviewMode } from '@core/app/constants/cameraConstants';
import workareaManager from '@core/app/svgedit/workarea';
import { setupPreviewMode } from '@core/helpers/device/camera/previewMode';
import i18n from '@core/helpers/i18n';

import { MATCH_TOLERANCE, REFINE_PATCH_SIZE_PX } from '../constants';
import { usePrintAndCutStore } from '../store';

import { reportAlignProgress } from './alignProgress';
import { supportsRegionPreview } from './captureWorkareaImage';
import { detectMarkBlobs } from './detectMarkBlobs';
import type { Point, RigidTransform } from './rigidTransform';
import { centroid, fitRigidTransform } from './rigidTransform';

/** More detected blobs than this means the detection is too noisy to search */
const MAX_DETECTED_MARKS = 20;

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

/**
 * Correspondence-free registration: the sheet can be placed anywhere at any
 * small rotation, so every assignment of detected blobs to the expected marks
 * is tried and scored by its best-fit rigid transform. The mark rectangle is
 * 180°-symmetric, so among well-fitting assignments the smallest rotation wins
 * — the sheet is assumed to be placed roughly in its printed orientation.
 */
const findAlignment = (expected: Point[], detected: Point[]): null | RigidTransform => {
  if (detected.length < expected.length || detected.length > MAX_DETECTED_MARKS) return null;

  const expectedOrders = permutations([...expected.keys()]);
  let best: null | RigidTransform = null;

  for (const combo of combinations(detected.length, expected.length)) {
    const detectedPoints = combo.map((index) => detected[index]);

    for (const order of expectedOrders) {
      const fit = fitRigidTransform(
        order.map((index) => expected[index]),
        detectedPoints,
      );

      if (fit.residual > MATCH_TOLERANCE) continue;

      if (
        !best ||
        Math.abs(fit.angle) < Math.abs(best.angle) ||
        (Math.abs(fit.angle) === Math.abs(best.angle) && fit.residual < best.residual)
      ) {
        best = fit;
      }
    }
  }

  return best;
};

/** Detect blobs in the current preview background and fit the rigid transform */
const detectFromBackground = async (expected: Point[]): Promise<{ transform: null | RigidTransform; url: string }> => {
  const url = await previewModeBackgroundDrawer.getCameraCanvasUrl({ useCache: false });
  const response = await fetch(url);
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);
  const ratio = bitmap.width / workareaManager.width;

  bitmap.close();

  const points = await detectMarkBlobs(blob, ratio);
  const detected: Point[] = points.map(([x, y]) => ({ x: x / ratio, y: y / ratio }));
  const transform = findAlignment(expected, detected);

  return { transform, url };
};

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });

/**
 * Retake each detected mark with the camera centered on it: region-preview
 * tiles are most accurate at their center, so marks that landed near a tile
 * corner in the sweep are re-captured at center precision. Only a 2×-mark-size
 * patch around each mark is kept from the retake — the rest of the tile (whose
 * corners are again imprecise) is rolled back.
 * @param onPatchDrawn called with the background url after each mark's patch is
 * pasted — never with the intermediate whole-tile stamp
 * @returns whether at least one mark patch was refreshed
 */
const refineMarkPatches = async (markCenters: Point[], onPatchDrawn?: (url: string) => void): Promise<boolean> => {
  try {
    // a refinable capture leaves preview mode running; a manual align re-run
    // re-enters it silently (the device is already selected)
    if (!previewModeController.isPreviewMode) await setupPreviewMode({ waitForFullAreaCapture: true });

    if (!previewModeController.isPreviewMode) return false;

    // a one-shot capture on a dual-mode machine (fbm2, wide-angle BB2/HEXA II)
    // is still refinable: switch to region mode so the camera can be driven
    // over each mark. Machines without region previews cannot refine.
    if (previewModeController.isFullArea) {
      if (!supportsRegionPreview()) return false;

      await previewModeController.switchPreviewMode(PreviewMode.REGION);

      // the switch can be refused or fail (e.g. its camera setup errored out
      // and ended preview mode)
      if (!previewModeController.isPreviewMode || previewModeController.isFullArea) return false;
    }

    const { modelHeight, width } = workareaManager;
    let refinedAny = false;

    for (const [index, { x, y }] of markCenters.entries()) {
      reportAlignProgress('refine', { current: index, total: markCenters.length });

      // snapshot the accumulated background (including previously refined
      // patches) before the retake stamps a whole tile onto it
      const baseImage = await loadImage(await previewModeBackgroundDrawer.getCameraCanvasUrl({ useCache: false }));

      if (!(await previewModeController.preview(x, y))) continue;

      // restore the snapshot everywhere except the patch around this mark:
      // transparent pixels leave the fresh tile visible only inside the hole
      const mask = document.createElement('canvas');

      mask.width = width;
      mask.height = modelHeight;

      const ctx = mask.getContext('2d')!;

      ctx.drawImage(baseImage, 0, 0, width, modelHeight);
      ctx.clearRect(
        x - REFINE_PATCH_SIZE_PX / 2,
        y - REFINE_PATCH_SIZE_PX / 2,
        REFINE_PATCH_SIZE_PX,
        REFINE_PATCH_SIZE_PX,
      );
      await previewModeBackgroundDrawer.drawImageToCanvas(mask, width / 2, modelHeight / 2);
      refinedAny = true;
      onPatchDrawn?.(await previewModeBackgroundDrawer.getCameraCanvasUrl({ useCache: false }));
    }

    return refinedAny;
  } catch (error) {
    console.warn('Failed to refine print and cut mark patches', error);

    return false;
  }
};

/** Log the fitted alignment for debugging; the user only sees a success message */
const logAlignmentResult = (expected: Point[], transform: RigidTransform): void => {
  const { angle, residual, tx, ty } = transform;
  // mean mark displacement: R·centroid(expected) + t − centroid(expected)
  const c = centroid(expected);
  const dx = Math.cos(angle) * c.x - Math.sin(angle) * c.y + tx - c.x;
  const dy = Math.sin(angle) * c.x + Math.cos(angle) * c.y + ty - c.y;

  console.log('print-and-cut align', {
    movedXMm: Number((dx / dpmm).toFixed(2)),
    movedYMm: Number((dy / dpmm).toFixed(2)),
    residualMm: Number((residual / dpmm).toFixed(3)),
    rotationDeg: Number(((angle * 180) / Math.PI).toFixed(3)),
  });
};

/**
 * Detect where the printed marks sit on the captured sheet, refine each with a
 * mark-centered retake, and fit the rigid transform mapping the designed mark
 * positions onto the detected ones. Handles arbitrary placement (shift +
 * rotation); the sheet is assumed to be face up in roughly its printed
 * orientation (the mark rectangle cannot distinguish a 180° flip). Ends preview
 * mode. Nothing on the canvas is modified — the caller applies the transform.
 * @returns the fitted transform, or null when the detection failed
 */
export const detectAlignmentTransform = async ({
  detectedMarks,
  onPreviewUpdate,
}: {
  /** Mark centers the smart sweep already located, ordered like the designed marks */
  detectedMarks?: null | Point[];
  onPreviewUpdate?: (url: string) => void;
}): Promise<null | RigidTransform> => {
  const t = i18n.lang.print_and_cut.alignment;
  const { markPositions } = usePrintAndCutStore.getState();
  const expected: Point[] = markPositions.map(({ cx, cy }) => ({ x: cx, y: cy }));

  if (expected.length === 0) return null;

  if (previewModeBackgroundDrawer.isClean()) {
    alertCaller.popUpError({ message: t.no_preview });

    return null;
  }

  try {
    let transform: null | RigidTransform = null;
    let markCenters: null | Point[] = detectedMarks?.length === expected.length ? detectedMarks : null;

    if (!markCenters) {
      reportAlignProgress('detect');
      ({ transform } = await detectFromBackground(expected));

      if (transform) {
        const { angle, tx, ty } = transform;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        markCenters = expected.map(({ x, y }) => ({ x: cos * x - sin * y + tx, y: sin * x + cos * y + ty }));
      }
    }

    // refineMarkPatches itself skips machines whose camera cannot be driven
    // over the marks; when it did retake them, redetect on the patched image.
    if (markCenters && (await refineMarkPatches(markCenters, onPreviewUpdate))) {
      // reported after `refine` so the tail phases stay in ascending order
      reportAlignProgress('completing');

      const refined = await detectFromBackground(expected);

      if (refined.transform) transform = refined.transform;
      else console.warn('print-and-cut align: refined detection failed, falling back to the coarse fit');

      onPreviewUpdate?.(refined.url);
    }

    // smart-sweep fallback: when the refinement could not run or redetect, fit
    // the sweep's marks directly
    if (!transform && markCenters) transform = fitRigidTransform(expected, markCenters);

    if (!transform) {
      alertCaller.popUpError({ message: t.detect_failed });

      return null;
    }

    logAlignmentResult(expected, transform);
    MessageCaller.openMessage({ content: t.success, duration: 3, level: MessageLevel.SUCCESS });

    return transform;
  } catch (error) {
    console.error('Failed to detect print and cut alignment', error);
    alertCaller.popUpError({ message: t.detect_failed });

    return null;
  } finally {
    // alignment is the end of the camera flow, so close the mode here (covers
    // early failure returns too). Waited for so the caller only resumes device
    // access (e.g. reading exposure settings) once teardown has fully finished
    if (previewModeController.isPreviewMode) await previewModeController.end({ shouldWaitForEnd: true });
  }
};
