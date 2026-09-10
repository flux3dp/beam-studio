import previewModeController from '@core/app/actions/beambox/preview-mode-controller';
import { PreviewMode } from '@core/app/constants/cameraConstants';
import { setupPreviewMode } from '@core/helpers/device/camera/previewMode';

/**
 * Whether the camera can be driven over a point (region previews) — true also
 * for dual-mode machines (fbm2, wide-angle BB2/HEXA II) whose default capture
 * is a one-shot full-area photo
 */
export const supportsRegionPreview = (): boolean =>
  previewModeController.previewManager?.supportedPreviewModes.includes(PreviewMode.REGION) ?? false;

/**
 * Start preview mode when it is not running. Waited for, so a full-area
 * machine's setup capture is finished (not raced) when this returns.
 * @returns whether preview mode is running
 */
export const ensurePreviewMode = async (): Promise<boolean> => {
  // a manual re-run re-enters silently: the device is already selected
  if (!previewModeController.isPreviewMode) await setupPreviewMode({ waitForFullAreaCapture: true });

  return previewModeController.isPreviewMode;
};

/**
 * Make sure the camera can be driven over points: start preview mode when
 * needed and switch a dual-mode machine out of its one-shot FULL_AREA mode.
 * @returns false when the machine has no region previews or the switch failed
 */
export const ensureRegionPreview = async (): Promise<boolean> => {
  if (!(await ensurePreviewMode())) return false;

  if (!previewModeController.isFullArea) return true;

  if (!supportsRegionPreview()) return false;

  await previewModeController.switchPreviewMode(PreviewMode.REGION);

  // the switch can be refused or fail (e.g. its camera setup errored out and ended preview mode)
  return previewModeController.isPreviewMode && !previewModeController.isFullArea;
};

/** End preview mode, waited for so the caller can talk to the device right after */
export const endPreviewMode = async (): Promise<void> => {
  if (previewModeController.isPreviewMode) await previewModeController.end({ shouldWaitForEnd: true });
};
