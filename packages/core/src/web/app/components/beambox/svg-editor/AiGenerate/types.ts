// Aspect ratios now include both landscape and portrait variants directly
export type AspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '9:16' | '16:9' | '21:9';
export type ImageSize = 'large' | 'medium' | 'small';
export type ImageResolution = '1K' | '2K' | '4K';
export type GenerationStatus = 'failed' | 'generating' | 'idle' | 'success';
export type GenerationMode = 'edit' | 'text-to-image';

// Simplified: orientation is now implicit in the aspect ratio (e.g., '3:4' is portrait)
export interface ImageDimensions {
  aspectRatio: AspectRatio;
  size: ImageSize;
}

/**
 * Represents a single image input - either a local file upload or url
 */
export type ImageInput = { file: File; id: string; type: 'file' } | { id: string; type: 'url'; url: string };

/**
 * Helper to create a file-type ImageInput
 */
export const createFileInput = (file: File): ImageInput => ({
  file,
  id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  type: 'file',
});

/**
 * Helper to create a URL-type ImageInput
 */
export const createUrlInput = (url: string): ImageInput => ({
  id: `url-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  type: 'url',
  url,
});
