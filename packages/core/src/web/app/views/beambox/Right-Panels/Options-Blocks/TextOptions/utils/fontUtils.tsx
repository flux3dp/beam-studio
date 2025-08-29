import React from 'react';

import { match } from 'ts-pattern';

import FontFuncs from '@core/app/actions/beambox/font-funcs';
import FluxIcons from '@core/app/icons/flux/FluxIcons';
import fontHelper from '@core/helpers/fonts/fontHelper';
import type { GeneralFont } from '@core/interfaces/IFont';

interface FontOption {
  family?: string;
  label: React.ReactNode;
  value: string;
}

/**
 * Creates a font family option with proper label and value
 */
export const createFontFamilyOption = (family: string, isHistory = false): FontOption => {
  const fontName = FontFuncs.fontNameMap.get(family);
  const displayName = fontName ?? family;
  const src = fontHelper.getWebFontPreviewUrl(family);

  const label = src ? (
    <div className="family-option">
      <div className="img-container">
        <img alt={displayName} draggable="false" src={src} />
      </div>
      {src.includes('monotype') && <FluxIcons.FluxPlus />}
    </div>
  ) : (
    <div style={{ fontFamily: `'${family}'`, maxHeight: 24 }}>{displayName}</div>
  );

  return isHistory ? { family, label, value: `history-${family}` } : { label, value: family };
};

/**
 * Checks if a font is local (has path property)
 */
export const isLocalFont = (font: GeneralFont): boolean => 'path' in font;

/**
 * Gets fallback font families in order of preference
 */
export const getFontFallbacks = (): string[] => ['PingFang TC', 'Arial', 'Times New Roman', 'Ubuntu', 'Noto Sans'];

/**
 * Finds the first available font family from a list of candidates
 */
export const findAvailableFont = (candidates: string[], availableFamilies: string[]): string | undefined => {
  return candidates.find((family) => availableFamilies.includes(family));
};

/**
 * Sanitizes a font family by finding an available fallback if needed
 */
export const sanitizeFontFamily = (
  font: GeneralFont,
  availableFamilies: string[],
): { isChanged: boolean; sanitizedFamily: string } => {
  const candidates = [font.family, ...getFontFallbacks()];
  const sanitizedFamily = findAvailableFont(candidates, availableFamilies);

  if (!sanitizedFamily) {
    throw new Error('No available font families found');
  }

  return {
    isChanged: sanitizedFamily !== font.family,
    sanitizedFamily,
  };
};

/**
 * Creates font style options from available fonts
 */
export const createFontStyleOptions = (family: string): FontOption[] => {
  return match(family)
    .when(
      (f) => f && FontFuncs.requestFontsOfTheFontFamily,
      (f) =>
        FontFuncs.requestFontsOfTheFontFamily(f)
          .map((font) => font.style)
          .map((style: string) => ({ label: style, value: style })),
    )
    .otherwise(() => []);
};

/**
 * Filters font options based on search input
 */
export const filterFontOptions = (input: string, family: string): boolean => {
  const searchKey = input.toLowerCase();

  if (family.toLowerCase().includes(searchKey)) {
    return true;
  }

  const fontName = FontFuncs.fontNameMap.get(family) || '';

  return fontName.toLowerCase().includes(searchKey);
};

/**
 * Creates history font family options
 */
export const createHistoryFontOptions = (fontHistory: string[], availableFamilies: string[]): FontOption[] => {
  return fontHistory
    .map((family) => (availableFamilies.includes(family) ? createFontFamilyOption(family, true) : null))
    .filter(Boolean) as FontOption[];
};
