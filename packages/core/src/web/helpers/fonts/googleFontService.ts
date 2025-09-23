import { registerGoogleFont } from '@core/app/actions/beambox/font-funcs';
import { useStorageStore } from '@core/app/stores/storageStore';
import localFontHelper from '@core/implementations/localFontHelper';
import type { GeneralFont, GoogleFont } from '@core/interfaces/IFont';

import { useGoogleFontStore } from '../../app/stores/googleFontStore';

import {
  extractFamilyFromPostScriptName,
  generateGoogleFontPostScriptName,
  generateStyleFromWeightAndItalic,
  POSTSCRIPT_TO_WEIGHT_MAP,
  type PostScriptStyleName,
} from './fontUtils';
import { googleFontRegistry } from './googleFontRegistry';
import googleFonts from './webFonts.google';

const createGoogleFontObject = (
  family: string,
  weight: number,
  italic: boolean,
  style: string,
  binaryLoader: (family: string) => Promise<ArrayBuffer | null>,
): GoogleFont => ({
  binaryLoader,
  family,
  italic,
  postscriptName: generateGoogleFontPostScriptName(family, weight, italic),
  source: 'google' as const,
  style,
  weight,
});

// Note: Previously used module-level cache removed since localFontHelper is now used directly

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
const normalizeFontName = (fontName: string): string => {
  return fontName
    .toLowerCase()
    .trim()
    .replace(/^['"]+|['"]+$/g, '') // Remove surrounding quotes
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .trim();
};

/**
 * Enhanced local font detection using localFontHelper
 * This leverages the same sophisticated font detection logic that fontHelper uses
 */
const isLocalFont = (fontFamily: string): boolean => {
  // Use localFontHelper's findFont method to check if the font exists locally
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

  // Check for common local font patterns (keep this as fallback)
  const localFontPatterns = [
    /^(arial|times|helvetica|verdana|trebuchet|comic|georgia|impact|tahoma|palatino)/i,
    /^(system|ui-)/i, // System UI fonts
    /^(sf|new york|avenir|hiragino|pingfang|noto)/i, // Common system fonts
    /^(al |arabic|hebrew|thai|chinese|japanese|korean)/i, // Non-Latin fonts
    /nf$/i, // Nerd Fonts pattern (like AirstreamNF)
  ];

  const isKnownLocalPattern = localFontPatterns.some((pattern) => pattern.test(fontFamily));

  if (isKnownLocalPattern) {
    console.log(`🔍 Detected local font pattern: ${fontFamily}`);

    return true;
  }

  return false;
};

/**
 * Load Google Fonts from font history with CSS only
 * Enhanced with robust local font filtering to prevent processing local fonts as Google Fonts
 */
const loadHistoryGoogleFonts = (): void => {
  const fontHistory = useStorageStore.getState()['font-history'];

  if (!fontHistory || !Array.isArray(fontHistory) || fontHistory.length === 0) {
    return;
  }

  console.log(`🔍 Processing font history: ${fontHistory.length} fonts`);

  // Enhanced filtering to exclude local fonts using localFontHelper
  const googleFontsFromHistory = fontHistory.filter((family) => {
    const isLocal = isLocalFont(family);

    if (isLocal) {
      console.log(`🚫 Skipping local font from history: ${family}`);

      return false;
    }

    console.log(`✅ Including potential Google Font from history: ${family}`);

    return true;
  });

  if (googleFontsFromHistory.length === 0) {
    console.log(`🔍 No Google Fonts found in history after filtering`);

    return;
  }

  console.log(
    `🔍 Loading ${googleFontsFromHistory.length} Google Fonts from history: ${googleFontsFromHistory.join(', ')}`,
  );

  // Load CSS using the store
  const store = useGoogleFontStore.getState();

  googleFontsFromHistory.forEach((family) => {
    store.loadGoogleFont(family);
  });
};

/**
 * Scan current document context for Google Fonts being used by text elements
 * Enhanced to handle specific font variants (Bold, Italic) with proper PostScript names
 * This ensures that Google Fonts in loaded files get their CSS loaded and variants registered
 */
export const loadContextGoogleFonts = (): void => {
  try {
    const store = useGoogleFontStore.getState();
    const textElements = [
      ...document.querySelectorAll('#svgcontent g.layer:not([display="none"]) text'),
      ...document.querySelectorAll('#svg_defs text'),
    ] as SVGTextElement[];

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
          console.log(`🚫 Skipping local font from document context: ${cleanFamily}`);

          return;
        }

        // Extract font properties
        const fontWeightAttr = textElem.getAttribute('font-weight');
        const fontStyleAttr = textElem.getAttribute('font-style');
        const postscriptNameAttr = textElem.getAttribute('font-postscript-name');

        // Parse weight (default to 400 if not specified)
        let weight = 400;

        if (fontWeightAttr) {
          const parsedWeight =
            fontWeightAttr === 'normal' ? 400 : fontWeightAttr === 'bold' ? 700 : Number.parseInt(fontWeightAttr, 10);

          if (!Number.isNaN(parsedWeight)) {
            weight = parsedWeight;
          }
        }

        // Parse italic (default to false if not specified)
        const italic = fontStyleAttr === 'italic' || fontStyleAttr === 'oblique';
        // Generate proper PostScript name and style
        const postscriptName = postscriptNameAttr || generateGoogleFontPostScriptName(cleanFamily, weight, italic);
        const style = generateStyleFromWeightAndItalic(weight, italic);

        // Use PostScript name as unique key to avoid duplicates
        fontVariantsInContext.set(postscriptName, { family: cleanFamily, italic, postscriptName, style, weight });
      }
    });

    if (fontVariantsInContext.size === 0) {
      return;
    }

    Array.from(fontVariantsInContext.values()).forEach(({ family, italic, style, weight }) => {
      // Load the font family CSS if not already loaded
      if (!store.isGoogleFontLoaded(family)) {
        store.loadGoogleFont(family);
      }

      const googleFont = createGoogleFontObject(family, weight, italic, style, store.loadGoogleFontBinary);

      registerGoogleFont(googleFont);
      console.log(`Registered Google Font variant: ${googleFont.postscriptName} (${googleFont.style})`);
    });
  } catch (error) {
    console.warn('Failed to scan document context for Google Fonts:', error);
  }
};

