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

/** Where in the stitched image a bed point lands, px. */
export const toCanvasPx = (point: GalvoPoint, originMm: GalvoPoint, pxPerMm = CAPTURE_PX_PER_MM): GalvoPoint => ({
  x: (point.x - originMm.x) * pxPerMm,
  y: (point.y - originMm.y) * pxPerMm,
});
