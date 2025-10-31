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
