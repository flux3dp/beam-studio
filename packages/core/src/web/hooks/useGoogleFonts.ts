import { useCallback } from 'react';

import { useStorageStore } from '@core/app/stores/storageStore';

import { useGoogleFontStore } from '../stores/googleFontStore';

/**
 * Simplified Google Fonts hook that provides easy migration from the old complex hook
 * Returns the main actions and state needed by components
 */
export const useGoogleFonts = () => {
  // Get font history from storage store (existing pattern)
  const fontHistory = useStorageStore((state) => state['font-history']);

  // Get store actions and state
  const {
    addToHistory,
    cachedBinaries,
    clearBinaryCache,
    isGoogleFontLoaded,
    isGoogleFontLoading,
    isGoogleFontRegistered,
    loadGoogleFont,
    loadGoogleFontBinary,
    registerGoogleFont,
    sessionLoadedFonts,
  } = useGoogleFontStore();

  // Proactively load history fonts (simplified version of original logic)
  const proactivelyLoadHistoryFonts = useCallback(() => {
    if (fontHistory && fontHistory.length > 0) {
      fontHistory.forEach((family) => {
        // Only load if not already loaded
        if (!isGoogleFontLoaded(family)) {
          loadGoogleFont(family);
        }
      });
    }
  }, [fontHistory, isGoogleFontLoaded, loadGoogleFont]);

  // Load Google Font CSS (alias for store method)
  const loadGoogleFontCSS = useCallback(
    (fontFamily: string) => {
      return loadGoogleFont(fontFamily);
    },
    [loadGoogleFont],
  );

  // Load Google Font unified (alias for store method with registration)
  const loadGoogleFontUnified = useCallback(
    (fontFamily: string) => {
      // Load CSS first, then register
      loadGoogleFont(fontFamily).then(() => {
        registerGoogleFont(fontFamily);
      });
    },
    [loadGoogleFont, registerGoogleFont],
  );

  const cleanupGoogleFontBinaries = useCallback(() => {
    clearBinaryCache();
  }, [clearBinaryCache]);

  return {
    addToHistory,
    cachedBinaries,
    cleanupGoogleFontBinaries,
    isGoogleFontLoaded,
    isGoogleFontLoading,
    isGoogleFontRegistered,
    loadGoogleFontBinary,
    loadGoogleFontCSS,
    loadGoogleFontUnified,
    proactivelyLoadHistoryFonts,
    sessionLoadedFonts,
  };
};

/**
 * Hook for loaded Google Fonts state only
 * Optimized for components that only need to know which fonts are loaded
 */
export const useLoadedGoogleFonts = () => useGoogleFontStore((state) => state.sessionLoadedFonts);

/**
 * Hook for registered Google Fonts state only
 * Optimized for components that only need registration status
 */
export const useRegisteredGoogleFonts = () => useGoogleFontStore((state) => state.registeredFonts);

/**
 * Hook for Google Font loading state only
 * Optimized for components that need to show loading indicators
 */
export const useLoadingGoogleFonts = () => useGoogleFontStore((state) => state.loadingFonts);

/**
 * Hook for Google Font actions only
 * Optimized for components that only perform actions without state
 */
export const useGoogleFontActions = () =>
  useGoogleFontStore((state) => ({
    addToHistory: state.addToHistory,
    clearBinaryCache: state.clearBinaryCache,
    loadGoogleFont: state.loadGoogleFont,
    loadGoogleFontBinary: state.loadGoogleFontBinary,
    registerGoogleFont: state.registerGoogleFont,
  }));

/**
 * Hook for Google Font getters only
 * Optimized for components that only need to query state
 */
export const useGoogleFontGetters = () =>
  useGoogleFontStore((state) => ({
    getBinaryFromCache: state.getBinaryFromCache,
    getLoadedFonts: state.getLoadedFonts,
    getRegisteredFonts: state.getRegisteredFonts,
    isGoogleFontLoaded: state.isGoogleFontLoaded,
    isGoogleFontLoading: state.isGoogleFontLoading,
    isGoogleFontRegistered: state.isGoogleFontRegistered,
  }));

/**
 * Hook for Google Font history
 * Uses existing storage store pattern for consistency
 */
export const useGoogleFontHistory = () => {
  const fontHistory = useStorageStore((state) => state['font-history']);

  return fontHistory || [];
};

/**
 * Hook for binary cache state only
 * Optimized for components that work with font binaries
 */
export const useGoogleFontBinaryCache = () => useGoogleFontStore((state) => state.cachedBinaries);

/**
 * Custom hook for font loading with loading state
 * Returns loading state and load function for a specific font
 */
export const useGoogleFontLoader = (fontFamily?: string) => {
  const isLoading = useGoogleFontStore((state) => (fontFamily ? state.isGoogleFontLoading(fontFamily) : false));
  const isLoaded = useGoogleFontStore((state) => (fontFamily ? state.isGoogleFontLoaded(fontFamily) : false));
  const loadFont = useGoogleFontStore((state) => state.loadGoogleFont);

  const loadGoogleFont = useCallback(
    (family?: string) => {
      const targetFamily = family || fontFamily;

      if (targetFamily) {
        return loadFont(targetFamily);
      }

      return Promise.resolve();
    },
    [loadFont, fontFamily],
  );

  return {
    isLoaded,
    isLoading,
    loadGoogleFont,
  };
};

/**
 * Custom hook for font registration with registration state
 * Returns registration state and register function for a specific font
 */
export const useGoogleFontRegistration = (fontFamily?: string) => {
  const isRegistered = useGoogleFontStore((state) => (fontFamily ? state.isGoogleFontRegistered(fontFamily) : false));
  const registerFont = useGoogleFontStore((state) => state.registerGoogleFont);

  const registerGoogleFont = useCallback(
    (family?: string) => {
      const targetFamily = family || fontFamily;

      if (targetFamily) {
        registerFont(targetFamily);
      }
    },
    [registerFont, fontFamily],
  );

  return {
    isRegistered,
    registerGoogleFont,
  };
};

export default useGoogleFonts;
