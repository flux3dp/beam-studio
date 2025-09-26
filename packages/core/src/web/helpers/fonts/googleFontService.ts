import { match, P } from 'ts-pattern';

import { useStorageStore } from '@core/app/stores/storageStore';
import localFontHelper from '@core/implementations/localFontHelper';

import { useGoogleFontStore } from '../../app/stores/googleFontStore';

import { generateGoogleFontPostScriptName, generateStyleFromWeightAndItalic } from './fontUtils';
import googleFonts from './webFonts.google';

/**
 * Load static Google Fonts (predefined web fonts) with CSS only
 */
const loadStaticGoogleFonts = (lang: string): void => {
  const googleLangFonts = googleFonts.getAvailableFonts(lang);

  // Apply CSS styles (existing static font loading)
  googleFonts.applyStyle(googleLangFonts);

  // Track static fonts as loaded in the store
  googleLangFonts.forEach(({ family }) => {
    if (family) {
      // Directly update store state for static fonts (bypass filtering)
      const state = useGoogleFontStore.getState();

      useGoogleFontStore.setState({ sessionLoadedFonts: new Set(state.sessionLoadedFonts).add(family) });
    }
  });
};

/**
 * Normalize font family names for robust comparison
 * Handles various font name formats and edge cases
 */
const normalizeFontName = (fontName: string): string =>
  fontName
    .toLowerCase()
    .trim()
    .replace(/^['"]+|['"]+$/g, '') // Remove surrounding quotes
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .trim();

/**
 * Enhanced local font detection using localFontHelper
 * This leverages the same sophisticated font detection logic that fontHelper uses
 */
const isLocalFont = (fontFamily: string): boolean => {
  const foundFont = localFontHelper.findFont({ family: fontFamily });

  if (foundFont && foundFont.family === fontFamily) {
    return true;
  }

  // Additional check: get all available local fonts and do normalized comparison
  const localFonts = localFontHelper.getAvailableFonts();
  const normalizedTarget = normalizeFontName(fontFamily);
  const directMatch = localFonts.some((font) => normalizeFontName(font.family) === normalizedTarget);

  if (directMatch) {
    return true;
  }

  return false;
};

/**
 * Clean Google Fonts from font history when offline to prevent future loading attempts
 * Keeps only local and web-safe fonts in the history
 */
const cleanGoogleFontsFromHistory = (fontHistory: string[]): void => {
  const fontStore = useGoogleFontStore.getState();
  const cleanedHistory = fontHistory.filter((family) => isLocalFont(family) || fontStore.isWebSafeFont(family));

  if (cleanedHistory.length !== fontHistory.length) {
    useStorageStore.getState().set('font-history', cleanedHistory);
  }
};

/**
 * Load Google Fonts from font history when online, skip and clean history when offline
 */
const loadHistoryGoogleFonts = (): void => {
  const fontHistory = useStorageStore.getState()['font-history'];

  if (!fontHistory || !Array.isArray(fontHistory) || fontHistory.length === 0) {
    return;
  }

  const fontStore = useGoogleFontStore.getState();
  const networkAvailable = fontStore.isNetworkAvailableForGoogleFonts();

  if (!networkAvailable) {
    cleanGoogleFontsFromHistory(fontHistory);

    return;
  }

  const googleFontsFromHistory = fontHistory.filter((family) => !isLocalFont(family));

  if (googleFontsFromHistory.length === 0) {
    return;
  }

  googleFontsFromHistory.forEach((family) => {
    fontStore.loadGoogleFont(family);
  });
};

/**
 * Replace Google Fonts with web-safe fallbacks in SVG text elements
 */
const applyGoogleFontFallbacks = (textElements: SVGTextElement[], store: any): void => {
  let fallbackCount = 0;
  const replacements: Array<{ from: string; to: string }> = [];

  textElements.forEach((textElem) => {
    const fontFamily = textElem.getAttribute('font-family');

    if (fontFamily) {
      const cleanFamily = fontFamily.replace(/^['"]+|['"]+$/g, '').trim();

      if (store.isWebSafeFont(cleanFamily) || isLocalFont(cleanFamily)) {
        return;
      }

      const fallbackFont = store.getFallbackFont(cleanFamily);
      const fallbackPostScriptName = store.getFallbackPostScriptName(fallbackFont);

      textElem.setAttribute('font-family', fallbackFont);

      const postScriptName = textElem.getAttribute('font-postscript-name');

      if (postScriptName) {
        textElem.setAttribute('font-postscript-name', fallbackPostScriptName);
      }

      const dataPostScriptName = textElem.getAttribute('data-postscript-name');

      if (dataPostScriptName) {
        textElem.setAttribute('data-postscript-name', fallbackPostScriptName);
      }

      const allAttributes = textElem.attributes;

      for (const attr of allAttributes) {
        if (
          attr.name.toLowerCase().includes('postscript') &&
          attr.name !== 'font-postscript-name' &&
          attr.name !== 'data-postscript-name'
        ) {
          textElem.setAttribute(attr.name, fallbackPostScriptName);
        }
      }

      const existingReplacement = replacements.find((r) => r.from === cleanFamily);

      if (!existingReplacement) {
        replacements.push({ from: cleanFamily, to: fallbackFont });
      }

      fallbackCount++;
    }
  });

  if (fallbackCount > 0) {
    console.log(`Applied ${fallbackCount} Google Font fallbacks during offline import`);
  }
};

/**
 * Load Google Fonts from document context or apply fallbacks when offline
 */
export const loadContextGoogleFonts = (): void => {
  try {
    const store = useGoogleFontStore.getState();
    const textElements = [
      ...document.querySelectorAll('#svgcontent g.layer:not([display="none"]) text'),
      ...document.querySelectorAll('#svg_defs text'),
    ] as SVGTextElement[];
    const networkAvailable = store.isNetworkAvailableForGoogleFonts();

    if (!networkAvailable) {
      applyGoogleFontFallbacks(textElements, store);

      return;
    }

    if (textElements.length === 0) {
      return;
    }

    const fontVariantsInContext = new Map<
      string,
      { family: string; italic: boolean; postscriptName: string; style: string; weight: number }
    >();

    textElements.forEach((textElem) => {
      const fontFamily = textElem.getAttribute('font-family');

      if (fontFamily) {
        const cleanFamily = fontFamily.replace(/^['"]+|['"]+$/g, '').trim();

        // Skip if it's a local font using enhanced detection
        if (isLocalFont(cleanFamily)) {
          return;
        }

        // Extract font properties
        const fontWeightAttr = textElem.getAttribute('font-weight');
        const fontStyleAttr = textElem.getAttribute('font-style');
        const postscriptNameAttr = textElem.getAttribute('font-postscript-name');
        // Parse weight (default to 400 if not specified)
        const weight = match(fontWeightAttr)
          .with(P.union('normal', P.nullish), () => 400)
          .with('bold', () => 700)
          .otherwise((fontWeight) => {
            const num = Number.parseInt(fontWeight, 10);

            return Number.isNaN(num) ? 400 : num;
          });
        const italic = fontStyleAttr === 'italic' || fontStyleAttr === 'oblique';
        const postscriptName = postscriptNameAttr || generateGoogleFontPostScriptName(cleanFamily, weight, italic);
        const style = generateStyleFromWeightAndItalic(weight, italic);

        // Use PostScript name as unique key to avoid duplicates
        fontVariantsInContext.set(postscriptName, { family: cleanFamily, italic, postscriptName, style, weight });
      }
    });

    if (fontVariantsInContext.size === 0) {
      return;
    }

    Array.from(fontVariantsInContext.values()).forEach(({ family }) => {
      // Load the font family CSS if not already loaded
      if (!store.isGoogleFontLoaded(family)) {
        store.loadGoogleFont(family);
      }

      store.registerGoogleFont(family);
    });
  } catch (error) {
    console.warn('Failed to scan document context for Google Fonts:', error);
  }
};

/**
 * Comprehensive Google Fonts loading for app initialization
 * Includes cache warming to handle force refresh scenarios
 */
export const loadAllInitialGoogleFonts = (lang: string, _availableFontFamilies: string[]): void => {
  // Load static Google Fonts CSS only
  loadStaticGoogleFonts(lang);
  // Load Google Fonts from history CSS only
  loadHistoryGoogleFonts();
  // Load Google Fonts from current document context CSS only
  loadContextGoogleFonts();
};
