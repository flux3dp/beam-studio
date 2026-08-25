import previewModeBackgroundDrawer from '@core/app/actions/beambox/preview-mode-background-drawer';
import previewModeController from '@core/app/actions/beambox/preview-mode-controller';
import { PreviewMode } from '@core/app/constants/cameraConstants';
import workareaManager from '@core/app/svgedit/workarea';
import { setupPreviewMode } from '@core/helpers/device/camera/previewMode';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

import { reportAlignProgress } from './alignProgress';
import type { Point } from './rigidTransform';
import { runSmartMarkSweep } from './smartMarkSweep';

const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');

/**
 * Whether the camera can be driven over a point (region previews) — true also
 * for dual-mode machines (fbm2, wide-angle BB2/HEXA II) whose default capture
 * is a one-shot full-area photo
 */
export const supportsRegionPreview = (): boolean =>
  previewModeController.previewManager?.supportedPreviewModes.includes(PreviewMode.REGION) ?? false;

/**
 * Capture a camera image of the whole workarea: select a device, start preview
 * mode and take a one-shot full-area photo, or sweep the bed as a region
 * preview on machines without one. With the expected marks given, a regional
 * machine runs the smart mark-seeking sweep, which stops as soon as all marks
 * are found. Preview mode is left running whenever the machine has region
 * previews — the align step follows immediately and drives the camera to each
 * mark for its refinement retakes, then ends the mode. The captured image stays
 * in the background drawer, where the mark detection reads it from.
 * @param expectedMarks designed mark positions [TL, TR, BL, BR] in canvas px
 * @param onProgress called with an intermediate image url each time a capture
 * is drawn, so a sweep can be shown while it runs; the url is only valid until
 * the next capture is drawn
 * @returns the image url, whether it came from a one-shot full-area capture,
 * the smart-sweep mark centers (null unless the smart sweep found them), and
 * whether the user stopped the sweep (partial image, not a failure);
 * null when the capture failed
 */
export const captureWorkareaImage = async ({
  expectedMarks,
  onProgress,
}: {
  expectedMarks?: Point[];
  onProgress?: (url: string) => void;
} = {}): Promise<null | { detectedMarks: null | Point[]; isFullArea: boolean; stopped: boolean; url: string }> => {
  const originalIsPreviewMode = previewModeController.isPreviewMode;
  let keepPreviewMode = false;
  const handleBackgroundUpdated = (url: string) => onProgress?.(url);

  canvasEventEmitter.on('preview-background-updated', handleBackgroundUpdated);

  try {
    previewModeBackgroundDrawer.clear();

    // on full-area machines this already captures the whole bed — waited for,
    // so the isClean() check below cannot race it into starting a second
    // concurrent capture on the same camera
    if (!previewModeController.isPreviewMode) {
      reportAlignProgress('preparing');
      await setupPreviewMode({ waitForFullAreaCapture: true });
    }

    if (!previewModeController.isPreviewMode) return null;

    const isFullArea = previewModeController.isFullArea;
    // camera space is the machine bed (0,0)-(width, modelHeight); a workarea
    // expansion is canvas-only territory the camera cannot cover
    const { modelHeight, width } = workareaManager;
    let detectedMarks: null | Point[] = null;
    let stopped = false;

    // stoppable ⇔ the Stop button works: it only reaches stopSmartMarkSweep;
    // the manager-driven sweeps keep their own ESC stop and report no tiles
    const canSmartSweep =
      !isFullArea &&
      expectedMarks?.length === 4 &&
      previewModeController.getRegionPreviewPoints(0, 0, width, modelHeight) !== null;

    reportAlignProgress('capture', { stoppable: canSmartSweep });

    if (!isFullArea) {
      if (canSmartSweep) {
        try {
          const result = await runSmartMarkSweep(expectedMarks!);

          if (result.failed) return null;

          detectedMarks = result.detectedMarks;
          stopped = result.stopped;
        } catch (error) {
          console.warn('Smart mark sweep failed, falling back to a full region preview', error);

          // the fallback sweep is out of the Stop button's reach — hide it
          reportAlignProgress('capture', { stoppable: false });

          if (!(await previewModeController.previewRegion(0, 0, width, modelHeight))) return null;
        }
      } else if (!(await previewModeController.previewRegion(0, 0, width, modelHeight))) {
        return null;
      }
    } else if (previewModeBackgroundDrawer.isClean()) {
      // In case setupPreviewMode previewFullWorkarea failed
      if (!(await previewModeController.previewFullWorkarea())) return null;
    }

    const url = await previewModeBackgroundDrawer.getCameraCanvasUrl({ useCache: false });

    if (!url) return null;

    // left running for the align step's refinement retakes; a stopped capture
    // skips detection entirely, so nothing follows that needs the camera
    keepPreviewMode = !stopped && (!isFullArea || supportsRegionPreview());

    return { detectedMarks, isFullArea, stopped, url };
  } catch (error) {
    console.error('Failed to capture camera preview for print and cut', error);

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
