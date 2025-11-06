import type { GenerationMode } from '../useAiGenerateStore';

import { type StylePresetKey } from './stylePresets';

/**
 * Represents a single creation style option (e.g., "Plain Text-to-Image", "Cute Logo")
 */
export interface Style {
  displayName: string;
  id: StylePresetKey;
  mode: GenerationMode;
  previewImage: string; // URL or file path to preview image showing style result
}

/**
 * Represents a category containing multiple style options
 */
export interface Category {
  displayName: string;
  id: string;
  styles: Style[];
}

/**
 * All available categories and their style options
 */
export const CATEGORIES: Category[] = [
  {
    displayName: 'Text to Image',
    id: 'text-to-image',
    styles: [
      {
        displayName: 'Plain',
        id: 'text-to-image-plain',
        mode: 'text-to-image',
        previewImage: 'https://picsum.photos/id/1/80/80',
      },
    ],
  },
  {
    displayName: 'Edit Image',
    id: 'edit',
    styles: [
      {
        displayName: 'Plain',
        id: 'edit-plain',
        mode: 'edit',
        previewImage: 'https://picsum.photos/id/2/80/80',
      },
      {
        displayName: 'American 2D Cartoon',
        id: 'edit-american-2d-cartoon',
        mode: 'edit',
        previewImage: 'https://picsum.photos/id/6/80/80',
      },
      {
        displayName: 'Japanese Anime',
        id: 'edit-japanese-anime',
        mode: 'edit',
        previewImage: 'https://picsum.photos/id/7/80/80',
      },
      {
        displayName: 'Photo to Line',
        id: 'edit-photo-to-line',
        mode: 'edit',
        previewImage: 'https://picsum.photos/id/8/80/80',
      },
      {
        displayName: 'Photo to Line Outline',
        id: 'edit-photo-to-line-outline',
        mode: 'edit',
        previewImage: 'https://picsum.photos/id/9/80/80',
      },
      {
        displayName: 'Pixar 3D',
        id: 'edit-pixar-3d',
        mode: 'edit',
        previewImage: 'https://picsum.photos/id/10/80/80',
      },
    ],
  },
  {
    displayName: 'Logo',
    id: 'logo',
    styles: [
      {
        displayName: 'Cute Logo',
        id: 'logo-cute',
        mode: 'text-to-image',
        previewImage: 'https://picsum.photos/id/3/80/80',
      },
      {
        displayName: 'Crafty Logo',
        id: 'logo-crafty',
        mode: 'text-to-image',
        previewImage: 'https://picsum.photos/id/4/80/80',
      },
      {
        displayName: 'Collage Logo',
        id: 'logo-collage',
        mode: 'text-to-image',
        previewImage: 'https://picsum.photos/id/5/80/80',
      },
    ],
  },
];

/**
 * Get the configuration for a specific style option by ID
 */
export const getStyleConfig = (style: StylePresetKey): Style => {
  if (!style) return CATEGORIES[0].styles[0]; // Default to first option

  for (const category of CATEGORIES) {
    const option = category.styles.find((opt) => opt.id === style);

    if (option) return option;
  }

  return CATEGORIES[0].styles[0]; // Fallback to first option
};

/**
 * Get the category that contains a specific style option
 */
export const getCategoryForOption = (optionId: null | string): Category | null => {
  if (!optionId) return null;

  for (const category of CATEGORIES) {
    if (category.styles.some((opt) => opt.id === optionId)) {
      return category;
    }
  }

  return null;
};
