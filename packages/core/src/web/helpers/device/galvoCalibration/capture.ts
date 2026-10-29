import constant from '@core/app/actions/beambox/constant';
import previewModeController from '@core/app/actions/beambox/preview-mode-controller';
import {
  endPreviewMode,
  ensureRegionPreview,
} from '@core/app/components/dialogs/PrintAndCut/utils/align/previewSession';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';

import type { GalvoPoint } from '../galvoExec';
import { ensureGalvoHeadDisconnected } from '../galvoLaserMode';

import type { CapturedCoupon } from './captureGrid';
import {
  CAPTURE_HALF_SPAN_MM,
  CAPTURE_PX_PER_MM,
  capturePoints,
  PATCH_MM,
  patchSource,
  toCanvasPx,
} from './captureGrid';

/**
 * Photograph the coupon and its L frame with the laser head camera, tile by tile, into one image
 * in bed mm.
 *
 * The camera resolves only 5 to 7 px/mm and its perspective correction is best at the middle of
 * the frame (refineMarkPatches in Print and Cut found the same), so rather than one wide shot the
 * head is driven over a grid of points and only the middle of each photo is kept. fluxghost is
 * asked for the frame at CAPTURE_PX_PER_MM so that none of the native resolution is thrown away
 * on the way (its default remap is 5 px/mm). Whether the result is good enough is not decided
 * here: the solver's L-frame self-check says so.
 */

export type { CapturedCoupon } from './captureGrid';

/** Beyond this the patch comes from the photo's periphery; said on screen, not refused. */
const OFF_CENTRE_WARN_MM = 5;

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to decode the camera frame'));
    img.src = url;
  });

export const captureCoupon = async ({
  center,
  isCancelled,
  model,
  onProgress,
  onStep,
  onWarning,
}: {
  center: GalvoPoint;
  /** Polled between photos; the one in progress finishes first. */
  isCancelled?: () => boolean;
  model: WorkAreaModel;
  onProgress?: (done: number, total: number) => void;
  onStep?: (step: string) => void;
  /** Tiles the camera could not centre on, or reach at all; the capture carries on without. */
  onWarning?: (message: string) => void;
}): Promise<CapturedCoupon | null> => {
  await ensureGalvoHeadDisconnected(model, { onSlow: () => onStep?.('Parking the galvo head') });

  onStep?.('Starting the camera');

  if (!(await ensureRegionPreview())) throw new Error('The camera cannot be driven over the coupon on this machine');

  const manager = previewModeController.previewManager;

  if (!manager?.getPreviewPosition || !manager.getPhotoAfterMoveTo) {
    throw new Error('This camera has no region preview');
  }

  const points = capturePoints(center);
  const sideMm = 2 * CAPTURE_HALF_SPAN_MM;
  const originMm = { x: center.x - CAPTURE_HALF_SPAN_MM, y: center.y - CAPTURE_HALF_SPAN_MM };
  const canvas = document.createElement('canvas');

  canvas.width = sideMm * CAPTURE_PX_PER_MM;
  canvas.height = sideMm * CAPTURE_PX_PER_MM;

  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Failed to get canvas context');

  try {
    for (const [i, point] of points.entries()) {
      if (isCancelled?.()) return null;

      onProgress?.(i, points.length);

      // getPreviewPosition speaks canvas px and clamps the camera into the travel; how far it
      // had to clamp is how far the photo's centre is from where it was wanted.
      const px = { x: point.x * constant.dpmm, y: point.y * constant.dpmm };
      const wanted = manager.getPreviewPosition(px.x, px.y, { clipByWorkArea: false });
      const cameraPosition = manager.getPreviewPosition(px.x, px.y);
      const shift = { x: cameraPosition.x - wanted.x, y: cameraPosition.y - wanted.y };
      const tile = `Tile ${i + 1}/${points.length} at (${point.x}, ${point.y})`;
      const url = await manager.getPhotoAfterMoveTo(cameraPosition.x, cameraPosition.y, { dpmm: CAPTURE_PX_PER_MM });

      if (!url) throw new Error(`${tile} could not be photographed`);

      try {
        const img = await loadImage(url);
        // The frame is centred on where the camera landed, point + shift; the patch stays centred
        // on the tile, so it is cut from the photo -shift away from the middle, and clipped to the
        // photo when the camera had to stop short. A tile the photo does not reach at all is left
        // blank, and the solver's self-check decides whether that mattered.
        const rect = patchSource(shift, img);

        if (!rect) {
          onWarning?.(`${tile} is out of the camera's reach and was left blank`);
          continue;
        }

        if (rect.offCentreMm > OFF_CENTRE_WARN_MM) {
          onWarning?.(`${tile} was photographed ${rect.offCentreMm.toFixed(1)} mm off centre`);
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

  return {
    blob,
    heightPx: canvas.height,
    originMm,
    pxPerMm: CAPTURE_PX_PER_MM,
    url: URL.createObjectURL(blob),
    widthPx: canvas.width,
  };
};
