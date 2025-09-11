import { useCallback, useEffect, useState } from 'react';

import { match, P } from 'ts-pattern';

import { setStorage } from '@core/app/stores/storageStore';
import textEdit from '@core/app/svgedit/text/textedit';
import type { GeneralFont } from '@core/interfaces/IFont';

export const MAX_GOOGLE_FONT_LINKS = 10;
export const MAX_FONT_HISTORIES = 5;

// Google Fonts API key (same as in GoogleFontsPanel)
const GOOGLE_FONTS_API_KEY = 'YOUR_GOOGLE_API_KEY';

// Icon font detection - these contain symbols/icons, not text
const ICON_FONT_KEYWORDS = ['icons'];

/**
 * Checks if a font is likely an icon/symbol font unsuitable for text
 * @param fontFamily Font family name
 * @returns true if font appears to be an icon font
 */
const isIconFont = (fontFamily: string): boolean => {
  const lowerName = fontFamily.toLowerCase();

  return ICON_FONT_KEYWORDS.some((keyword) => lowerName.includes(keyword));
};

/**
 * Interface for cached Google Font binary data
 */
interface GoogleFontBinary {
  buffer: ArrayBuffer;
  family: string;
  style: 'italic' | 'normal';
  timestamp: number;
  weight: number;
}

/**
 * Helper function to get font family from Google Fonts URL
 * @param url Google Fonts URL
 * @returns Font family name or null if parsing fails
 */
const getFontFamilyFromGoogleUrl = (url: string): null | string => {
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
};

interface UseGoogleFontsProps {
  availableFontFamilies: string[];
  elem: Element;
  fontHistory: string[];
  textElements: SVGTextElement[];
}

interface UseGoogleFontsReturn {
  addToHistory: (font: GeneralFont) => void;
  cachedBinaries: Map<string, GoogleFontBinary>;
  // Cleanup functions
  cleanupGoogleFontBinaries: () => void;
  cleanupUnusedGoogleFonts: () => void;
  // Core functions
  loadGoogleFontBinary: (
    fontFamily: string,
    weight?: number,
    style?: 'italic' | 'normal',
  ) => Promise<ArrayBuffer | null>;
  loadGoogleFontCSS: (fontFamily: string) => void;
  // Lifecycle functions
  proactivelyLoadHistoryFonts: () => void;
  // State
  sessionLoadedFonts: Set<string>;
}

/**
 * Hook for managing Google Fonts loading, cleanup, and history
 * Handles the complete lifecycle of Google Fonts in the application
 */
