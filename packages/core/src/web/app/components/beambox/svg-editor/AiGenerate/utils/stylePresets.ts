export type StyleTemplate = Partial<
  Record<'background' | 'color' | 'negativePrompt' | 'style' | 'textPosition', { value: string; weight: number }>
>;

/**
 * Represents a configurable input field for style presets
 * Includes both user-facing fields (text to display) and core fields (pattern description)
 */
export interface InputField {
  key: string; // Unique identifier for the field (e.g., 'description', 'text to display')
  label: string; // UI label shown to user
  maxLength?: number; // Optional max length constraint
  placeholder: string; // Placeholder text
  required: boolean; // Whether field is required
}

/**
 * Type-safe style preset keys - extracted from the actual presets array
 * Using const assertion to create a readonly tuple type
 */
export const STYLE_PRESET_KEYS = [
  'text-to-image-plain',
  'edit-plain',
  'edit-american-2d-cartoon',
  'edit-japanese-anime',
  'edit-photo-to-line',
  'edit-photo-to-line-outline',
  'edit-pixar-3d',
  'logo-cute',
  'logo-crafty',
  'logo-collage',
  'logo-chinese-calligraphy',
  'logo-neon',
] as const;

/**
 * Union type of all valid style preset keys
 * This provides compile-time validation when referencing presets
 */
export type StylePresetKey = (typeof STYLE_PRESET_KEYS)[number];

/**
 * Complete style preset with key included
 */
export interface StylePreset {
  inputFields: InputField[];
  key: StylePresetKey;
}

const inputFieldOptions: Record<string, InputField> = {
  patternDescription: {
    key: 'description',
    label: 'Pattern Description',
    maxLength: 2000,
    placeholder: 'Please describe the logo pattern you would like to create.',
    required: true,
  },
  patternDescriptionForEdit: {
    key: 'description',
    label: 'Edit Prompt',
    maxLength: 2000,
    placeholder: 'Please describe how you would like to edit the images.',
    required: false,
  },
  textToDisplay: {
    key: 'textToDisplay',
    label: 'Text to Display',
    maxLength: 50,
    placeholder: 'Enter text to display on the image (e.g., "MeowWoof")',
    required: false,
  },
};

/**
 * Style presets configuration as a Record for O(1) lookup
 * Key is part of the structure, eliminating duplication
 */
const STYLE_PRESETS: Record<StylePresetKey, InputField[]> = {
  'edit-american-2d-cartoon': [inputFieldOptions.patternDescriptionForEdit],
  'edit-japanese-anime': [inputFieldOptions.patternDescriptionForEdit],
  'edit-photo-to-line': [inputFieldOptions.patternDescriptionForEdit],
  'edit-photo-to-line-outline': [inputFieldOptions.patternDescriptionForEdit],
  'edit-pixar-3d': [inputFieldOptions.patternDescriptionForEdit],
  'edit-plain': [inputFieldOptions.patternDescriptionForEdit],
  'logo-chinese-calligraphy': [inputFieldOptions.patternDescription, inputFieldOptions.textToDisplay],
  'logo-collage': [inputFieldOptions.patternDescription, inputFieldOptions.textToDisplay],
  'logo-crafty': [inputFieldOptions.patternDescription, inputFieldOptions.textToDisplay],
  'logo-cute': [inputFieldOptions.patternDescription, inputFieldOptions.textToDisplay],
  'logo-neon': [inputFieldOptions.patternDescription, inputFieldOptions.textToDisplay],
  'text-to-image-plain': [inputFieldOptions.patternDescription],
};

/**
 * Gets a style preset by key with O(1) lookup
 * @param key - The key of the style preset
 * @returns The style preset or undefined if not found
 */
export const getStylePreset = (key: StylePresetKey): InputField[] => STYLE_PRESETS[key] || [];
