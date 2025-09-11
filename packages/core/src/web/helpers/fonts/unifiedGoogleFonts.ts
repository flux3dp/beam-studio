import { match } from 'ts-pattern';

import storage from '@core/implementations/storage';
import type { GoogleFont } from '@core/interfaces/IFont';

import { extractFamilyFromPostScriptName, isGoogleFontPostScriptName } from './googleFontDetector';
import { googleFontRegistry } from './googleFontRegistry';
import { getGoogleFont } from './googleFontsApiCache';
import googleFonts from './webFonts.google';

// Maximum number of Google Font CSS links to prevent memory issues
export const MAX_GOOGLE_FONT_LINKS = 10;

/**
 * Create a shared binary loading function for Google Fonts using cached API data
 */
const createBinaryLoader = () => {
  return async (
    fontFamily: string,
    weight = 400,
    style: 'italic' | 'normal' = 'normal',
  ): Promise<ArrayBuffer | null> => {
    try {
      console.log(`Loading Google Font binary: ${fontFamily} ${weight} ${style}`);

      // Get font data from cache instead of making direct API call
      const fontData = await getGoogleFont(fontFamily);

      if (!fontData) {
        throw new Error(`Font ${fontFamily} not found in Google Fonts API cache`);
      }

      // Find the correct variant
      const variantKey = match({ style, weight })
        .with({ style: 'italic', weight: 400 }, () => 'italic')
        .with({ style: 'normal', weight: 400 }, () => 'regular')
        .with({ style: 'italic' }, ({ weight }) => `${weight}italic`)
        .with({ style: 'normal' }, ({ weight }) => `${weight}`)
        .exhaustive();

      const fontUrl = fontData.files?.[variantKey] || fontData.files?.regular || Object.values(fontData.files || {})[0];

      if (!fontUrl) {
        console.warn(`No font file found for ${fontFamily} ${variantKey}`);

        return null;
      }

      // Fetch font binary data (Google Fonts API returns TTF files directly)
      const fontResponse = await fetch(fontUrl as string);

      if (!fontResponse.ok) {
        throw new Error(`Failed to fetch font: ${fontResponse.status}`);
      }

      const ttfBuffer = await fontResponse.arrayBuffer();

      console.log(`Loaded Google Font binary: ${fontFamily} (${ttfBuffer.byteLength} bytes)`);

      return ttfBuffer;
    } catch (error) {
      console.error(`Failed to load Google Font binary for ${fontFamily}:`, error);

      return null;
    }
  };
};

/**
 * Session-based font loading tracking to avoid duplicate CSS links
 */
class GoogleFontsLoader {
  public sessionLoadedFonts = new Set<string>();
  public registeredFonts = new Set<string>();
  public binaryLoader = createBinaryLoader();
  private registrationQueue: Array<{ family: string; font: GoogleFont }> = [];
  private isProcessingQueue = false;

  /**
   * Get font family from Google Fonts URL
   */
  private getFontFamilyFromGoogleUrl(url: string): null | string {
    try {
      const familyParam = new URL(url).searchParams.get('family');

      if (familyParam) {
        // Get font name from format like "Open+Sans:wght@400"
        return familyParam.split(':')[0].replace(/\+/g, ' ');
      }
    } catch (error) {
      console.error('Failed to parse Google Fonts URL:', url, error);
    }

    return null;
  }

  /**
   * Clean up excess Google Font CSS links to prevent memory issues
   */
  private cleanupExcessGoogleFonts(fontsToKeep: Set<string>): void {
    const googleFontLinks = document.querySelectorAll('link[href*="fonts.googleapis.com"]');

    if (googleFontLinks.length <= MAX_GOOGLE_FONT_LINKS) {
      return;
    }

    console.log(
      `Cleaning up Google Font CSS links (current: ${googleFontLinks.length}, max: ${MAX_GOOGLE_FONT_LINKS})`,
    );

    const linksToRemove: HTMLLinkElement[] = [];

    googleFontLinks.forEach((link) => {
      const linkElement = link as HTMLLinkElement;
      const family = this.getFontFamilyFromGoogleUrl(linkElement.href);

      if (family && !fontsToKeep.has(family)) {
        linksToRemove.push(linkElement);
      }
    });

    // Remove oldest fonts that are not in the keep list
    const removeCount = Math.max(1, googleFontLinks.length - MAX_GOOGLE_FONT_LINKS + 1);

    linksToRemove.slice(0, removeCount).forEach((link) => {
      const removedFamily = this.getFontFamilyFromGoogleUrl(link.href);

      if (removedFamily) {
        this.sessionLoadedFonts.delete(removedFamily);
        console.log(`Removed Google Font CSS: ${removedFamily}`);
      }

      link.remove();
    });
  }