export const useGoogleFonts = ({
  availableFontFamilies,
  elem,
  fontHistory,
  textElements,
}: UseGoogleFontsProps): UseGoogleFontsReturn => {
  // Session-based font loading tracking (moved from component to hook)
  const [sessionLoadedFonts, setSessionLoadedFonts] = useState<Set<string>>(new Set());
  // Binary font data cache for text-to-path conversion
  const [cachedBinaries, setCachedBinaries] = useState<Map<string, GoogleFontBinary>>(new Map());

  // Google Font loading with memory management
  const loadGoogleFontCSS = useCallback(
    (fontFamily: string) => {
      // Check if already loaded in this session
      if (sessionLoadedFonts.has(fontFamily)) {
        return;
      }

      // Create Google Fonts URL
      const fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@400&display=swap`;

      // Check if CSS link already exists in DOM
      if (document.querySelector(`link[href="${fontUrl}"]`)) {
        // Mark as loaded but don't create duplicate
        setSessionLoadedFonts((prev) => new Set(prev).add(fontFamily));

        return;
      }

      // Before adding new font, check if we need to clean up old ones
      const googleFontLinks = document.querySelectorAll('link[href*="fonts.googleapis.com"]');

      if (googleFontLinks.length >= MAX_GOOGLE_FONT_LINKS) {
        console.log(
          `Cleaning up Google Font CSS links (current: ${googleFontLinks.length}, max: ${MAX_GOOGLE_FONT_LINKS})`,
        );

        // Build a set of fonts we want to keep:
        // 1. Fonts in recent history
        // 2. Fonts currently used by text elements
        const fontsToKeep = new Set<string>(fontHistory);

        // Add currently used fonts from text elements
        const allTextElements = document.querySelectorAll('text');

        allTextElements.forEach((textElem) => {
          const textFontFamily = textEdit.getFontFamilyData(textElem as SVGTextElement);

          if (textFontFamily) {
            const cleanFamily = textFontFamily.replace(/^['"]|['"]$/g, '');

            fontsToKeep.add(cleanFamily);
          }
        });

        // Remove oldest fonts that are not in the keep list
        const linksToRemove: HTMLLinkElement[] = [];

        googleFontLinks.forEach((link) => {
          const linkElement = link as HTMLLinkElement;
          const family = getFontFamilyFromGoogleUrl(linkElement.href);

          if (family && !fontsToKeep.has(family)) {
            linksToRemove.push(linkElement);
          }
        });

        // Sort by order in DOM (oldest first) and remove excess
        const removeCount = Math.max(1, googleFontLinks.length - MAX_GOOGLE_FONT_LINKS + 1);

        linksToRemove.slice(0, removeCount).forEach((link) => {
          const removedFamily = getFontFamilyFromGoogleUrl(link.href);

          if (removedFamily) {
            setSessionLoadedFonts((set) => {
              set.delete(removedFamily);

              return set;
            });
            console.log(`Removed Google Font CSS: ${removedFamily}`);
          }

          link.remove();
        });
      }

      // Create and append link element - exactly like GoogleFontsPanel
      const link = document.createElement('link');

      link.href = fontUrl;
      link.rel = 'stylesheet';
      document.head.appendChild(link);

      // Track that this font has been loaded in this session
      setSessionLoadedFonts((prev) => new Set(prev).add(fontFamily));
      console.log(`Loaded Google Font CSS: ${fontFamily}`);
    },
    [sessionLoadedFonts, fontHistory],
  );

  /**
   * Fetches complete font file URL from Google Fonts API
   * This gets the FULL font file, not a subset like the CSS API
   * @param fontFamily Font family name
   * @param weight Font weight (default 400)
   * @param style Font style (default 'normal')
   * @returns Complete font file URL or null if not found
   */
  const getCompleteFontUrl = useCallback(
    async (fontFamily: string, weight = 400, style: 'italic' | 'normal' = 'normal'): Promise<null | string> => {
      try {
        console.log(`Fetching complete font URL for ${fontFamily} ${weight} ${style}`);

        // Step 1: Get font metadata from Google Fonts API
        const apiUrl = `https://www.googleapis.com/webfonts/v1/webfonts?key=${GOOGLE_FONTS_API_KEY}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`Failed to fetch Google Fonts API: ${response.status}`);
        }

        const data: any = await response.json();
        const fontData = data.items?.find((item: any) => item.family === fontFamily);

        console.log(`fontData: ${fontFamily}`, fontData);

        if (!fontData) {
          throw new Error(`Font ${fontFamily} not found in Google Fonts API`);
        }

        // Warn about problematic fonts
        if (fontData.colorCapabilities && fontData.colorCapabilities.length > 0) {
          console.warn(
            `⚠️ Font "${fontFamily}" has color capabilities: ${fontData.colorCapabilities.join(', ')}. ` +
              `This may cause issues with text-to-path conversion.`,
          );
        }

        if (isIconFont(fontFamily)) {
          console.warn(
            `⚠️ Font "${fontFamily}" appears to be an icon font. ` +
              `This font contains symbols/icons and may not work well for text content.`,
          );
        }

        // Step 2: Find the correct variant
        // Google Fonts variants format: "regular", "italic", "100", "100italic", "700", "700italic", etc.
        const variantKey = match({ style, weight })
          .with({ style: 'normal', weight: 400 }, () => 'regular')
          .with({ style: 'italic', weight: 400 }, () => 'italic')
          .with({ style: 'italic' }, ({ weight }) => `${weight}italic`)
          .with({ weight: P.number }, ({ weight }) => `${weight}`)
          .otherwise(() => 'regular');

        // Get the font file URL for this variant
        const fontUrl = fontData.files?.[variantKey];

        if (!fontUrl) {
          console.warn(
            `Variant ${variantKey} not found for ${fontFamily}, available:`,
            Object.keys(fontData.files || {}),
          );

          // Fallback to regular if specific variant not found
          const fallbackUrl = fontData.files?.regular || Object.values(fontData.files || {})[0];

          if (fallbackUrl) {
            console.log(`Using fallback font URL: ${fallbackUrl}`);

            return fallbackUrl as string;
          }

          return null;
        }

        console.log(`Found complete font URL for ${fontFamily} ${variantKey}: ${fontUrl}`);

        return fontUrl;
      } catch (error) {
        console.error('Failed to get complete font URL from API:', error);

        return null;
      }
    },
    [],
  );

  /**
   * Loads Google Font binary data for text-to-path conversion
   * @param fontFamily Font family name
   * @param weight Font weight (default 400)
   * @param style Font style (default 'normal')
   * @returns Font binary data as ArrayBuffer or null if loading fails
   */
  const loadGoogleFontBinary = useCallback(
    async (fontFamily: string, weight = 400, style: 'italic' | 'normal' = 'normal'): Promise<ArrayBuffer | null> => {
      const cacheKey = `${fontFamily}-${weight}-${style}`;

      // Check memory cache first
      const cached = cachedBinaries.get(cacheKey);

      if (cached) {
        console.log(`Using cached binary for ${fontFamily} ${weight} ${style}`);

        return cached.buffer;
      }

      try {
        console.log(`Loading Google Font binary: ${fontFamily} ${weight} ${style}`);

        // Step 1: Get complete font URL from Google Fonts API
        const fontUrl = await getCompleteFontUrl(fontFamily, weight, style);

        if (!fontUrl) {
          throw new Error('Could not get font URL from Google Fonts API');
        }

        // Step 2: Fetch font binary data
        // Note: Google Fonts API returns TTF files directly, no decompression needed!
        const fontResponse = await fetch(fontUrl);

        if (!fontResponse.ok) {
          throw new Error(`Failed to fetch font: ${fontResponse.status} ${fontResponse.statusText}`);
        }

        const ttfBuffer = await fontResponse.arrayBuffer();

        console.log(`Fetched complete TTF data: ${ttfBuffer.byteLength} bytes`);

        // Verify we got a complete font by checking file size
        // Subset fonts are typically < 50KB, complete fonts are usually > 100KB
        if (ttfBuffer.byteLength < 50000) {
          console.warn(`Font file seems small (${ttfBuffer.byteLength} bytes), might be subset`);
        } else {
          console.log(`Font file size indicates complete font (${ttfBuffer.byteLength} bytes)`);
        }

        // Step 4: Cache the decompressed font
        const fontBinary: GoogleFontBinary = {
          buffer: ttfBuffer,
          family: fontFamily,
          style,
          timestamp: Date.now(),
          weight,
        };

        setCachedBinaries((prev) => new Map(prev).set(cacheKey, fontBinary));
        console.log(`Cached Google Font binary: ${fontFamily} ${weight} ${style}`);

        return ttfBuffer;
      } catch (error) {
        console.error(`Failed to load Google Font binary for ${fontFamily} ${weight} ${style}:`, error);

        return null;
      }
    },
    [cachedBinaries, getCompleteFontUrl],
  );

  // Manual cleanup function for removing all unused Google Font CSS
  const cleanupUnusedGoogleFonts = useCallback(() => {
    const googleFontLinks = document.querySelectorAll('link[href*="fonts.googleapis.com"]');

    if (googleFontLinks.length === 0) return;

    console.log(`Running manual Google Font cleanup (found ${googleFontLinks.length} links)`);

    // Build set of fonts to keep
    const fontsToKeep = new Set<string>(fontHistory);

    // Add fonts currently used by text elements
    textElements.forEach((textElem) => {
      const textFontFamily = textEdit.getFontFamilyData(textElem);

      if (textFontFamily) {
        // Get clean family name without quotes like "'Open Sans'" -> "Open Sans"
        const cleanFamily = textFontFamily.replace(/^['"]|['"]$/g, '');

        fontsToKeep.add(cleanFamily);
      }
    });

    let removedCount = 0;

    googleFontLinks.forEach((link) => {
      const linkElement = link as HTMLLinkElement;
      const family = getFontFamilyFromGoogleUrl(linkElement.href);

      if (family && !fontsToKeep.has(family)) {
        // Remove from session cache
        setSessionLoadedFonts((set) => {
          set.delete(family);

          return set;
        });
        link.remove();
        removedCount++;
        console.log(`Cleaned up unused Google Font: ${family}`);
      }
    });

    console.log(`Cleanup complete: removed ${removedCount} unused font links`);
  }, [fontHistory, textElements]);

  // History management
  const addToHistory = useCallback(
    (font: GeneralFont) => {
      if (!font.family) return;

      const newHistory = fontHistory.filter((name) => name !== font.family);

      newHistory.unshift(font.family);

      if (newHistory.length > MAX_FONT_HISTORIES) newHistory.pop();

      setStorage('font-history', newHistory);
    },
    [fontHistory],
  );

  /**
   * Cleanup function for removing unused Google Font binaries from cache
   * Uses the same font-to-keep logic as CSS cleanup
   */
  const cleanupGoogleFontBinaries = useCallback(() => {
    const fontsToKeep = new Set<string>(fontHistory);

    // Add currently used fonts from text elements
    textElements.forEach((textElem) => {
      const textFontFamily = textEdit.getFontFamilyData(textElem);

      if (textFontFamily) {
        const cleanFamily = textFontFamily.replace(/^['"]|['"]$/g, '');

        fontsToKeep.add(cleanFamily);
      }
    });

    // Remove binaries for fonts not in keep list
    setCachedBinaries((prev) => {
      const newMap = new Map<string, GoogleFontBinary>();
      let removedCount = 0;

      prev.forEach((binary, key) => {
        if (fontsToKeep.has(binary.family)) {
          newMap.set(key, binary);
        } else {
          removedCount++;
          console.log(`Cleaned up Google Font binary: ${binary.family} ${binary.weight} ${binary.style}`);
        }
      });

      if (removedCount > 0) {
        console.log(`Binary cleanup complete: removed ${removedCount} cached fonts`);
      }

      return newMap;
    });
  }, [fontHistory, textElements]);

  // Proactive loading for Google Fonts in history
  const proactivelyLoadHistoryFonts = useCallback(() => {
    // Proactively load Google Font CSS for fonts in history (once per session)
    // This ensures fonts are ready before user opens the dropdown
    fontHistory.forEach((family) => {
      const isLocalFont = availableFontFamilies.some((f) => f.toLowerCase() === family.toLowerCase());

      if (!isLocalFont && !sessionLoadedFonts.has(family)) {
        loadGoogleFontCSS(family);
      }
    });
  }, [fontHistory, availableFontFamilies, sessionLoadedFonts, loadGoogleFontCSS]);

  // Cleanup
  useEffect(() => {
    // Trigger cleanup when switching between different text elements
    // This ensures we don't accumulate fonts from previous editing sessions
    const googleFontLinks = document.querySelectorAll('link[href*="fonts.googleapis.com"]');

    if (googleFontLinks.length > MAX_GOOGLE_FONT_LINKS + 2) {
      // Only cleanup if we're over the limit by 20% to avoid frequent cleanups
      cleanupUnusedGoogleFonts();
      cleanupGoogleFontBinaries();
    }

    return () => {
      // Optional: Clean up when component unmounts, on user exited text editing mode
      // cleanupUnusedGoogleFonts();
    };
  }, [elem, cleanupUnusedGoogleFonts, cleanupGoogleFontBinaries]);

  return {
    addToHistory,
    cachedBinaries,
    cleanupGoogleFontBinaries,
    cleanupUnusedGoogleFonts,
    loadGoogleFontBinary,
    loadGoogleFontCSS,
    proactivelyLoadHistoryFonts,
    sessionLoadedFonts,
  };
};
