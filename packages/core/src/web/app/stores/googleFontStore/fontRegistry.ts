import { create } from 'zustand';

import { useStorageStore } from '@core/app/stores/storageStore';
import { createGoogleFontObject, getWeightAndStyleFromVariant } from '@core/helpers/fonts/fontUtils';
import { googleFontRegistry } from '@core/helpers/fonts/googleFontRegistry';
import { googleFontsApiCache } from '@core/helpers/fonts/googleFontsApiCache';
import type { GeneralFont } from '@core/interfaces/IFont';

import { FONT_HISTORY_MAX_SIZE } from './constants';
import { isWebSafeFont } from './utils/detection';
import { getFallbackFont, getFallbackPostScriptName } from './utils/fallbacks';

interface FontRegistryState {
  // Font history management
  addToHistory: (font: GeneralFont) => void;

  // Font utilities
  getFallbackFont: (googleFontFamily: string) => string;
  getFallbackPostScriptName: (fallbackFont: string) => string;
  getFontHistory: () => string[];

  getRegisteredFonts: () => string[];
  // Registry statistics
  getRegistryStats: () => {
    isInitialized: boolean;
    totalRegistered: number;
  };

  isRegistered: (fontFamily: string) => boolean;
  isWebSafeFont: (fontFamily: string) => boolean;
  // Registration tracking
  registeredFonts: Set<string>;

  // Registration operations
  registerGoogleFont: (fontFamily: string) => Promise<boolean>;
}

export const useFontRegistry = create<FontRegistryState>()((set, get) => ({
  // Font history management
  addToHistory: (font: GeneralFont) => {
    if (!font.family) return;

    const fontHistory = useStorageStore.getState()['font-history'] || [];
    const newHistory = fontHistory.filter((name) => name !== font.family);

    newHistory.unshift(font.family);

    if (newHistory.length > FONT_HISTORY_MAX_SIZE) {
      newHistory.pop();
    }

    useStorageStore.getState().set('font-history', newHistory);
  },

  // Font utilities
  getFallbackFont: (googleFontFamily: string) => {
    return getFallbackFont(googleFontFamily);
  },

  getFallbackPostScriptName: (fallbackFont: string) => {
    return getFallbackPostScriptName(fallbackFont);
  },

  getFontHistory: () => {
    return useStorageStore.getState()['font-history'] || [];
  },

  getRegisteredFonts: () => {
    return Array.from(get().registeredFonts);
  },

  // Registry statistics
  getRegistryStats: () => {
    const state = get();

    return {
      isInitialized: googleFontRegistry.isInitialized(),
      totalRegistered: state.registeredFonts.size,
    };
  },

  isRegistered: (fontFamily: string) => {
    return get().registeredFonts.has(fontFamily);
  },

  isWebSafeFont: (fontFamily: string) => {
    return isWebSafeFont(fontFamily);
  },

  // Registration tracking
  registeredFonts: new Set<string>(),

  // Registration operations
  registerGoogleFont: async (fontFamily: string) => {
    const state = get();

    if (state.registeredFonts.has(fontFamily)) {
      return true;
    }

    try {
      const fontData = await googleFontsApiCache.findFont(fontFamily);

      if (!fontData) {
        console.warn(`Font data not found for registration: ${fontFamily}`);

        return false;
      }

      const { style, weight } = getWeightAndStyleFromVariant(fontData.variants[0]);
      const googleFont = createGoogleFontObject({
        binaryLoader: async (family, w, s) => {
          // Import dynamically to avoid circular dependency
          const { useFontLoading } = await import('./fontLoading');

          return useFontLoading.getState().loadBinary(family, w, s);
        },
        fontFamily,
        style,
        weight,
      });

      const registered = googleFontRegistry.registerGoogleFont(googleFont);

      if (registered) {
        set((state) => ({
          registeredFonts: new Set(state.registeredFonts).add(fontFamily),
        }));

        return true;
      } else {
        console.warn(`Failed to register Google Font: ${fontFamily}`);

        return false;
      }
    } catch (error) {
      console.error(`Failed to register Google Font ${fontFamily}:`, error);

      return false;
    }
  },
}));
