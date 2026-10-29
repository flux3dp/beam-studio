import previewModeController from '@core/app/actions/beambox/preview-mode-controller';
import {
  endPreviewMode,
  ensureRegionPreview,
} from '@core/app/components/dialogs/PrintAndCut/utils/align/previewSession';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import getOpenCV from '@core/helpers/api/open-cv';

import type { GalvoPoint } from '../galvoExec';
import { ensureGalvoHeadDisconnected } from '../galvoLaserMode';
import { getGantryTravelRange } from '../gantryTravelRange';

import type { CapturedCoupon, PatchRect, TilePlan } from './captureGrid';
import {
  CAPTURE_AIM_INSET_MM,
  CAPTURE_HALF_SPAN_MM,
  CAPTURE_PX_PER_MM,
  capturePoints,
  expectedPhotoSize,
  PATCH_MM,
  patchSource,
  planTile,
  toCanvasPx,
} from './captureGrid';

/**
 * Photograph the coupon and its L frame with the laser head camera, tile by tile, into one image
 * in bed mm.
 *
 * The camera resolves only 5 to 7 px/mm and its perspective correction is best on the side of
 * the frame nearest the head (refineMarkPatches in Print and Cut found the same about the
 * middle of a straight-down frame), so rather than one wide shot the head is driven over a grid
 * of points and only a patch around the aim point of each photo is kept. fluxghost is asked for
 * the frame at CAPTURE_PX_PER_MM so that none of the native resolution is thrown away on the
 * way (its default remap is 5 px/mm). Whether the result is good enough is not decided here:
 * the solver's L-frame self-check says so.
 */

export type { CapturedCoupon } from './captureGrid';

/** Beyond this the patch comes from a different part of the frame than planned; said on screen, not refused. */
const OFF_CENTRE_WARN_MM = 5;
/** A frame the size the grid and the px/mm predict, give or take rounding. */
const PHOTO_SIZE_TOLERANCE_PX = 2;

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to decode the camera frame'));
    img.src = url;
  });

