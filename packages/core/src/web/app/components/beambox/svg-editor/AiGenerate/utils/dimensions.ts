import type { AspectRatio, ImageDimensions, ImageResolution, ImageSize } from '../types';

/** Map size names to max pixel dimensions */
const SIZE_TO_PIXELS: Record<ImageSize, number> = {
  large: 4096,
  medium: 2048,
  small: 1024,
};

/** Map size names to API resolution strings */
const SIZE_TO_RESOLUTION: Record<ImageSize, ImageResolution> = {
  large: '4K',
  medium: '2K',
  small: '1K',
};

/** Map API resolution strings back to size names */
const RESOLUTION_TO_SIZE: Record<string, ImageSize> = {
  '1K': 'small',
  '2K': 'medium',
  '4K': 'large',
};

/**
 * Calculate actual width and height from aspect ratio and size
 * The larger dimension equals the max size, smaller is calculated from ratio
 */
export const getWidthHeight = (aspectRatio: AspectRatio, size: ImageSize): { height: number; width: number } => {
  const maxDim = SIZE_TO_PIXELS[size];
  const [w, h] = aspectRatio.split(':').map(Number);

  // Square: both dimensions are max
  if (w === h) return { height: maxDim, width: maxDim };

  // Landscape (w > h): width is max, height is calculated
  if (w > h) return { height: Math.round((maxDim * h) / w), width: maxDim };

  // Portrait (w < h): height is max, width is calculated
  return { height: maxDim, width: Math.round((maxDim * w) / h) };
};

/** Calculate pixel dimensions string for display (e.g., "2048 x 1536") */
export const getSizePixels = ({ aspectRatio, size }: ImageDimensions): string => {
  const { height, width } = getWidthHeight(aspectRatio, size);

  return `${width} x ${height}`;
};

/** Convert size name to API resolution string */
export const getSizeResolution = (size: ImageSize): ImageResolution => SIZE_TO_RESOLUTION[size];

/** Convert API resolution string back to size name */
export const getSizeFromResolution = (resolution: string): ImageSize => RESOLUTION_TO_SIZE[resolution] ?? 'small';
