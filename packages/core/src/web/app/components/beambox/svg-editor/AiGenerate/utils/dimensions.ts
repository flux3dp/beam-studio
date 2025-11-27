import { match, P } from 'ts-pattern';

import type { GenerationRequest } from '@core/helpers/api/ai-image';

import type { AspectRatio, ImageDimensions } from '../types';

/** Calculate pixel dimensions from image dimensions configuration */
export const getSizePixels = ({ aspectRatio, orientation, size }: ImageDimensions): string => {
  const maxDimension = match(size)
    .with('small', () => 1024)
    .with('medium', () => 2048)
    .with('large', () => 4096)
    .exhaustive();

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

export const getImageSizeOption = (dimensions: ImageDimensions): GenerationRequest['image_size'] =>
  match(dimensions)
    .with({ aspectRatio: '1:1' }, () => 'square_hd')
    .otherwise(
      ({ aspectRatio, orientation }) => `${orientation}_${aspectRatio.replace(':', '_')}`,
    ) as GenerationRequest['image_size'];

export const getImageResolution = ({ size }: ImageDimensions): GenerationRequest['image_resolution'] =>
  match(size)
    .with('large', () => '4K' as const)
    .with('medium', () => '2K' as const)
    .otherwise(() => '1K' as const);

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
