import type { AiImageGenerationData } from '@core/helpers/api/ai-image';

export interface StyleTemplate {
  background: { value: string; weight: number };
  color: { value: string; weight: number };
  negativePrompt: { value: string; weight: number };
  style: { value: string; weight: number };
  textPosition: { value: string; weight: number };
}

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
  weight: number; // Weight in the weighted JSON prompt
}

/**
 * Type-safe style preset keys - extracted from the actual presets array
 * Using const assertion to create a readonly tuple type
 */
export const STYLE_PRESET_KEYS = [
  //
  'text-to-image-plain',
  'edit-plain',
  'logo-cute',
  'logo-crafty',
  'logo-collage',
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
  inputFields: InputField[]; // Configurable input fields for this preset (always present now)
  key: StylePresetKey; // Type-safe preset identifier for lookups from history
  template: null | StyleTemplate; // null for plain modes, StyleTemplate for styled modes
}

const inputFieldOptions: Record<string, InputField> = {
  patternDescription: {
    key: 'description',
    label: 'Pattern Description',
    maxLength: 300,
    placeholder: 'Please describe the logo pattern you would like to create.',
    required: true,
    weight: 0.8,
  },
  patternDescriptionForEdit: {
    key: 'description',
    label: 'Edit Prompt',
    maxLength: 300,
    placeholder: 'Please describe how you would like to edit the images.',
    required: true,
    weight: 0.8,
  },
  textToDisplay: {
    key: 'text to display',
    label: 'Text to Display',
    maxLength: 15,
    placeholder: 'Enter text to display on the image (e.g., "MeowWoof")',
    required: false,
    weight: 1.2,
  },
};

/**
 * Style presets configuration as a Record for O(1) lookup
 * Key is part of the structure, eliminating duplication
 */
const STYLE_PRESETS: Record<StylePresetKey, StylePreset> = {
  // Plain modes - no styled template, just use description directly
  'edit-plain': {
    inputFields: [inputFieldOptions.patternDescriptionForEdit],
    key: 'edit-plain',
    template: null,
  },
  'logo-collage': {
    inputFields: [inputFieldOptions.patternDescription, inputFieldOptions.textToDisplay],
    key: 'logo-collage',
    template: {
      background: {
        value:
          'layered textured background, mixed paper scraps, subtle grunge, off-white or light grey with faint patterns, torn edges',
        weight: 0.6,
      },
      color: {
        value:
          'diverse color palette, contrasting colors, mixed textures, muted tones with unexpected pops of vibrant color, newsprint, vintage paper, natural fabrics',
        weight: 0.7,
      },
      negativePrompt: {
        value:
          'flat vector, sharp lines, perfect geometry, clean digital, smooth gradients, cartoon, highly realistic, glossy, 3D render, pristine, perfectly symmetrical, uniform colors, blurry, deformed, disfigured, ugly, bad anatomy, watermark, complex background, text artifacts',
        weight: 1.0,
      },
      style: {
        value:
          'Collage / Experimental logo, mixed media, deconstructed, cut-out paper elements, fragmented, textured layers, abstract shapes, raw aesthetic, handmade feel, artistic composition, rough edges, asymmetrical. Bold, distressed, or hand-drawn typography with unique character.',
        weight: 1.0,
      },
      textPosition: {
        value: 'positioned directly below the logo,, centered horizontally',
        weight: 1.1,
      },
    },
  },
  'logo-crafty': {
    inputFields: [inputFieldOptions.patternDescription, inputFieldOptions.textToDisplay],
    key: 'logo-crafty',
    template: {
      background: {
        value: 'soft textured paper background, subtle watercolor bleed, light parchment texture',
        weight: 0.6,
      },
      color: {
        value:
          'muted watercolor palette, soft natural hues: dusty rose, sage green, sky blue, peach, linen white, light sepia',
        weight: 0.7,
      },
      negativePrompt: {
        value:
          'flat vector, sharp lines, perfect geometry, glossy, 3D render, digital lines, cartoon, blurry, deformed, disfigured, ugly, bad anatomy, watermark, complex background, text artifacts',
        weight: 1.0,
      },
      style: {
        value:
          'Organic handcrafted logo, whimsical, watercolor painting style, sketchy lines, soft edges, natural brushstrokes, artistic, imperfect, gentle textures, handmade aesthetic. Delicate, flowing, hand-painted sans-serif typography.',
        weight: 1.0,
      },
      textPosition: {
        value: 'positioned directly below the logo, centered horizontally, with a hand-painted effect',
        weight: 1.1,
      },
    },
  },
  'logo-cute': {
    inputFields: [inputFieldOptions.patternDescription, inputFieldOptions.textToDisplay],
    key: 'logo-cute',
    template: {
      background: {
        value: 'full pure white color',
        weight: 0.6,
      },
      color: {
        value: 'soft pastel tones: baby pink, sky blue, cream white, gentle lavender, light golden yellow',
        weight: 0.7,
      },
      negativePrompt: {
        value:
          'blurry, deformed, disfigured, ugly, bad anatomy, watermark, messy, 3D render, photo, complex background, text artifacts',
        weight: 1.0,
      },
      style: {
        value:
          'kawaii hand-drawn logo, flat vector design, adorable illustration, rounded shapes, soft lines, professional quality, sharp lines. Bold, clean sans-serif typography',
        weight: 1.0,
      },
      textPosition: {
        value: 'positioned directly below the logo, centered horizontally',
        weight: 1.1,
      },
    },
  },
  'text-to-image-plain': {
    inputFields: [inputFieldOptions.patternDescription],
    key: 'text-to-image-plain',
    template: null,
  },
};

