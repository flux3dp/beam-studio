import previewModeBackgroundDrawer from '@core/app/actions/beambox/preview-mode-background-drawer';
import previewModeController from '@core/app/actions/beambox/preview-mode-controller';
import workareaManager from '@core/app/svgedit/workarea';

import { REFINE_PATCH_SIZE_PX } from '../../constants';
import type { Point } from '../rigidTransform';

import { reportAlignProgress } from './alignProgress';
import { ensureRegionPreview } from './previewSession';

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
 * corners are again imprecise) is rolled back. Machines whose camera cannot be
 * driven over the marks skip the refinement.
 * @param onPatchDrawn called with the background url after each mark's patch
 * @returns whether at least one mark patch was refreshed
 */
export const refineMarkPatches = async (
  markCenters: Point[],
  onPatchDrawn?: (url: string) => void,
): Promise<boolean> => {
  try {
    if (!(await ensureRegionPreview())) return false;

    const { modelHeight, width } = workareaManager;
    let refinedAny = false;

    for (const [index, { x, y }] of markCenters.entries()) {
      reportAlignProgress('refine', { current: index, total: markCenters.length });

      // snapshot the accumulated background (including previously refined
      // patches) before the retake stamps a whole tile onto it
      const baseImage = await loadImage(await previewModeBackgroundDrawer.getCameraCanvasUrl({ useCache: false }));

      if (!(await previewModeController.preview(x, y, { silent: true }))) continue;

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
