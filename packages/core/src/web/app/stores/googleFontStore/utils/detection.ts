import localFontHelper from '@core/implementations/localFontHelper';

import { ICON_FONT_KEYWORDS, WEB_SAFE_FONTS } from '../constants';

/**
 * Normalize font family names for robust comparison
 * Handles various font name formats and edge cases
 */
const normalizeFontName = (fontName: string): string =>
  fontName
    .toLowerCase()
    .trim()
    .replace(/^['"]+|['"]+$/g, '') // Remove surrounding quotes
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .trim();

const isWebSafeFont = (fontFamily: string): boolean => {
  const normalizedFamily = fontFamily.toLowerCase().trim();

  return WEB_SAFE_FONTS.some((webSafeFont) => normalizedFamily === webSafeFont.toLowerCase());
};

export const isIconFont = (fontFamily: string): boolean => {
  const lowerName = fontFamily.toLowerCase();

  return ICON_FONT_KEYWORDS.some((keyword) => lowerName.includes(keyword));
};

export const isLocalFont = (fontFamily: string): boolean => {
  const foundFont = localFontHelper.findFont({ family: fontFamily });

  if (foundFont && foundFont.family === fontFamily) {
    return true;
  }

  if (isWebSafeFont(fontFamily)) {
    return true;
  }

  // Additional check: get all available local fonts and do normalized comparison
  const localFonts = localFontHelper.getAvailableFonts();
  const normalizedTarget = normalizeFontName(fontFamily);
  const directMatch = localFonts.some((font) => normalizeFontName(font.family) === normalizedTarget);

  if (directMatch) {
    return true;
  }

  return false;
};
