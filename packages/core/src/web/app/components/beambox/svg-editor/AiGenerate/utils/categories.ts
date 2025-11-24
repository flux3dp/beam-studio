/* eslint-disable perfectionist/sort-union-types */

import type { StylePresetKey } from './stylePresets';

/**
 * Flat tag system for categorizing styles
 * Tags enable styles to appear in multiple categories
 */
export type StyleTag =
  // Line Art styles
  | 'line-art'
  // Texture Art styles
  | 'texture'
  // Cartoon styles
  | 'cartoon'
  // Logo styles
  | 'logo'
  // Typography styles
  | 'typography'
  // Artistry styles
  | 'artistic'
  // Contemporary styles
  | 'contemporary'
  // Classics styles
  | 'classic'
  // Customize/Plain
  | 'customize';

/**
 * Represents a single creation style option (e.g., "Plain Text-to-Image", "Cute Logo")
 */
export interface Style {
  displayName: string;
  id: StylePresetKey;
  mode: Array<'edit' | 'text-to-image'>;
  previewImage: string; // URL or file path to preview image showing style result
  tags: StyleTag[]; // Multiple tags allow styles to appear in multiple categories
}

/**
 * Represents a category that filters styles by tags
 */
export interface Category {
  displayName: string;
  id: string;
  tags: StyleTag[]; // Styles with ANY of these tags will appear in this category (OR logic)
}

/**
 * All available styles with their tags
 * Single source of truth for style definitions
 */
export const ALL_STYLES: Style[] = [
  {
    displayName: 'Plain',
    id: 'plain',
    mode: ['edit', 'text-to-image'],
    previewImage: 'https://picsum.photos/id/1/80/80',
    tags: ['customize'],
  },
  {
    displayName: 'American 2D Cartoon',
    id: 'edit-american-2d-cartoon',
    mode: ['edit', 'text-to-image'],
    previewImage: 'https://picsum.photos/id/6/80/80',
    tags: ['cartoon'],
  },
  {
    displayName: 'Japanese Anime',
    id: 'edit-japanese-anime',
    mode: ['edit', 'text-to-image'],
    previewImage: 'https://picsum.photos/id/7/80/80',
    tags: ['cartoon'],
  },
  {
    displayName: 'Photo to Line',
    id: 'edit-photo-to-line',
    mode: ['edit', 'text-to-image'],
    previewImage: 'https://picsum.photos/id/8/80/80',
    tags: ['line-art'],
  },
  {
    displayName: 'Photo to Line Outline',
    id: 'edit-photo-to-line-outline',
    mode: ['edit', 'text-to-image'],
    previewImage: 'https://picsum.photos/id/9/80/80',
    tags: ['line-art'],
  },
  {
    displayName: 'Pixar 3D',
    id: 'edit-pixar-3d',
    mode: ['edit', 'text-to-image'],
    previewImage: 'https://picsum.photos/id/10/80/80',
    tags: ['cartoon'],
  },
  {
    displayName: 'Cute Logo',
    id: 'logo-cute',
    mode: ['edit', 'text-to-image'],
    previewImage: 'https://picsum.photos/id/3/80/80',
    tags: ['logo'],
  },
  {
    displayName: 'Crafty Logo',
    id: 'logo-crafty',
    mode: ['edit', 'text-to-image'],
    previewImage: 'https://picsum.photos/id/4/80/80',
    tags: ['logo'],
  },
  {
    displayName: 'Collage Logo',
    id: 'logo-collage',
    mode: ['edit', 'text-to-image'],
    previewImage: 'https://picsum.photos/id/5/80/80',
    tags: ['logo'],
  },
  {
    displayName: 'Chinese Calligraphy Logo',
    id: 'logo-chinese-calligraphy',
    mode: ['edit', 'text-to-image'],
    previewImage: 'https://picsum.photos/id/6/80/80',
    tags: ['logo'],
  },
  {
    displayName: 'Neon Logo',
    id: 'logo-neon',
    mode: ['edit', 'text-to-image'],
    previewImage: 'https://picsum.photos/id/7/80/80',
    tags: ['logo'],
  },
];

/**
 * All available categories and their tag filters
 * Categories are views over styles, filtered by tags
 */
export const CATEGORIES: Category[] = [
  {
    displayName: 'Line Art',
    id: 'line-art',
    tags: ['line-art'],
  },
  {
    displayName: 'Cartoon',
    id: 'cartoon',
    tags: ['cartoon'],
  },
  {
    displayName: 'Logo',
    id: 'logo',
    tags: ['logo'],
  },
  {
    displayName: 'Typography',
    id: 'typography',
    tags: ['typography'],
  },
  {
    displayName: 'Artistry',
    id: 'artistry',
    tags: ['artistic'],
  },
  {
    displayName: 'Contemporary',
    id: 'contemporary',
    tags: ['contemporary'],
  },
  {
    displayName: 'Classics',
    id: 'classics',
    tags: ['classic'],
  },
  {
    displayName: 'Customize',
    id: 'customize',
    tags: ['customize'],
  },
];

/**
 * Get all styles that match a category's tags (OR logic)
 * A style appears in a category if it has ANY of the category's tags
 */
export const getStylesForCategory = (categoryId: string): Style[] => {
  const category = CATEGORIES.find((c) => c.id === categoryId);

  if (!category) return [];

  return ALL_STYLES.filter((style) => style.tags.some((tag) => category.tags.includes(tag)));
};

/**
 * Get all categories that contain a specific style
 * Returns all categories whose tags match any of the style's tags
 */
export const getCategoriesForStyle = (styleId: StylePresetKey): Category[] => {
  const style = ALL_STYLES.find((s) => s.id === styleId);

  if (!style) return [];

  return CATEGORIES.filter((category) => category.tags.some((tag) => style.tags.includes(tag)));
};

/**
 * Get the configuration for a specific style option by ID
 */
export const getStyleConfig = (styleId: StylePresetKey): Style => {
  const style = ALL_STYLES.find((s) => s.id === styleId);

  return style || ALL_STYLES[0]; // Fallback to first style
};

/**
 * Get the first category that contains a specific style option
 * Note: With tag-based system, a style can appear in multiple categories
 * This returns the first matching category for backward compatibility
 */
export const getCategoryForOption = (optionId: null | string): Category | null => {
  if (!optionId) return null;

  const categories = getCategoriesForStyle(optionId as StylePresetKey);

  return categories[0] || null;
};
