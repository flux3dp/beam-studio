import { map, pipe } from 'remeda';

import FontFuncs from '@core/app/actions/beambox/font-funcs';

import { getWeightAndStyleFromVariant } from './fontUtils';
import { googleFontsApiCache } from './googleFontsApiCache';

export interface StyleOption {
  label: string;
  value: string;
}

/**
 * Given a font family name, returns the available style options.
 * Checks local fonts first, then falls back to Google Fonts.
 */
export const getStyleOptions = async (family: string): Promise<StyleOption[]> => {
  const localFonts = FontFuncs.requestFontsOfTheFontFamily(family);

  if (localFonts.length > 0) {
    return pipe(
      localFonts,
      map(({ style }) => ({ label: style, value: style })),
    );
  }

  try {
    const googleFontData = await googleFontsApiCache.findFont(family);

    if (googleFontData?.variants?.length) {
      return pipe(
        googleFontData.variants,
        map((variant) => {
          const { style } = getWeightAndStyleFromVariant(variant);

          return { label: style, value: style };
        }),
      );
    }
  } catch (error) {
    console.warn('Failed to fetch Google Font variants:', error);
  }

  return [];
};
