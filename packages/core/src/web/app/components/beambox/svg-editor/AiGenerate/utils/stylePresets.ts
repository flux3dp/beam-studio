export interface StyleTemplate {
  background: { value: string; weight: number };
  color: { value: string; weight: number };
  negativePrompt: { value: string; weight: number };
  style: { value: string; weight: number };
  textPosition: { value: string; weight: number };
}

export interface CustomField {
  key: string; // Unique identifier for the field (e.g., 'textToDisplay', 'hairStyle')
  label: string; // UI label shown to user
  maxLength?: number; // Optional max length constraint
  placeholder: string; // Placeholder text
  required: boolean; // Whether field is required
  weight: number; // Weight in the weighted JSON prompt
}

export interface StylePreset {
  customFields?: CustomField[]; // Optional style-specific input fields
  description: string;
  displayName: string;
  name: string;
  template: StyleTemplate;
}

const customFieldOptions: Record<string, CustomField> = {
  textToDisplay: {
    key: 'text to display',
    label: 'Text to Display',
    maxLength: 15,
    placeholder: 'Enter text to display on the image (e.g., "MeowWoof")',
    required: false,
    weight: 1.2,
  },
};

export const STYLE_PRESETS: StylePreset[] = [
  {
    customFields: [customFieldOptions.textToDisplay],
    description: 'Kawaii hand-drawn style with soft pastel colors and rounded shapes',
    displayName: 'Cute Logo',
    name: 'cute',
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
  {
    customFields: [customFieldOptions.textToDisplay],
    description: 'Organic handcrafted watercolor style with natural brushstrokes',
    displayName: 'Crafty Logo',
    name: 'crafty',
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
  {
    customFields: [customFieldOptions.textToDisplay],
    description: 'Mixed media experimental style with fragmented and textured layers',
    displayName: 'Collage Logo',
    name: 'collage',
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
];

/**
 * Builds a weighted JSON prompt by combining a style preset with user's description and custom fields
 * @param preset - The selected style preset
 * @param userDescription - User's custom description
 * @param customFields - Dynamic custom field values (e.g., { 'text to display': 'MeowWoof' })
 * @returns JSON string in the format expected by the AI backend
 */
export const buildStyledPrompt = (
  preset: StylePreset,
  userDescription: string,
  customFields: Record<string, string>,
): string => {
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

  // Dynamically add custom fields based on preset definition
  preset.customFields?.forEach((field) => {
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
 * Gets a style preset by name
 * @param name - The name of the style preset
 * @returns The style preset or undefined if not found
 */
export const getStylePreset = (name: string): StylePreset | undefined => STYLE_PRESETS.find((p) => p.name === name);

/**
 * Parses a prompt to detect if it's a styled JSON prompt and extract relevant data
 * @param prompt - The prompt string (either plain text or weighted JSON)
 * @returns Object containing description, customFields, and detected style preset name (or null if plain text)
 */
export const parsePromptFromHistory = (
  prompt: string,
): {
  customFields: Record<string, string>;
  description: string;
  stylePresetName: null | string;
  textToDisplay: string;
} => {
  try {
    // Try to parse as JSON
    const parsed = JSON.parse(prompt) as Record<string, { value: string; weight: number }>;

    // Check if it has the expected weighted JSON structure
    if (!parsed.description || !parsed.style || typeof parsed.description.value !== 'string') {
      // Not a weighted JSON prompt, return as plain text
      return { customFields: {}, description: prompt, stylePresetName: null, textToDisplay: '' };
    }

    // Extract description
    const description = parsed.description.value;

    // Detect which style preset was used by comparing style.value
    const styleValue = parsed.style.value;
    let detectedPreset: null | StylePreset = null;

    for (const preset of STYLE_PRESETS) {
      // Compare style values (they should match exactly)
      if (preset.template.style.value === styleValue) {
        detectedPreset = preset;
        break;
      }
    }

    // Extract custom fields dynamically based on detected preset
    const customFields: Record<string, string> = {};

    if (detectedPreset?.customFields) {
      detectedPreset.customFields.forEach((field) => {
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
      stylePresetName: detectedPreset?.name || null,
      textToDisplay,
    };
  } catch {
    // Not JSON or parsing failed, treat as plain text
    return { customFields: {}, description: prompt, stylePresetName: null, textToDisplay: '' };
  }
};