/**
 * Builds a prompt from preset and user inputs
 * For styled presets (template !== null): returns weighted JSON
 * For plain presets (template === null): returns plain text from description field
 * @param preset - The selected style preset
 * @param userDescription - User's custom description (deprecated, use customFields instead)
 * @param customFields - Dynamic input field values (e.g., { 'description': '...', 'text to display': 'MeowWoof' })
 * @returns Prompt string (JSON for styled, plain text for plain modes)
 */
export const buildStyledPrompt = (
  preset: StylePreset,
  userDescription: string,
  customFields: Record<string, string>,
): string => {
  // Plain mode: just return the description
  if (preset.template === null) {
    return userDescription.trim();
  }

  // Styled mode: build weighted JSON prompt
  const promptObject: Record<string, { value: string; weight: number }> = {
    background: preset.template.background,
    color: preset.template.color,
    description: {
      value: userDescription,
      weight: 0.9,
    },
    'negative prompt': preset.template.negativePrompt,
    style: preset.template.style,
    'text position': preset.template.textPosition,
  };

  // Dynamically add input fields based on preset definition
  preset.inputFields.forEach((field) => {
    const fieldValue = customFields[field.key];

    // Only add if value is provided and not empty
    if (fieldValue && fieldValue.trim()) {
      promptObject[field.key] = {
        value: fieldValue.trim(),
        weight: field.weight,
      };
    }
  });

  return JSON.stringify(promptObject, null, 2);
};

/**
 * Gets a style preset by key with O(1) lookup
 * @param key - The key of the style preset
 * @returns The style preset or undefined if not found
 */
export const getStylePreset = (key: StylePresetKey): StylePreset | undefined => STYLE_PRESETS[key];

/**
 * Parses a prompt to detect if it's a styled JSON prompt and extract relevant data
 * @param prompt - The prompt string (either plain text or weighted JSON)
 * @returns Object containing description, customFields, and detected style preset key (or null if plain text)
 */
export const parsePromptFromHistory = (
  item: AiImageGenerationData,
): {
  customFields: Record<string, string>;
  description: string;
  stylePresetKey: StylePresetKey;
  textToDisplay: string;
} => {
  const { model_type, prompt } = item;

  try {
    // Try to parse as JSON
    const parsed = JSON.parse(prompt) as Record<string, { value: string; weight: number }>;

    // Check if it has the expected weighted JSON structure
    if (!parsed.description || !parsed.style || typeof parsed.description.value !== 'string') {
      // Not a weighted JSON prompt, return as plain text
      return {
        customFields: {},
        description: prompt,
        stylePresetKey: model_type === 'edit' ? 'edit-plain' : 'text-to-image-plain',
        textToDisplay: '',
      };
    }

    // Extract description
    const description = parsed.description.value;

    // Detect which style preset was used by comparing style.value
    const styleValue = parsed.style.value;
    let detectedPreset: null | StylePreset = null;

    for (const preset of Object.values(STYLE_PRESETS)) {
      // Compare style values (they should match exactly)
      // Skip presets with null templates (plain modes)
      if (preset.template && preset.template.style.value === styleValue) {
        detectedPreset = preset;
        break;
      }
    }

    // Extract input fields dynamically based on detected preset
    const customFields: Record<string, string> = {};

    if (detectedPreset?.inputFields) {
      detectedPreset.inputFields.forEach((field) => {
        const fieldValue = parsed[field.key]?.value;

        if (fieldValue) {
          customFields[field.key] = fieldValue;
        }
      });
    }

    // For backward compatibility, also extract textToDisplay
    const textToDisplay = parsed['text to display']?.value || '';

    return {
      customFields,
      description,
      stylePresetKey: detectedPreset?.key || (model_type === 'edit' ? 'edit-plain' : 'text-to-image-plain'),
      textToDisplay,
    };
  } catch {
    // Not JSON or parsing failed, treat as plain text
    return {
      customFields: {},
      description: prompt,
      stylePresetKey: model_type === 'edit' ? 'edit-plain' : 'text-to-image-plain',
      textToDisplay: '',
    };
  }
};
