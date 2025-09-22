/* eslint-disable perfectionist/sort-objects */
/**
 * Centralized font utilities, constants, and helper functions
 *
 * This module provides:
 * - Font weight and style mapping constants
 * - Google Font PostScript name generation and parsing
 * - Font detection and validation utilities
 * - Type definitions for font-related operations
 *
 * Ensures consistent font handling across the entire application.
 */

// Font weight to human-readable style name mapping
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

// Font weight to PostScript style suffix mapping (no spaces, camelCase)
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

// Reverse mapping for PostScript style names to weight numbers
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

// Font fallback families in order of preference
export const FONT_FALLBACK_FAMILIES = ['PingFang TC', 'Arial', 'Times New Roman', 'Ubuntu', 'Noto Sans'] as const;

// Common font categories for Google Fonts
export const FONT_CATEGORIES = ['serif', 'sans-serif', 'display', 'handwriting', 'monospace'] as const;

// Type definitions for better type safety
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
 * Parse PostScript variant suffix to extract weight and italic information
 * @param variantPart - PostScript suffix (e.g., "Bold", "BoldItalic", "Regular")
 * @returns Object with weight and italic properties
 */
export const parsePostScriptVariant = (variantPart: string): { italic: boolean; weight: number } => {
  let weight = 400;
  let italic = false;

  if (variantPart.endsWith('Italic')) {
    italic = true;

    const weightPart = variantPart.replace('Italic', '');

    weight = POSTSCRIPT_TO_WEIGHT_MAP[weightPart as PostScriptStyleName] || 400;
  } else {
    weight = POSTSCRIPT_TO_WEIGHT_MAP[variantPart as PostScriptStyleName] || 400;
  }

  return { weight, italic };
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
