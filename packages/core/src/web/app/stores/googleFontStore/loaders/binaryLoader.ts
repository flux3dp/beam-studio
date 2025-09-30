import { CACHE_EXPIRY_TIME, fetchWithRetry, MAX_RETRY_ATTEMPTS } from '@core/helpers/fonts/cacheUtils';
import { googleFontsApiCache } from '@core/helpers/fonts/googleFontsApiCache';

import { DEFAULT_FONT_WEIGHT } from '../constants';
import type { GoogleFontBinary, NetworkState } from '../types';
import { isIconFont } from '../utils/detection';
import { discoverAvailableVariants, findBestVariant } from '../utils/variants';

export const createBinaryLoader = (
  getCachedBinary: (fontFamily: string, weight?: number, style?: 'italic' | 'normal') => GoogleFontBinary | null,
  setCachedBinary: (
    fontFamily: string,
    weight: number,
    style: 'italic' | 'normal',
    buffer: ArrayBuffer,
    loadTime: number,
  ) => void,
  networkState: NetworkState,
) => {
  return async (
    fontFamily: string,
    weight = DEFAULT_FONT_WEIGHT,
    style: 'italic' | 'normal' = 'normal',
  ): Promise<ArrayBuffer | null> => {
    const startTime = Date.now();

    const cached = getCachedBinary(fontFamily, weight, style);

    if (cached) {
      if (Date.now() - cached.timestamp < CACHE_EXPIRY_TIME) {
        return cached.buffer;
      }
    }

    if (!networkState.isOnline) {
      return null;
    }

    try {
      const fontData = await googleFontsApiCache.findFont(fontFamily);

      if (!fontData) {
        throw new Error(`Font ${fontFamily} not found in Google Fonts API cache`);
      }

      if (isIconFont(fontFamily)) {
        return null;
      }

      const availableVariants = discoverAvailableVariants(fontData.variants);
      const variantKey = findBestVariant(availableVariants, weight, style);

      if (!variantKey) {
        console.warn(`No suitable variant found for ${fontFamily} (${weight}, ${style})`);

        return null;
      }

      const fontUrl = fontData.files?.[variantKey];

      if (!fontUrl) {
        return null;
      }

      const fontResponse = await fetchWithRetry(() => fetch(fontUrl as string), MAX_RETRY_ATTEMPTS);
      const ttfBuffer = await fontResponse.arrayBuffer();
      const loadTime = Date.now() - startTime;

      setCachedBinary(fontFamily, weight, style, ttfBuffer, loadTime);

      return ttfBuffer;
    } catch (error) {
      console.error(`Failed to load Google Font binary for ${fontFamily} ${weight} ${style}:`, error);

      return null;
    }
  };
};
