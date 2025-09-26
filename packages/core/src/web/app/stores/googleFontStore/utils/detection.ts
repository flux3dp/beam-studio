/**
 * Font Detection Utilities
 *
 * @deprecated This file is being consolidated. Use consolidatedUtils.ts instead.
 * Re-exporting for backward compatibility.
 */

import localFontHelper from '@core/implementations/localFontHelper';

// Re-export most utilities from consolidated module
export {
  classifyFontCategory,
  isGoogleFont,
  isIconFont,
  isWebSafeFont,
  sanitizeFontFamily,
  validateFontFamily,
} from './consolidatedUtils';

// Keep local-specific function here as it requires local font helper
export const isLocalFont = (fontFamily: string): boolean => {
  const foundFont = localFontHelper.findFont({ family: fontFamily });

  if (foundFont && foundFont.family === fontFamily) {
    return true;
  }

  // Import consolidated utility
  const { isWebSafeFont } = require('./consolidatedUtils');

  if (isWebSafeFont(fontFamily)) {
    return true;
  }

  return false;
};
