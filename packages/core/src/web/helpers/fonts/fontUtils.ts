/* eslint-disable perfectionist/sort-objects */
import { match, P } from 'ts-pattern';

import type { GoogleFont } from '@core/interfaces/IFont';

export const WEIGHT_TO_STYLE_MAP = {
  100: 'Thin',
  200: 'Extra Light',
  300: 'Light',
  400: 'Regular',
  500: 'Medium',
  600: 'Semi Bold',
  700: 'Bold',
  800: 'Extra Bold',
  900: 'Black',
} as const;

export const WEIGHT_TO_POSTSCRIPT_MAP = {
  100: 'Thin',
  200: 'ExtraLight',
  300: 'Light',
  400: 'Regular',
  500: 'Medium',
  600: 'SemiBold',
  700: 'Bold',
  800: 'ExtraBold',
  900: 'Black',
} as const;

export const POSTSCRIPT_TO_WEIGHT_MAP = {
  Thin: 100,
  ExtraLight: 200,
  Light: 300,
  Regular: 400,
  Medium: 500,
  SemiBold: 600,
  Bold: 700,
  ExtraBold: 800,
  Black: 900,
} as const;

export const FONT_FALLBACK_FAMILIES = ['PingFang TC', 'Arial', 'Times New Roman', 'Ubuntu', 'Noto Sans'] as const;
export const FONT_CATEGORIES = ['serif', 'sans-serif', 'display', 'handwriting', 'monospace'] as const;

export type FontWeight = keyof typeof WEIGHT_TO_STYLE_MAP;
export type FontStyleName = (typeof WEIGHT_TO_STYLE_MAP)[FontWeight];
export type PostScriptStyleName = (typeof WEIGHT_TO_POSTSCRIPT_MAP)[FontWeight];
export type FontCategory = (typeof FONT_CATEGORIES)[number];
export type FallbackFamily = (typeof FONT_FALLBACK_FAMILIES)[number];

/**
 * Utility functions for font constant operations
 */

/**
 * Generate PostScript name for Google Fonts
 * @param family - Font family name (e.g., "Inter", "Roboto")
 * @param weight - Font weight (100-900)
 * @param italic - Whether the font is italic
 * @returns PostScript name (e.g., "Inter-Bold", "Inter-BoldItalic")
 */
export const generateGoogleFontPostScriptName = (family: string, weight: number, italic: boolean): string => {
  const cleanFamily = family.replace(/\s+/g, '');
  const weightStyle = WEIGHT_TO_POSTSCRIPT_MAP[weight as FontWeight] || 'Regular';
  const suffix = italic ? `${weightStyle}Italic` : weightStyle;

  return `${cleanFamily}-${suffix}`;
};

/**
 * Generate human-readable style name from weight and italic
 * @param weight - Font weight (100-900)
 * @param italic - Whether the font is italic
 * @returns Style name (e.g., "Bold", "Bold Italic", "Regular")
 */
export const generateStyleFromWeightAndItalic = (weight: number, italic: boolean): string => {
  const weightName = WEIGHT_TO_STYLE_MAP[weight as FontWeight] || 'Regular';

  return italic ? `${weightName} Italic` : weightName;
};

/**
 * Check if a PostScript name follows Google Font naming conventions
 * @param postscriptName - PostScript name to check
 * @returns Boolean indicating if it's a Google Font PostScript name
 */
export const isGoogleFontPostScriptName = (postscriptName: string): boolean => {
  if (!postscriptName) return false;

  // Check if it follows the pattern: FamilyName-VariantName
  const match = postscriptName.match(/^(.+?)-(.+)$/);

  if (!match) return false;

  const [, , variantPart] = match;

  // Check if variant part matches known PostScript style patterns
  const validVariants = [
    ...Object.values(WEIGHT_TO_POSTSCRIPT_MAP),
    ...Object.values(WEIGHT_TO_POSTSCRIPT_MAP).map((style) => `${style}Italic`),
  ];

  return validVariants.includes(variantPart);
};

/**
 * Extract font family from Google Font PostScript name
 * Converts compressed names back to display names with proper spacing
 * @param postscriptName - PostScript name (e.g., "OpenSans-Bold", "InterDisplay-SemiBoldItalic")
 * @returns Font family name (e.g., "Open Sans", "Inter Display") or null if invalid
 *
 * @example
 * extractFamilyFromPostScriptName("OpenSans-Regular") // "Open Sans"
 * extractFamilyFromPostScriptName("InterDisplay-SemiBoldItalic") // "Inter Display"
 * extractFamilyFromPostScriptName("RobotoMono-BoldItalic") // "Roboto Mono"
 */
export const extractFamilyFromPostScriptName = (postscriptName: string): null | string => {
  if (!isGoogleFontPostScriptName(postscriptName)) return null;

  // Split by hyphen and take all parts except the last one (which is the style)
  const parts = postscriptName.split('-');
  const familyPart = parts.slice(0, -1).join('-');

  return (
    familyPart
      // Add spaces before capital letters to restore proper family name
      .replace(/([A-Z])/g, ' $1')
      .trim()
  );
};

export const getWeightAndStyleFromVariant = (variant: string) =>
  match(variant)
    .with('regular', () => ({ style: 'Regular', weight: 400 }))
    .with('italic', () => ({ style: 'Italic', weight: 400 }))
    .with(P.string.endsWith('italic'), (v) => {
      const weight = Number.parseInt(v.replace('italic', ''), 10) as FontWeight;
      const style = WEIGHT_TO_STYLE_MAP[weight] || 'Italic';

      return { style: `${style} Italic`, weight };
    })
    .with(P.string.regex(/^\d+$/), (v) => {
      const weight = Number.parseInt(v, 10) as FontWeight;
      const style = WEIGHT_TO_STYLE_MAP[weight] || 'Regular';

      return { style, weight };
    })
    .otherwise(() => ({ style: 'Regular', weight: 400 }));

export const createGoogleFontObject = ({
  fontFamily,
  weight = 400,
  style = 'Regular',
  binaryLoader,
}: {
  binaryLoader: (fontFamily: string, weight?: number, style?: 'italic' | 'normal') => Promise<ArrayBuffer | null>;
  fontFamily: string;
  style?: string;
  weight?: number;
}): GoogleFont => {
  const italic = /italic/i.test(style);

  return {
    binaryLoader,
    family: fontFamily,
    italic,
    postscriptName: generateGoogleFontPostScriptName(fontFamily, weight, italic),
    source: 'google',
    style,
    weight,
  };
};