/**
 * Lazy registration: Create and register GoogleFont if CSS is already loaded
 * Enhanced version that handles specific font variants with proper PostScript names
 * Returns the GoogleFont object if successfully registered, null otherwise
 */
export const lazyRegisterGoogleFontIfLoaded = (postscriptName: string): GeneralFont | null => {
  const fontFamily = extractFamilyFromPostScriptName(postscriptName);

  if (!fontFamily) {
    return null;
  }

  const store = useGoogleFontStore.getState();

  // Check if already registered in the registry
  if (googleFontRegistry.isRegistered(postscriptName)) {
    const registeredFont = googleFontRegistry.getRegisteredFont(postscriptName);

    if (registeredFont) {
      useGoogleFontStore.setState({ registeredFonts: new Set(store.registeredFonts).add(fontFamily) });

      return registeredFont;
    }
  }

  // Check if CSS is already loaded (from early loading or history)
  if (store.isGoogleFontLoaded(fontFamily)) {
    const postscriptMatch = postscriptName.match(/^(.+?)-(.+)$/);

    if (postscriptMatch) {
      const [, , variantPart] = postscriptMatch;

      let weight = 400;
      let italic = false;

      if (variantPart.endsWith('Italic')) {
        italic = true;

        const weightPart = variantPart.replace('Italic', '');

        weight = POSTSCRIPT_TO_WEIGHT_MAP[weightPart as PostScriptStyleName] || 400;
      } else {
        weight = POSTSCRIPT_TO_WEIGHT_MAP[variantPart as PostScriptStyleName] || 400;
      }

      const style = generateStyleFromWeightAndItalic(weight, italic);
      const googleFont = createGoogleFontObject(fontFamily, weight, italic, style, store.loadGoogleFontBinary);

      registerGoogleFont(googleFont);

      // Verify registration succeeded
      if (googleFontRegistry.isRegistered(postscriptName)) {
        return googleFontRegistry.getRegisteredFont(postscriptName) || null;
      }
    }
  }

  return null;
};

/**
 * Comprehensive Google Fonts loading for app initialization
 * Uses the Zustand store directly for all operations
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
