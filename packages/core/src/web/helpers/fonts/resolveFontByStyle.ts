import fontFuncs from '@core/app/actions/beambox/font-funcs';
import { useGoogleFontStore } from '@core/app/stores/googleFontStore';
import type { GeneralFont } from '@core/interfaces/IFont';

import { generateGoogleFontPostScriptName, getWeightAndStyleFromVariant } from './fontUtils';
import { googleFontsApiCache } from './googleFontsApiCache';

/**
 * Resolves a font by family and style, trying local fonts first then Google Fonts.
 * Returns null if no matching font is found.
 */
export const resolveFontByStyle = async (family: string, targetStyle: string): Promise<GeneralFont | null> => {
  // Try local fonts first
  const localFonts = fontFuncs.requestFontsOfTheFontFamily(family);
  const matchedLocal = localFonts.find((f) => f.style === targetStyle);

  if (matchedLocal) return matchedLocal;

  // Try Google Fonts
  try {
    const googleFontData = await googleFontsApiCache.findFont(family);

    if (!googleFontData?.variants) return null;

    const targetVariant = googleFontData.variants.find((variant) => {
      const { style } = getWeightAndStyleFromVariant(variant);

      return style === targetStyle;
    });

    if (!targetVariant) return null;

    const { italic, weight } = getWeightAndStyleFromVariant(targetVariant);
    const postscriptName = generateGoogleFontPostScriptName(family, weight, italic);
    const store = useGoogleFontStore.getState();

    store.registerGoogleFont(family);

    return {
      binaryLoader: store.loadGoogleFontBinary,
      family,
      italic,
      postscriptName,
      source: 'google' as const,
      style: targetStyle,
      weight,
    };
  } catch {
    return null;
  }
};
