import type { GenerationMode } from '../useAiGenerateStore';

/**
 * Represents a single creation option (e.g., "Plain Text-to-Image", "Cute Logo")
 */
export interface CategoryOption {
  description: string; // Detailed description
  displayName: string; // Display name for UI
  id: string; // Unique identifier: 'plain-text-to-image', 'plain-edit', 'cute', 'crafty', 'collage'
  mode: GenerationMode; // Which API mode to use
  stylePreset: null | string; // Style preset name or null for plain modes
}

/**
 * Represents a category containing multiple options
 */
export interface Category {
  description: string; // Category description
  displayName: string; // Display name for UI
  id: string; // Category identifier: 'text-to-image', 'edit', 'logo'
  options: CategoryOption[]; // Available options in this category
}

/**
 * All available categories and their options
 */
export const CATEGORIES: Category[] = [
  {
    description: 'Generate images from text descriptions without style templates',
    displayName: 'Text-to-Image',
    id: 'text-to-image',
    options: [
      {
        description: 'Generate images from text with full creative control. No style templates applied.',
        displayName: 'Plain Text-to-Image',
        id: 'plain-text-to-image',
        mode: 'text-to-image',
        stylePreset: null,
      },
    ],
  },
  {
    description: 'Modify and edit existing images with AI',
    displayName: 'Edit',
    id: 'edit',
    options: [
      {
        description: 'Edit images with custom prompts. Upload images and describe your desired changes.',
        displayName: 'Plain Edit',
        id: 'plain-edit',
        mode: 'edit',
        stylePreset: null,
      },
    ],
  },
  {
    description: 'Create stylized logos with professional templates',
    displayName: 'Logo',
    id: 'logo',
    options: [
      {
        description: 'Kawaii hand-drawn style with soft pastel colors and rounded shapes',
        displayName: 'Cute Logo',
        id: 'cute',
        mode: 'text-to-image',
        stylePreset: 'cute',
      },
      {
        description: 'Organic handcrafted watercolor style with natural brushstrokes',
        displayName: 'Crafty Logo',
        id: 'crafty',
        mode: 'text-to-image',
        stylePreset: 'crafty',
      },
      {
        description: 'Mixed media experimental style with fragmented and textured layers',
        displayName: 'Collage Logo',
        id: 'collage',
        mode: 'text-to-image',
        stylePreset: 'collage',
      },
    ],
  },
];

/**
 * Get the configuration for a specific option by ID
 */
export const getSelectedOptionConfig = (optionId: null | string): CategoryOption | null => {
  if (!optionId) return null;

  for (const category of CATEGORIES) {
    const option = category.options.find((opt) => opt.id === optionId);

    if (option) return option;
  }

  return null;
};

/**
 * Get the category that contains a specific option
 */
export const getCategoryForOption = (optionId: null | string): Category | null => {
  if (!optionId) return null;

  for (const category of CATEGORIES) {
    if (category.options.some((opt) => opt.id === optionId)) {
      return category;
    }
  }

  return null;
};

/**
 * Get option ID from mode and stylePreset (for history import)
 */
export const getOptionIdFromModeAndPreset = (mode: GenerationMode, stylePreset: null | string): string => {
  // If there's a style preset, it's the option ID
  if (stylePreset) {
    return stylePreset; // 'cute', 'crafty', 'collage'
  }

  // Plain modes
  return mode === 'edit' ? 'plain-edit' : 'plain-text-to-image';
};
