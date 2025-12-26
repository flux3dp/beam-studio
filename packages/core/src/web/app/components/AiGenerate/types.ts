import type { Category, Style } from '@core/helpers/api/ai-image-config';

// Aspect ratios now include both landscape and portrait variants directly
export type AspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '9:16' | '16:9' | '21:9';
export type ImageSize = '1K' | '2K' | '4K';
export type GenerationStatus = 'failed' | 'generating' | 'idle' | 'success';
export type GenerationMode = 'edit' | 'text-to-image';

export type ImageDimensions = { aspectRatio: AspectRatio; size: ImageSize };
/** Represents a single image input - either a local file upload or url */
export type ImageInput = { file: File; id: string; type: 'file' } | { id: string; type: 'url'; url: string };

export const LASER_FRIENDLY_VALUE =
  'pure black and white, monochrome, high contrast, line art, no gradients, no shading, suitable for engraving';
export const AI_COST_PER_IMAGE = 0.06;
export const GENERATE_BUTTON_COOLDOWN_MS = 2000;
export const DEFAULT_CATEGORY: Category = {
  displayName: 'Customize',
  id: 'customize',
  previewImage: 'https://s3.ap-northeast-1.amazonaws.com/flux-id/ai-styles/customize/en-us.png',
  tags: ['customize'],
} as const;
export const DEFAULT_STYLE: Style = {
  displayName: 'Customize',
  id: 'customize',
  inputFields: [
    {
      key: 'description',
      label: 'Description',
      maxLength: 2000,
      placeholder: 'Add a description, images, or both to guide your creation.',
      required: false,
    },
  ],
  modes: ['edit', 'text-to-image'],
  tags: ['customize'],
} as const;

/** Helper to create a file-type ImageInput */
export const createFileInput = (file: File): ImageInput => ({
  file,
  id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  type: 'file',
});

/** Helper to create a URL-type ImageInput */
export const createUrlInput = (url: string): ImageInput => ({
  id: `url-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  type: 'url',
  url,
});

/** Helper to handle key down events in a text area */
export const handleTextAreaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
  e.stopPropagation();

  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') {
    e.preventDefault();
    e.currentTarget.select();
  }

  // to prevent focus issue
  if (e.key === 'Escape') {
    e.preventDefault();
    e.currentTarget.blur();
  }
};
