import { prop } from 'remeda';

import localFontHelper from '@core/implementations/localFontHelper';
import type { GeneralFont } from '@core/interfaces/IFont';

import { loadAllInitialGoogleFonts } from './googleFontService';
import monotypeFonts from './monotypeFonts';
import webFonts from './webFonts';
import googleFonts from './webFonts.google';

/**
 * Orchestrates the initialization of all font types (local, Google, web fonts)
 * This function replaces the Google font initialization that was previously in fontHelper.ts
 * to break the circular dependency between fontHelper and googleFontService
 */
export const initializeAllFonts = (lang: string): GeneralFont[] => {
  // Get local fonts first
  const localFonts = localFontHelper.getAvailableFonts();
  const localFontFamilies = localFonts.map(prop('family'));

  // Initialize Google fonts with local font information for proper filtering
  loadAllInitialGoogleFonts(lang, localFontFamilies);

  // Get Google fonts (these will be loaded via CSS, not immediately available as objects)
  const googleLangFonts = googleFonts.getAvailableFonts(lang);

  // Get and apply web fonts
  const webLangFonts = webFonts.getAvailableFonts(lang);

  webFonts.applyStyle(webLangFonts);

  // Return the initial font set (local + predefined Google + web fonts)
  // Note: Dynamically loaded Google fonts are managed by the store separately
  return [...localFonts, ...googleLangFonts, ...webLangFonts];
};

/**
 * Extended initialization that includes Monotype fonts
 * This mirrors the functionality from fontHelper.ts but with proper orchestration
 */
export const initializeAllFontsWithMonotype = async (
  lang: string,
): Promise<{
  fonts: GeneralFont[];
  monotypeLoaded: boolean;
}> => {
  // Initialize base fonts
  const baseFonts = initializeAllFonts(lang);

  // Try to load Monotype fonts
  try {
    const monotypeResult = await monotypeFonts.getAvailableFonts(lang);

    if (monotypeResult) {
      const { monotypeLangFonts } = monotypeResult;

      return {
        fonts: [...baseFonts, ...monotypeLangFonts],
        monotypeLoaded: true,
      };
    }
  } catch (error) {
    console.warn('Failed to load Monotype fonts:', error);
  }

  return {
    fonts: baseFonts,
    monotypeLoaded: false,
  };
};