  /**
   * Load a single Google Font CSS if not already loaded
   */
  public loadGoogleFontCSS(fontFamily: string): void {
    // Check if already loaded in this session
    if (this.sessionLoadedFonts.has(fontFamily)) {
      return;
    }

    // Create Google Fonts URL
    const fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@400&display=swap`;

    // Check if CSS link already exists in DOM
    if (document.querySelector(`link[href="${fontUrl}"]`)) {
      // Mark as loaded but don't create duplicate
      this.sessionLoadedFonts.add(fontFamily);

      return;
    }

    // Create and append link element
    const link = document.createElement('link');

    link.href = fontUrl;
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Track that this font has been loaded in this session
    this.sessionLoadedFonts.add(fontFamily);
    console.log(`Loaded Google Font CSS: ${fontFamily}`);
  }

  /**
   * Create a GoogleFont object for text-to-path conversion
   * Uses the EXACT same format as the working TextOptions code
   */
  public createGoogleFontObject(fontFamily: string, _weight = 400, _style: 'italic' | 'normal' = 'normal'): GoogleFont {
    // Use the exact same PostScript name format as TextOptions: fontFamily + '-Regular'
    // This is critical for FontFuncs.getFontOfPostscriptName to find the font
    return {
      binaryLoader: this.binaryLoader,
      family: fontFamily,
      italic: false, // Keep simple like original TextOptions
      postscriptName: fontFamily.replace(/\s+/g, '') + '-Regular', // EXACT same format as TextOptions
      source: 'google',
      style: 'Regular', // Keep simple like original TextOptions
      weight: 400, // Keep simple like original TextOptions
    };
  }

  /**
   * Queue a Google Font for registration when FontFuncs is ready
   */
  public queueFontRegistration(fontFamily: string): void {
    if (this.registeredFonts.has(fontFamily)) {
      return;
    }

    const googleFont = this.createGoogleFontObject(fontFamily);

    this.registrationQueue.push({ family: fontFamily, font: googleFont });

    // Try to process queue immediately (in case FontFuncs is already ready)
    this.processRegistrationQueue();
  }

  /**
   * Check if Google Font registry is ready for registration
   */
  private isRegistryReady(): boolean {
    return googleFontRegistry.isInitialized();
  }

  /**
   * Process the registration queue when registry is ready
   */
  private processRegistrationQueue(): void {
    if (this.isProcessingQueue || this.registrationQueue.length === 0) {
      return;
    }

    if (!this.isRegistryReady()) {
      // Registry not ready, try again later
      setTimeout(() => this.processRegistrationQueue(), 50);

      return;
    }

    this.isProcessingQueue = true;

    let processedCount = 0;

    console.log(`📦 Processing ${this.registrationQueue.length} queued Google Font registrations...`);

    this.registrationQueue.forEach(({ family, font }) => {
      if (!this.registeredFonts.has(family)) {
        const registered = googleFontRegistry.registerGoogleFont(font);

        if (registered) {
          this.registeredFonts.add(family);
          processedCount++;
        } else {
          console.warn(`Failed to register queued Google Font ${family}`);
        }
      }
    });

    this.registrationQueue = []; // Clear the queue
    this.isProcessingQueue = false;

    if (processedCount > 0) {
      console.log(`🔗 Successfully registered ${processedCount} Google Fonts for text-to-path conversion`);
    }
  }

  /**
   * Register a Google Font for text-to-path conversion (immediate, for runtime use)
   */
  private registerGoogleFontForTextToPath(fontFamily: string): void {
    if (this.registeredFonts.has(fontFamily)) {
      return;
    }

    const googleFont = this.createGoogleFontObject(fontFamily);

    if (this.isRegistryReady()) {
      const registered = googleFontRegistry.registerGoogleFont(googleFont);

      if (registered) {
        this.registeredFonts.add(fontFamily);
        console.log(`Registered Google Font for text-to-path: ${fontFamily}`);
      }
    } else {
      // Queue for later processing
      this.queueFontRegistration(fontFamily);
    }
  }

  /**
   * Load Google Font CSS and register for text-to-path conversion
   */
  private loadGoogleFontComplete(fontFamily: string): void {
    // Load CSS for display
    this.loadGoogleFontCSS(fontFamily);

    // Register for text-to-path conversion
    this.registerGoogleFontForTextToPath(fontFamily);
  }

  /**
   * Load multiple Google Fonts with memory management
   */
  public loadGoogleFonts(fontFamilies: string[], fontsToKeep?: Set<string>): void {
    // Build set of fonts to keep (history + currently used + new fonts)
    const keepSet = new Set(fontsToKeep || []);

    fontFamilies.forEach((family) => keepSet.add(family));

    // Clean up excess fonts before adding new ones
    this.cleanupExcessGoogleFonts(keepSet);

    // Load each font (CSS + registration)
    fontFamilies.forEach((family) => {
      this.loadGoogleFontComplete(family);
    });
  }

  /**
   * Check if a font is already loaded in this session
   */
  public isFontLoaded(fontFamily: string): boolean {
    return this.sessionLoadedFonts.has(fontFamily);
  }

  /**
   * Check if a font is already registered for text-to-path conversion
   */
  public isFontRegistered(fontFamily: string): boolean {
    return this.registeredFonts.has(fontFamily);
  }

  /**
   * Load a single Google Font (CSS + registration)
   */
  public loadSingleGoogleFont(fontFamily: string): void {
    this.loadGoogleFontComplete(fontFamily);
  }

  /**
   * Get currently loaded fonts
   */
  public getLoadedFonts(): Set<string> {
    return new Set(this.sessionLoadedFonts);
  }

  /**
   * Get currently registered fonts
   */
  public getRegisteredFonts(): Set<string> {
    return new Set(this.registeredFonts);
  }

  /**
   * Clear session tracking (useful for testing)
   */
  public clearSession(): void {
    this.sessionLoadedFonts.clear();
    this.registeredFonts.clear();
  }
}

// Global instance
const googleFontsLoader = new GoogleFontsLoader();

/**
 * Load static Google Fonts (predefined web fonts) with CSS and queued registration
 */
export const loadStaticGoogleFonts = (lang: string): void => {
  const googleLangFonts = googleFonts.getAvailableFonts(lang);

  // Apply CSS styles (existing static font loading)
  googleFonts.applyStyle(googleLangFonts);

  // Track static fonts as loaded (no registration to avoid conflicts)
  googleLangFonts.forEach((font) => {
    if (font.family) {
      googleFontsLoader.sessionLoadedFonts.add(font.family);
    }
  });

  console.log(`Loaded ${googleLangFonts.length} static Google Fonts CSS (registration disabled to avoid conflicts)`);
};

/**
 * Load Google Fonts from font history with CSS and queued registration
 */
export const loadHistoryGoogleFonts = (availableFontFamilies: string[]): void => {
  const fontHistory: string[] = storage.get('font-history') || [];

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

  console.log(`Loading ${googleFontsFromHistory.length} Google Fonts from history:`, googleFontsFromHistory);

  // Load CSS only (no registration to avoid conflicts)
  googleFontsFromHistory.forEach((family) => {
    googleFontsLoader.loadGoogleFontCSS(family);
  });
};

/**
 * Load a specific Google Font (CSS + registration for runtime loading)
 */
export const loadGoogleFont = (fontFamily: string): void => {
  if (!googleFontsLoader.isFontLoaded(fontFamily)) {
    googleFontsLoader.loadSingleGoogleFont(fontFamily);
  }
};

/**
 * Check if a Google Font CSS is already loaded
 */
export const isGoogleFontLoaded = (fontFamily: string): boolean => {
  return googleFontsLoader.isFontLoaded(fontFamily);
};

/**
 * Check if a Google Font is registered for text-to-path conversion
 */
export const isGoogleFontRegistered = (fontFamily: string): boolean => {
  return googleFontsLoader.isFontRegistered(fontFamily);
};

/**
 * Get all currently loaded Google Fonts
 */
export const getLoadedGoogleFonts = (): Set<string> => {
  return googleFontsLoader.getLoadedFonts();
};

/**
 * Get all currently registered Google Fonts
 */
export const getRegisteredGoogleFonts = (): Set<string> => {
  return googleFontsLoader.getRegisteredFonts();
};

// Re-export from detector module for backward compatibility
export { extractFamilyFromPostScriptName, isGoogleFontPostScriptName } from './googleFontDetector';

/**
 * Lazy registration: Create and register GoogleFont if CSS is already loaded
 * This enables text-to-path conversion without requiring TextOptions to be opened first
 */
export const lazyRegisterGoogleFontIfLoaded = (postscriptName: string): GoogleFont | null => {
  const fontFamily = extractFamilyFromPostScriptName(postscriptName);

  if (!fontFamily) {
    return null;
  }

  // Check if already registered in the registry
  if (googleFontRegistry.isRegistered(postscriptName)) {
    console.log(`Google Font already registered: ${fontFamily}`);

    return googleFontRegistry.getRegisteredFont(postscriptName) || null;
  }

  // Check if already registered by family name in the loader
  if (googleFontsLoader.isFontRegistered(fontFamily)) {
    console.log(`Google Font already registered in loader: ${fontFamily}`);

    return googleFontsLoader.createGoogleFontObject(fontFamily);
  }

  // Check if CSS is already loaded (from early loading or history)
  if (googleFontsLoader.isFontLoaded(fontFamily)) {
    console.log(`🔄 Lazy registering Google Font: ${fontFamily} (${postscriptName})`);

    // Create GoogleFont object using same format as TextOptions
    const googleFont = googleFontsLoader.createGoogleFontObject(fontFamily);

    // Register using the registry service (no circular dependency)
    const registered = googleFontRegistry.registerGoogleFont(googleFont);

    if (registered) {
      console.log(`✅ Lazy registered Google Font: ${fontFamily} for text-to-path conversion`);

      return googleFont;
    }

    console.warn(`Failed to lazy register Google Font ${fontFamily}: registry not ready`);

    return null;
  }

  return null;
};

/**
 * Comprehensive Google Fonts loading for app initialization
 * Loads CSS immediately, registration handled by TextOptions
 */
export const loadAllInitialGoogleFonts = (lang: string, availableFontFamilies: string[]): void => {
  console.log('🚀 Loading all initial Google Fonts CSS...');

  // Load static Google Fonts CSS only
  loadStaticGoogleFonts(lang);

  // Load Google Fonts from history CSS only
  loadHistoryGoogleFonts(availableFontFamilies);

  console.log('✅ Initial Google Fonts CSS loading complete (registration will happen in TextOptions)');
};

/**
 * Export the createGoogleFontObject function for external use
 */
export const createGoogleFontObject = (
  fontFamily: string,
  weight = 400,
  style: 'italic' | 'normal' = 'normal',
): GoogleFont => {
  return googleFontsLoader.createGoogleFontObject(fontFamily, weight, style);
};

export default {
  createGoogleFontObject,
  extractFamilyFromPostScriptName,
  getLoadedGoogleFonts,
  getRegisteredGoogleFonts,
  isGoogleFontLoaded,
  isGoogleFontPostScriptName,
  isGoogleFontRegistered,
  lazyRegisterGoogleFontIfLoaded,
  loadAllInitialGoogleFonts,
  loadGoogleFont,
  loadHistoryGoogleFonts,
  loadStaticGoogleFonts,
};
