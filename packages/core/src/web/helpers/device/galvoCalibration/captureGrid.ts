import type { GalvoPoint } from '../galvoExec';

/**
 * The geometry of the stitched coupon photograph, kept apart from the capture itself so the
 * solver's parameters and the tests need nothing from the camera.
 */

/** Resolution of the stitched image and of each frame asked of fluxghost. */
export const CAPTURE_PX_PER_MM = 20;
/** Distance between photo centres, mm. */
export const CAPTURE_PITCH_MM = 40;
/** Side of the square kept out of the middle of each photo; 50 on a 40 pitch overlaps 5 each way. */
export const PATCH_MM = 50;
/** Half the side of the stitched image, mm around the lens centre: covers the ±70 L frame. */
export const CAPTURE_HALF_SPAN_MM = 90;

export interface CapturedCoupon {
  blob: Blob;
  heightPx: number;
  /** Bed mm at the image's top-left pixel. */
  originMm: GalvoPoint;
  pxPerMm: number;
  /** Object URL of `blob`, for showing it; the owner revokes it. */
  url: string;
  widthPx: number;
}

/**
 * Photo centres whose patches cover center ± CAPTURE_HALF_SPAN_MM, on the pitch and symmetric
 * about the centre; rows top to bottom, boustrophedon.
 */
export const capturePoints = (center: GalvoPoint): GalvoPoint[] => {
  const perSide = Math.ceil((CAPTURE_HALF_SPAN_MM - PATCH_MM / 2) / CAPTURE_PITCH_MM);
  const axis = Array.from({ length: 2 * perSide + 1 }, (_, i) => (i - perSide) * CAPTURE_PITCH_MM);

  return axis.flatMap((dy, row) =>
    (row % 2 === 0 ? axis : [...axis].reverse()).map((dx) => ({ x: center.x + dx, y: center.y + dy })),
  );
};

export interface PatchRect {
  /** Where in the stitched image the kept part lands, px from the patch's top-left. */
  dx: number;
  dy: number;
  /** How far the patch's centre sits from the photo's, mm; what the caller may want to report. */
  offCentreMm: number;
  /** The part of the photo to keep, px. */
  sh: number;
  sw: number;
  sx: number;
  sy: number;
}

/**
 * The square of the photo to keep for a tile whose centre the camera could not be put on:
 * the camera landed `shift` mm away (photo centre = tile centre + shift), so the tile centre
 * sits `-shift` from the middle of the photo and the patch is cut around it there. A patch
 * that runs past the photo's edge is clipped to what the photo has; null when none of it is in
 * the photo. The patch is then more distorted than one from the middle, which is accepted so
 * that a tile near the edge of the bed is photographed rather than refused (PRD §11 decision 18).
 */
export const patchSource = (
  shift: GalvoPoint,
  photo: { height: number; width: number },
  pxPerMm = CAPTURE_PX_PER_MM,
  patchMm = PATCH_MM,
): null | PatchRect => {
  const patchPx = patchMm * pxPerMm;
  const left = photo.width / 2 - shift.x * pxPerMm - patchPx / 2;
  const top = photo.height / 2 - shift.y * pxPerMm - patchPx / 2;
  const sx = Math.max(0, left);
  const sy = Math.max(0, top);
  const sw = Math.min(photo.width, left + patchPx) - sx;
  const sh = Math.min(photo.height, top + patchPx) - sy;

  if (sw <= 0 || sh <= 0) return null;

  return { dx: sx - left, dy: sy - top, offCentreMm: Math.hypot(shift.x, shift.y), sh, sw, sx, sy };
};

/** Where in the stitched image a bed point lands, px. */
export const toCanvasPx = (point: GalvoPoint, originMm: GalvoPoint, pxPerMm = CAPTURE_PX_PER_MM): GalvoPoint => ({
  x: (point.x - originMm.x) * pxPerMm,
  y: (point.y - originMm.y) * pxPerMm,
});
