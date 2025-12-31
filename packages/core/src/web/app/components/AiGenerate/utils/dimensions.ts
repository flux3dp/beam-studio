import type { AspectRatio, ImageDimensions, ImageSize } from '../types';

/** Map size names to max pixel dimensions */
const SIZE_TO_PIXELS: Record<ImageSize, number> = {
  '1K': 1024,
  '2K': 2048,
  '4K': 4096,
} as const;

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
