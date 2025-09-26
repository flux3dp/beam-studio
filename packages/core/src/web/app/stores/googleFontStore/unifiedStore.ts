import { create } from 'zustand';

import { googleFontsApiCache } from '@core/helpers/fonts/googleFontsApiCache';
import type { GeneralFont } from '@core/interfaces/IFont';

import { useFontCache } from './fontCache';
import { useFontLoading } from './fontLoading';
import { useFontRegistry } from './fontRegistry';
import { useNetworkState } from './networkState';
import type { FontLoadOptions } from './types';

/**
 * Unified Google Font Store Interface
 *
 * This provides a simplified, consolidated interface to the focused font stores.
 * It acts as a facade pattern, delegating operations to the appropriate focused stores.
 */
interface UnifiedGoogleFontState {
  addToHistory: (font: GeneralFont) => void;
  cleanupUnusedCSSLinks: (maxAge?: number) => void;
  clearBinaryCache: () => void;
  // Cache operations (delegates to fontCache store)
  getBinaryFromCache: (fontFamily: string, weight?: number, style?: 'italic' | 'normal') => any;
  // Utility methods (delegates to fontRegistry store)
  getFallbackFont: (googleFontFamily: string) => string;

  getFallbackPostScriptName: (fallbackFont: string) => string;
  getLoadedFonts: () => string[];

  getRegisteredFonts: () => string[];
  // Status checks (delegates to appropriate stores)
  isGoogleFontLoaded: (fontFamily: string) => boolean;
  isGoogleFontLoading: (fontFamily: string) => boolean;
  isGoogleFontRegistered: (fontFamily: string) => boolean;
  isNetworkAvailableForGoogleFonts: () => boolean;

  isWebSafeFont: (fontFamily: string) => boolean;
  // Loading operations (delegates to fontLoading store)
  loadGoogleFont: (fontFamily: string) => Promise<void>;
  loadGoogleFontBinary: (
    fontFamily: string,
    weight?: number,
    style?: 'italic' | 'normal',
  ) => Promise<ArrayBuffer | null>;

  loadGoogleFontForPreview: (fontFamily: string) => Promise<void>;
  loadGoogleFontForTextEditing: (fontFamily: string) => Promise<void>;
  loadGoogleFontWithOptions: (options: FontLoadOptions) => Promise<void>;
  // Processing queue (delegates to fontLoading store)
  processQueue: () => void;

  // Registration operations (delegates to fontRegistry store)
  registerGoogleFont: (fontFamily: string) => Promise<void>;

  // Retry functionality (delegates to fontLoading store)
  retryFailedFont: (fontFamily: string) => Promise<void>;

  // Network operations (delegates to networkState store)
  updateNetworkState: () => void;
}

export const useGoogleFontStore = create<UnifiedGoogleFontState>()(() => ({
  addToHistory: (font: GeneralFont) => {
    useFontRegistry.getState().addToHistory(font);
  },

  cleanupUnusedCSSLinks: (maxAge?: number) => {
    useFontCache.getState().cleanupUnusedCSSLinks(maxAge);
  },

  clearBinaryCache: () => {
    useFontCache.getState().clearBinaryCache();
  },

  // Cache operations - delegate to fontCache store
  getBinaryFromCache: (fontFamily: string, weight?: number, style?: 'italic' | 'normal') => {
    return useFontCache.getState().getBinaryFromCache(fontFamily, weight, style);
  },

  // Utility methods - delegate to fontRegistry store
  getFallbackFont: (googleFontFamily: string) => {
    return useFontRegistry.getState().getFallbackFont(googleFontFamily);
  },

  getFallbackPostScriptName: (fallbackFont: string) => {
    return useFontRegistry.getState().getFallbackPostScriptName(fallbackFont);
  },

  getLoadedFonts: () => {
    return Array.from(useFontLoading.getState().sessionLoadedFonts);
  },

  getRegisteredFonts: () => {
    return useFontRegistry.getState().getRegisteredFonts();
  },

  // Status checks - delegate to appropriate stores
  isGoogleFontLoaded: (fontFamily: string) => {
    return useFontLoading.getState().isLoaded(fontFamily);
  },

  isGoogleFontLoading: (fontFamily: string) => {
    return useFontLoading.getState().isLoading(fontFamily);
  },

  isGoogleFontRegistered: (fontFamily: string) => {
    return useFontRegistry.getState().isRegistered(fontFamily);
  },

  isNetworkAvailableForGoogleFonts: () => {
    return useNetworkState.getState().isOnlineForGoogleFonts();
  },

  isWebSafeFont: (fontFamily: string) => {
    return useFontRegistry.getState().isWebSafeFont(fontFamily);
  },

  // Loading operations - delegate to fontLoading store
  loadGoogleFont: async (fontFamily: string) => {
    return useFontLoading.getState().loadForTextEditing(fontFamily);
  },

  loadGoogleFontBinary: async (fontFamily: string, weight?: number, style?: 'italic' | 'normal') => {
    return useFontLoading.getState().loadBinary(fontFamily, weight, style);
  },

  loadGoogleFontForPreview: async (fontFamily: string) => {
    return useFontLoading.getState().loadForPreview(fontFamily);
  },

  loadGoogleFontForTextEditing: async (fontFamily: string) => {
    return useFontLoading.getState().loadForTextEditing(fontFamily);
  },

  loadGoogleFontWithOptions: async (options: FontLoadOptions) => {
    const { fontFamily, forceReload = false, priority = 'normal', purpose } = options;

    return useFontLoading.getState().loadFont(fontFamily, { forceReload, priority, purpose });
  },

  // Processing queue - delegate to fontLoading store
  processQueue: () => {
    useFontLoading.getState().processQueue();
  },

  // Registration operations - delegate to fontRegistry store
  registerGoogleFont: async (fontFamily: string) => {
    await useFontRegistry.getState().registerGoogleFont(fontFamily);
  },

  // Retry functionality - delegate to fontLoading store
  retryFailedFont: async (fontFamily: string) => {
    return useFontLoading.getState().retryFailedFont(fontFamily);
  },

  // Network operations - delegate to networkState store
  updateNetworkState: () => {
    useNetworkState.getState().updateNetworkState();
  },
}));

// Initialize the unified store with existing functionality
if (typeof window !== 'undefined') {
  // Pre-populate the Google Fonts cache during initialization
  googleFontsApiCache
    .getCache()
    .then(() => {
      console.log('✅ Google Fonts cache pre-populated successfully during unified store initialization');
    })
    .catch((error) => {
      console.warn('⚠️ Google Fonts cache pre-population failed, font loading will use fallbacks:', error);
    });
}
