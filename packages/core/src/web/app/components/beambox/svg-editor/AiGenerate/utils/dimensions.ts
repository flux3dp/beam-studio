import { match } from 'ts-pattern';

import type { ImageResolution, ImageSizeOption } from '@core/helpers/api/ai-image';

import type { ImageDimensions } from '../useAiGenerateStore';

/**
 * Calculate pixel dimensions from image dimensions configuration
 * @param dimensions - Image dimensions configuration (aspectRatio, orientation, size)
 * @returns Formatted string representation of pixel dimensions (e.g., "1024 x 768")
 */
export const getSizePixels = ({ aspectRatio, orientation, size }: ImageDimensions): string => {
  // Get maximum dimension based on size
  const maxDimension = match(size)
    .with('small', () => 1024)
    .with('medium', () => 2048)
    .with('large', () => 4096)
    .exhaustive();

  // Handle square ratio
  if (aspectRatio === '1:1') {
    return `${maxDimension} x ${maxDimension}`;
  }

  // Parse and calculate based on orientation
  const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);
  const ratio = widthRatio / heightRatio;
  let width: number;
  let height: number;

  if (orientation === 'landscape') {
    width = maxDimension;
    height = Math.round(width / ratio);
  } else {
    height = maxDimension;
    width = Math.round(height / ratio);
  }

  return `${width} x ${height}`;
};

/**
 * Convert image dimensions to API ImageSizeOption format
 * @param dimensions - Image dimensions configuration
 * @returns ImageSizeOption string for API (e.g., "square_hd", "landscape_16_9")
 */
export const getImageSizeOption = (dimensions: ImageDimensions): ImageSizeOption =>
  match(dimensions)
    .with({ aspectRatio: '1:1' }, () => 'square_hd' as ImageSizeOption)
    .otherwise(({ aspectRatio, orientation }) => `${orientation}_${aspectRatio.replace(':', '_')}` as ImageSizeOption);

/**
 * Convert ImageSize to API ImageResolution format
 * @param size - Image size ('small', 'medium', 'large')
 * @returns ImageResolution string for API ('1K', '2K', '4K')
 */
export const getImageResolution = (size: ImageDimensions['size']): ImageResolution =>
  match(size)
    .with('small', () => '1K' as ImageResolution)
    .with('medium', () => '2K' as ImageResolution)
    .with('large', () => '4K' as ImageResolution)
    .exhaustive();
