import { useStorageStore } from '@core/app/stores/storageStore';
import type { GeneralFont } from '@core/interfaces/IFont';

import { useGoogleFontStore } from '../../app/stores/googleFontStore';

import { extractFamilyFromPostScriptName } from './googleFontDetector';
import { googleFontRegistry } from './googleFontRegistry';
import googleFonts from './webFonts.google';

// Module-level cache for available font families, updated during app initialization
let cachedAvailableFontFamilies: string[] = [];

// Direct access to the store for non-React usage
const getGoogleFontStore = () => useGoogleFontStore.getState();

/**
 * Load static Google Fonts (predefined web fonts) with CSS only
 * Maintains backward compatibility with existing static font loading
 */
export const loadStaticGoogleFonts = (lang: string): void => {
  const googleLangFonts = googleFonts.getAvailableFonts(lang);

  // Apply CSS styles (existing static font loading)
  googleFonts.applyStyle(googleLangFonts);

  // Track static fonts as loaded in the store
  googleLangFonts.forEach((font) => {
    if (font.family) {
      // Directly update store state for static fonts (bypass filtering)
      const state = useGoogleFontStore.getState();

      useGoogleFontStore.setState({
        sessionLoadedFonts: new Set(state.sessionLoadedFonts).add(font.family),
      });
    }
  });
};

/**
 * Load Google Fonts from font history with CSS only
 * Uses the new store system while maintaining existing behavior
 */
export const loadHistoryGoogleFonts = (availableFontFamilies: string[]): void => {
  const fontHistory = useStorageStore.getState()['font-history'];

  if (fontHistory.length === 0) {
    return;
  }

  // Filter history to only include fonts that are NOT available locally
  const googleFontsFromHistory = fontHistory.filter((family) => {
    const familyLower = family.toLowerCase();

    return !availableFontFamilies.some((f) => f.toLowerCase() === familyLower);
  });

  if (googleFontsFromHistory.length === 0) {
    return;
  }

  // Load CSS using the store
  const store = getGoogleFontStore();

  googleFontsFromHistory.forEach((family) => {
    store.loadGoogleFont(family);
  });
};

/**
 * Scan current document context for Google Fonts being used by text elements
 * This ensures that Google Fonts in loaded files get their CSS loaded
 */
export const loadContextGoogleFonts = (availableFontFamilies: string[] = cachedAvailableFontFamilies): void => {
  try {
    const store = getGoogleFontStore();
    // Use the same pattern as convertToPath.ts to get all visible text elements
    const textElements = [
      ...document.querySelectorAll('#svgcontent g.layer:not([display="none"]) text'),
      ...document.querySelectorAll('#svg_defs text'),
    ] as SVGTextElement[];

    if (textElements.length === 0) {
      return;
    }

    const fontFamiliesInContext = new Set<string>();

    textElements.forEach((textElem) => {
      const fontFamily = textElem.getAttribute('font-family');

      if (fontFamily) {
        // Clean up font family (remove quotes, normalize)
        const cleanFontFamily = fontFamily.replace(/^['"]+|['"]+$/g, '').trim();

        if (cleanFontFamily) {
          fontFamiliesInContext.add(cleanFontFamily);
        }
      }
    });

    // Filter for Google Fonts that are NOT available locally and NOT already loaded
    const googleFontsFromContext = Array.from(fontFamiliesInContext).filter((family) => {
      const familyLower = family.toLowerCase();

      // Skip if it's a local font
      if (availableFontFamilies.some((f) => f.toLowerCase() === familyLower)) {
        return false;
      }

      // Skip if already loaded in this session
      if (store.isGoogleFontLoaded(family)) {
        return false;
      }

      // Include all non-local fonts as potential Google Fonts
      return true;
    });

    if (googleFontsFromContext.length === 0) {
      return;
    }

    googleFontsFromContext.forEach((family) => {
      store.loadGoogleFont(family);
    });
  } catch (error) {
    console.warn('Failed to scan document context for Google Fonts:', error);
  }
};

/**
 * Lazy registration: Create and register GoogleFont if CSS is already loaded
 * Enhanced version that uses the store system
 * Returns the GoogleFont object if successfully registered, null otherwise
 */
export const lazyRegisterGoogleFontIfLoaded = (postscriptName: string): GeneralFont | null => {
  const fontFamily = extractFamilyFromPostScriptName(postscriptName);

  if (!fontFamily) {
    return null;
  }

  const store = getGoogleFontStore();

  // Check if already registered in the store
  if (store.isGoogleFontRegistered(fontFamily)) {
    // Return the registered font from the registry
    const registeredFont = googleFontRegistry.getRegisteredFont(postscriptName);

    if (registeredFont) {
      return registeredFont;
    }
  }

  // Check if already registered in the registry
  if (googleFontRegistry.isRegistered(postscriptName)) {
    // Sync with store state
    useGoogleFontStore.setState({
      registeredFonts: new Set(store.registeredFonts).add(fontFamily),
    });

    // Return the registered font from the registry
    const registeredFont = googleFontRegistry.getRegisteredFont(postscriptName);

    if (registeredFont) {
      return registeredFont;
    }
  }

  // Check if CSS is already loaded (from early loading or history)
  if (store.isGoogleFontLoaded(fontFamily)) {
    // Register using the store (this creates the GoogleFont object with binaryLoader)
    store.registerGoogleFont(fontFamily);

    // Verify registration succeeded and return the font object
    if (store.isGoogleFontRegistered(fontFamily)) {
      const registeredFont = googleFontRegistry.getRegisteredFont(postscriptName);

      if (registeredFont) {
        return registeredFont;
      }
    }
  }

  return null;
};

/**
 * Comprehensive Google Fonts loading for app initialization
 * Uses the Zustand store directly for all operations
 */
export const loadAllInitialGoogleFonts = (lang: string, availableFontFamilies: string[]): void => {
  // Cache the available font families for use by other functions
  cachedAvailableFontFamilies = availableFontFamilies;

  // Load static Google Fonts CSS only
  loadStaticGoogleFonts(lang);
  // Load Google Fonts from history CSS only
  loadHistoryGoogleFonts(availableFontFamilies);
  // Load Google Fonts from current document context CSS only
  loadContextGoogleFonts(availableFontFamilies);
};

// Re-export from detector module for backward compatibility
export { extractFamilyFromPostScriptName } from './googleFontDetector';

// Export direct store access for non-React usage
export { getGoogleFontStore };
