import { cleanDepthEdges, getDepthStats, liftDots } from './depthField';
import type { DepthSource } from './depthSource';
import type { RasterData } from './dither';
import { ditherPhoto } from './dither';

/**
 * More points than this would make the job and the canvas unusably slow. A 60 mm photo at the default
 * 0.03 mm point spacing measured about 2 million (replicate-3d-compare test 6).
 */
export const MAX_PHOTO_TO_3D_POINTS = 3_000_000;
/**
 * More dot cells than this cannot be dithered in reasonable memory (about 20 bytes a cell while it
 * runs). The 70 mm field is 5.4 million cells at 0.03 mm.
 */
export const MAX_PHOTO_TO_3D_CELLS = 12_000_000;

export interface PhotoTo3dSize {
  /** Z thickness in world mm: the relief's full depth. */
  depth: number;
  height: number;
  width: number;
}

export interface PhotoTo3dParams {
  /** Roll-off radius along the cut-out, mm; 0 is off. */
  edgeRoundMm: number;
  /** The layer's point spacing, mm: the dot pitch across the photo. */
  pointSpacing: number;
  sharpenAmount: number;
  /** In dots. */
  sharpenRadius: number;
}

export class PhotoTo3dError extends Error {
  constructor(
    public reason: 'flat' | 'no-points' | 'too-many-points',
    message: string,
  ) {
    super(message);
    this.name = 'PhotoTo3dError';
  }
}

/**
 * The point cloud of a photo from its depth: dither the photo at the point spacing, clean the depth
 * along the cut-out, lift every dot onto it.
 * @param pixels the photo as shown on the canvas (background removed when that was chosen)
 * @param size the object's current world size; the dot grid and every slope are measured in it
 * @returns XYZ in world millimetres, X and Y centred, Z from 0 (far) to `size.depth` (near)
 */
export const generatePhotoTo3dPoints = (
  pixels: RasterData,
  source: DepthSource,
  size: PhotoTo3dSize,
  { edgeRoundMm, pointSpacing, sharpenAmount, sharpenRadius }: PhotoTo3dParams,
): Float32Array => {
  const stats = getDepthStats(source);

  if (stats.valid < 2 || !(stats.upper > stats.lower)) {
    throw new PhotoTo3dError('flat', 'The depth has almost no variation');
  }

  const columns = Math.max(1, Math.round(size.width / pointSpacing));
  const rows = Math.max(1, Math.round(size.height / pointSpacing));

  if (columns * rows > MAX_PHOTO_TO_3D_CELLS) {
    throw new PhotoTo3dError('too-many-points', `A ${columns} × ${rows} dot grid is too large`);
  }

  const dither = ditherPhoto(pixels, columns, rows, { amount: sharpenAmount, radius: sharpenRadius });
  const field = cleanDepthEdges(source, stats, pixels, {
    depthMm: size.depth,
    roundMm: edgeRoundMm,
    widthMm: size.width,
  });
  const points = liftDots(field, stats, dither, { depthMm: size.depth, heightMm: size.height, widthMm: size.width });

  if (!points.length) throw new PhotoTo3dError('no-points', 'No dot falls on the photo');

  if (points.length / 3 > MAX_PHOTO_TO_3D_POINTS) {
    throw new PhotoTo3dError('too-many-points', `${points.length / 3} points`);
  }

  return points;
};
