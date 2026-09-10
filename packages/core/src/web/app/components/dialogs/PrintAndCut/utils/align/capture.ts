import previewModeBackgroundDrawer from '@core/app/actions/beambox/preview-mode-background-drawer';
import previewModeController from '@core/app/actions/beambox/preview-mode-controller';
import workareaManager from '@core/app/svgedit/workarea';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

import type { Point, RigidTransform } from '../rigidTransform';

import { logAlign, logAlignError } from './alignLog';
import { reportAlignProgress } from './alignProgress';
import { detectFromBackground } from './detectMarks';
import { ensurePreviewMode, ensureRegionPreview, supportsRegionPreview } from './previewSession';
import { runSmartMarkSweep } from './smartMarkSweep';

const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');

export interface CaptureResult {
  /** Lowest-residual fit of a failed detection, for the diagnostic readout; null when marks were found or nothing was detected */
  closestFit: null | RigidTransform;
  /** Mark centers in canvas px, ordered like `expectedMarks`; null when they could not be located */
  detectedMarks: null | Point[];
  /** The user stopped the sweep: partial image, not a failure */
  stopped: boolean;
  /** Image of the workarea; only valid until the next capture is drawn */
  url: string;
}

/** Sweep the bed with region previews and locate the marks; null when a capture failed */
const sweepRegion = async (expectedMarks: Point[]): Promise<null | Omit<CaptureResult, 'url'>> => {
  const { modelHeight, width } = workareaManager;
  const canSmartSweep = previewModeController.getRegionPreviewPoints(0, 0, width, modelHeight) !== null;

  // stoppable ⇔ the Stop button works: it only reaches stopSmartMarkSweep;
  // the manager-driven sweeps keep their own ESC stop and report no tiles
  reportAlignProgress('capture', { stoppable: canSmartSweep });

  if (canSmartSweep) {
    try {
      const result = await runSmartMarkSweep(expectedMarks);

      if (result.failed) return null;

      if (result.detectedMarks || result.stopped) {
        logAlign('sweep', { located: Boolean(result.detectedMarks), mode: 'smart', stopped: result.stopped });

        return { closestFit: null, detectedMarks: result.detectedMarks, stopped: result.stopped };
      }
    } catch (error) {
      logAlignError('smart-sweep', error);
      // the fallback sweep is out of the Stop button's reach — hide it
      reportAlignProgress('capture', { stoppable: false });

      if (!(await previewModeController.previewRegion(0, 0, width, modelHeight))) return null;
    }
  } else if (!(await previewModeController.previewRegion(0, 0, width, modelHeight))) {
    return null;
  }

  // a plain sweep (no smart sweep, or one that never locked onto the marks)
  // leaves the whole bed in the background: search it
  reportAlignProgress('detect');

  const { closest, marks } = await detectFromBackground(expectedMarks, 'plain-sweep');

  logAlign('sweep', { located: Boolean(marks), mode: 'plain', stopped: false });

  return { closestFit: marks ? null : closest, detectedMarks: marks, stopped: false };
};

/**
 * Capture the workarea and locate the printed marks on it. Regional machines
 * run the mark-seeking sweep, which stops as soon as all marks are found;
 * full-area machines take one photo and fit the marks in it — when a
 * dual-mode machine's wide-angle photo shows marks that will not fit (lens
 * distortion), it switches to region previews and sweeps up close instead.
 * Preview mode is left running whenever the camera can be driven over points,
 * for the mark refinement that follows. The image stays in the background
 * drawer, where the detection and the refinement read it from.
 * @param expectedMarks designed mark positions [TL, TR, BL, BR] in canvas px
 * @param onProgress called with an intermediate image url each time a capture
 * is drawn, so a sweep can be shown while it runs
 * @returns null when a capture failed
 */
export const captureWorkareaImage = async ({
  expectedMarks,
  onProgress,
}: {
  expectedMarks: Point[];
  onProgress?: (url: string) => void;
}): Promise<CaptureResult | null> => {
  const originalIsPreviewMode = previewModeController.isPreviewMode;
  let keepPreviewMode = false;
  const handleBackgroundUpdated = (url: string) => onProgress?.(url);

  canvasEventEmitter.on('preview-background-updated', handleBackgroundUpdated);

  try {
    previewModeBackgroundDrawer.clear();

    if (!previewModeController.isPreviewMode) reportAlignProgress('preparing');

    // on full-area machines the setup already captures the whole bed — waited
    // for, so the isClean() check below cannot race it into a second capture
    if (!(await ensurePreviewMode())) return null;

    let result: null | Omit<CaptureResult, 'url'>;

    if (previewModeController.isFullArea) {
      // in case the setup's own capture failed
      if (previewModeBackgroundDrawer.isClean() && !(await previewModeController.previewFullWorkarea())) return null;

      reportAlignProgress('detect');

      const { closest, detectedCount, marks } = await detectFromBackground(expectedMarks, 'full-area');

      result = { closestFit: marks ? null : closest, detectedMarks: marks, stopped: false };

      // the wide-angle shot saw marks but could not fit them: sweep up close
      if (!marks && detectedCount > 0 && (await ensureRegionPreview())) {
        logAlign('dual-mode-fallback', { detectedCount });
        previewModeBackgroundDrawer.clear();
        result = await sweepRegion(expectedMarks);
      }
    } else {
      result = await sweepRegion(expectedMarks);
    }

    if (!result) return null;

    const url = await previewModeBackgroundDrawer.getCameraCanvasUrl({ useCache: false });

    if (!url) return null;

    // a stopped capture skips everything that follows, so nothing needs the camera
    keepPreviewMode = !result.stopped && supportsRegionPreview();

    return { ...result, url };
  } catch (error) {
    logAlignError('capture', error);

    return null;
  } finally {
    canvasEventEmitter.removeListener('preview-background-updated', handleBackgroundUpdated);

    // waited for so callers can safely talk to the device (e.g. read exposure
    // settings) right after a failed or non-refinable capture
    if (!keepPreviewMode && !originalIsPreviewMode && previewModeController.isPreviewMode) {
      await previewModeController.end({ shouldWaitForEnd: true });
    }
  }
};
