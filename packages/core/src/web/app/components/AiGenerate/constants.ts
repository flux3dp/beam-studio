import type { Category, Style } from '@core/helpers/api/ai-image-config';

export const LASER_FRIENDLY_VALUE =
  'pure black and white, monochrome, high contrast, line art, no gradients, no shading, suitable for engraving';
export const AI_COST_PER_IMAGE = 0.06;
export const GENERATE_BUTTON_COOLDOWN_MS = 2000;
export const DEFAULT_CATEGORY: Category = {
  displayName: 'Customize',
  id: 'customize',
  previewImage: 'core-img/ai-generate/preview-fallback.png',
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
  previewImage: 'core-img/ai-generate/preview-fallback.png',
  tags: ['customize'],
} as const;
