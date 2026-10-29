import type { PerspectiveGrid } from '@core/interfaces/FisheyePreview';

import type { GalvoPoint } from '../galvoExec';

/**
 * The geometry of the stitched coupon photograph, kept apart from the capture itself so the
 * solver's parameters and the tests need nothing from the camera.
 */

/** Resolution of the stitched image and of each frame asked of fluxghost. */
export const CAPTURE_PX_PER_MM = 20;
/** Distance between photo centres, mm. */
export const CAPTURE_PITCH_MM = 40;
/** Side of the square kept out of each photo; 50 on a 40 pitch overlaps 5 each way. */
export const PATCH_MM = 50;
/** Half the side of the stitched image, mm around the lens centre: covers the ±70 L frame. */
export const CAPTURE_HALF_SPAN_MM = 90;
/**
 * Where in the frame a tile is aimed: this far, in mm, from the edge of the region preview grid
 * that is nearest the nozzle. The HEXA II head camera looks obliquely at the bed to the left of
 * the nozzle (hx2GalvoPerspectiveGridWide spans x −260..0 of the head), and the frame is best
 * resolved and best corrected on the side nearest the head; the far side is the most oblique
 * view and the first to lose the thin L grooves. 60 keeps a 50 mm patch (±25) inside the
 * calibrated region, which hx2GalvoPnPPoints end at x = −20.
 */
export const CAPTURE_AIM_INSET_MM = 60;

export interface CapturedCoupon {
  blob: Blob;
  heightPx: number;
  /** Bed mm at the image's top-left pixel. */
  originMm: GalvoPoint;
  pxPerMm: number;
  /** The folder on the fluxghost computer holding the frames, patches and this image, if kept. */
  savedTo?: string;
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

/** The point of the grid, mm from the head, that is put on a tile's centre. */
export const captureAim = (grid: PerspectiveGrid, insetMm = CAPTURE_AIM_INSET_MM): GalvoPoint => ({
  x: grid.x[1] - insetMm,
  y: (grid.y[0] + grid.y[1]) / 2,
});

/** The size fluxghost's remap of the grid comes back at: grid span × px/mm, no padding (v3). */
export const expectedPhotoSize = (
  grid: PerspectiveGrid,
  pxPerMm = CAPTURE_PX_PER_MM,
): { height: number; width: number } => ({
  height: (grid.y[1] - grid.y[0]) * pxPerMm,
  width: (grid.x[1] - grid.x[0]) * pxPerMm,
});

export interface TravelRange {
  maxX: number;
  maxY: number;
  minX: number;
  minY: number;
}

export interface TilePlan {
  /** Where in the photo the tile's centre lands when the gantry got where it was sent, px. */
  anchor: GalvoPoint;
  /** Where the gantry is sent, bed mm. */
  camera: GalvoPoint;
  /** How far the gantry stopped short of where it was wanted, mm; the tile is -shift from anchor. */
  shift: GalvoPoint;
}

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

/**
 * Where to send the gantry so that the aim point of the frame lands on the tile, and where in the
 * photo to look for the tile afterwards. The gantry is held to its travel and nothing else: the
 * preview's own rule of keeping the whole frame on the bed would push the camera 130 mm right of
 * every tile in the left half of the field and hand their patches to the far, oblique side of the
 * frame (PRD §11 decision 19).
 */
export const planTile = (
  point: GalvoPoint,
  grid: PerspectiveGrid,
  travel: TravelRange,
  { aimInsetMm = CAPTURE_AIM_INSET_MM, pxPerMm = CAPTURE_PX_PER_MM }: { aimInsetMm?: number; pxPerMm?: number } = {},
): TilePlan => {
  const aim = captureAim(grid, aimInsetMm);
  const wanted = { x: point.x - aim.x, y: point.y - aim.y };
  const camera = { x: clamp(wanted.x, travel.minX, travel.maxX), y: clamp(wanted.y, travel.minY, travel.maxY) };

  return {
    anchor: { x: (aim.x - grid.x[0]) * pxPerMm, y: (aim.y - grid.y[0]) * pxPerMm },
    camera,
    shift: { x: camera.x - wanted.x, y: camera.y - wanted.y },
  };
};

export interface PatchRect {
  /** Where in the stitched image the kept part lands, px from the patch's top-left. */
  dx: number;
  dy: number;
  /** How far the patch's centre sits from the aim point, mm; what the caller may want to report. */
  offCentreMm: number;
  /** The part of the photo to keep, px. */
  sh: number;
  sw: number;
  sx: number;
  sy: number;
}

/**
 * The square of the photo to keep for a tile: the tile's centre sits at `anchor` (the middle of
 * the photo unless told otherwise) less `shift`, the distance the camera stopped short, and the
 * patch is cut around it there. A patch that runs past the photo's edge is clipped to what the
 * photo has; null when none of it is in the photo. The patch is then more oblique than one from
 * the aim point, which is accepted so that a tile at the edge of the travel is photographed
 * rather than refused (PRD §11 decision 18).
 */
export const patchSource = (
  shift: GalvoPoint,
  photo: { height: number; width: number },
  {
    anchor,
    patchMm = PATCH_MM,
    pxPerMm = CAPTURE_PX_PER_MM,
  }: { anchor?: GalvoPoint; patchMm?: number; pxPerMm?: number } = {},
): null | PatchRect => {
  const at = anchor ?? { x: photo.width / 2, y: photo.height / 2 };
  const patchPx = patchMm * pxPerMm;
  const left = at.x - shift.x * pxPerMm - patchPx / 2;
  const top = at.y - shift.y * pxPerMm - patchPx / 2;
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