export const captureCoupon = async ({
  aimInsetMm = CAPTURE_AIM_INSET_MM,
  center,
  isCancelled,
  model,
  onProgress,
  onStep,
  onWarning,
}: {
  /** Where in the frame each tile is aimed, mm in from the grid's head-side edge. */
  aimInsetMm?: number;
  center: GalvoPoint;
  /** Polled between photos; the one in progress finishes first. */
  isCancelled?: () => boolean;
  model: WorkAreaModel;
  onProgress?: (done: number, total: number) => void;
  onStep?: (step: string) => void;
  /** Tiles the camera could not aim at, or reach at all; the capture carries on without. */
  onWarning?: (message: string) => void;
}): Promise<CapturedCoupon | null> => {
  await ensureGalvoHeadDisconnected(model, { onSlow: () => onStep?.('Parking the galvo head') });

  onStep?.('Starting the camera');

  if (!(await ensureRegionPreview())) throw new Error('The camera cannot be driven over the coupon on this machine');

  const manager = previewModeController.previewManager;
  const grid = manager?.getRegionPreviewGrid?.();

  if (!grid || !manager?.getPhotoAfterMoveTo) {
    throw new Error('This camera has no region preview');
  }

  const travel = getGantryTravelRange(model);
  const expected = expectedPhotoSize(grid);
  const points = capturePoints(center);
  const sideMm = 2 * CAPTURE_HALF_SPAN_MM;
  const originMm = { x: center.x - CAPTURE_HALF_SPAN_MM, y: center.y - CAPTURE_HALF_SPAN_MM };
  const canvas = document.createElement('canvas');

  canvas.width = sideMm * CAPTURE_PX_PER_MM;
  canvas.height = sideMm * CAPTURE_PX_PER_MM;

  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Failed to get canvas context');

  // What went into the stitch, for the record fluxghost keeps next to the frames (frame_dump.py):
  // `frame` is the photo's number in that record, 1-based in the order they were taken.
  const record: Array<TilePlan & { frame: number; point: GalvoPoint; rect: null | PatchRect }> = [];
  const warnings: string[] = [];
  const warn = (message: string) => {
    warnings.push(message);
    onWarning?.(message);
  };

  try {
    for (const [i, point] of points.entries()) {
      if (isCancelled?.()) return null;

      onProgress?.(i, points.length);

      // The gantry goes where the aim point of the frame lands on the tile, held to its travel
      // only; how far it had to stop short is how far the tile sits from the aim point in the
      // photo. The photo is the remap of the grid at CAPTURE_PX_PER_MM, so the aim point's
      // pixel is known before the photo is.
      const { anchor, camera, shift } = planTile(point, grid, travel, { aimInsetMm });
      const tile = `Tile ${i + 1}/${points.length} at (${point.x}, ${point.y})`;

      console.log(`Galvo calibration: ${tile}: gantry to (${camera.x}, ${camera.y}), shift (${shift.x}, ${shift.y})`);

      const url = await manager.getPhotoAfterMoveTo(camera.x, camera.y, { dpmm: CAPTURE_PX_PER_MM });

      if (!url) throw new Error(`${tile} could not be photographed`);

      try {
        const img = await loadImage(url);

        if (
          Math.abs(img.width - expected.width) > PHOTO_SIZE_TOLERANCE_PX ||
          Math.abs(img.height - expected.height) > PHOTO_SIZE_TOLERANCE_PX
        ) {
          throw new Error(
            `${tile} came back ${img.width}×${img.height} px, not the ${expected.width}×${expected.height} that the ` +
              `${grid.x[1] - grid.x[0]}×${grid.y[1] - grid.y[0]} mm grid at ${CAPTURE_PX_PER_MM} px/mm gives. ` +
              'The frame was not remapped at that resolution: FLUXGhost is too old for require_frame d<dpmm>.',
          );
        }

        // A tile the photo does not reach at all is left blank, and the solver's self-check
        // decides whether that mattered.
        const rect = patchSource(shift, img, { anchor });

        record.push({ anchor, camera, frame: i + 1, point, rect, shift });

        if (!rect) {
          warn(`${tile} is out of the camera's reach and was left blank`);
          continue;
        }

        if (rect.offCentreMm > OFF_CENTRE_WARN_MM) {
          warn(`${tile} was photographed ${rect.offCentreMm.toFixed(1)} mm off the aim point`);
        }

        const dest = toCanvasPx({ x: point.x - PATCH_MM / 2, y: point.y - PATCH_MM / 2 }, originMm);

        ctx.drawImage(img, rect.sx, rect.sy, rect.sw, rect.sh, dest.x + rect.dx, dest.y + rect.dy, rect.sw, rect.sh);
      } finally {
        URL.revokeObjectURL(url);
      }
    }

    onProgress?.(points.length, points.length);
  } finally {
    await endPreviewMode().catch((error) => console.warn('Galvo calibration: ending preview failed', error));
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));

  if (!blob) throw new Error('Failed to encode the stitched image');

  // Best effort: the record is for looking at a failed solve, and a fluxghost without the
  // command, or one told not to keep frames, must not cost the capture.
  let savedTo: string | undefined;

  try {
    onStep?.('Saving the capture record');

    const meta = {
      aimInsetMm,
      center,
      grid,
      originMm,
      patchMm: PATCH_MM,
      pxPerMm: CAPTURE_PX_PER_MM,
      tiles: record,
      warnings,
    };
    const { folder } = await getOpenCV().saveGalvoCapture(blob, meta);

    savedTo = folder || undefined;
  } catch (error) {
    console.warn('Galvo calibration: the capture record was not saved', error);
  }

  return {
    blob,
    heightPx: canvas.height,
    originMm,
    pxPerMm: CAPTURE_PX_PER_MM,
    savedTo,
    url: URL.createObjectURL(blob),
    widthPx: canvas.width,
  };
};
