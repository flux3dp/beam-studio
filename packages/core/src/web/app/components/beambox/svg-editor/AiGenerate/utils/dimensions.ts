import { match, P } from 'ts-pattern';

import type { ImageResolution, ImageSizeOption } from '@core/helpers/api/ai-image';

import type { AspectRatio, ImageDimensions } from '../types';

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
  const { height, width } = match(orientation)
    .with('landscape', () => ({ height: Math.round(maxDimension / ratio), width: maxDimension }))
    .otherwise(() => ({ height: maxDimension, width: Math.round(maxDimension / ratio) }));

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
export const getImageResolution = ({ size }: ImageDimensions): ImageResolution =>
  match(size)
    .with('large', () => '4K' as ImageResolution)
    .with('medium', () => '2K' as ImageResolution)
    .otherwise(() => '1K' as ImageResolution);

export const getAspectRatioFromImageSize = (imageSize: string): AspectRatio =>
  match(imageSize)
    .with(P.string.includes('16_9'), () => '16:9' as AspectRatio)
    .with(P.string.includes('4_3'), () => '4:3' as AspectRatio)
    .with(P.string.includes('3_2'), () => '3:2' as AspectRatio)
    .otherwise(() => '1:1' as AspectRatio);

export const getOrientationFromImageSize = (imageSize: string): 'landscape' | 'portrait' =>
  match(imageSize)
    .with(P.string.startsWith('portrait'), () => 'portrait' as const)
    .otherwise(() => 'landscape' as const);

export const getSizeFromImageResolution = (imageResolution: string): 'large' | 'medium' | 'small' =>
  match(imageResolution)
    .with('4K', () => 'large' as const)
    .with('2K', () => 'medium' as const)
    .otherwise(() => 'small' as const);
