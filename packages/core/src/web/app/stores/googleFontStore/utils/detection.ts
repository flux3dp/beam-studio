import localFontHelper from '@core/implementations/localFontHelper';

import { ICON_FONT_KEYWORDS, WEB_SAFE_FONTS } from '../constants';

export const isIconFont = (fontFamily: string): boolean => {
  const lowerName = fontFamily.toLowerCase();

  return ICON_FONT_KEYWORDS.some((keyword) => lowerName.includes(keyword));
};

export const isWebSafeFont = (fontFamily: string): boolean => {
  const normalizedFamily = fontFamily.toLowerCase().trim();

  return WEB_SAFE_FONTS.some((webSafeFont) => normalizedFamily === webSafeFont.toLowerCase());
};

export const isLocalFont = (fontFamily: string): boolean => {
  const foundFont = localFontHelper.findFont({ family: fontFamily });

  if (foundFont && foundFont.family === fontFamily) {
    return true;
  }

  if (isWebSafeFont(fontFamily)) {
    return true;
  }

  return false;
};
