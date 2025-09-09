import { useCallback, useEffect, useState } from 'react';

import { setStorage } from '@core/app/stores/storageStore';
import textEdit from '@core/app/svgedit/text/textedit';
import type { GeneralFont } from '@core/interfaces/IFont';

export const MAX_GOOGLE_FONT_LINKS = 10;
export const MAX_FONT_HISTORIES = 5;

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
  cleanupUnusedGoogleFonts: () => void;
  // Core functions
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

  // Google Font loading with memory management
  const loadGoogleFontCSS = useCallback(
    (fontFamily: string) => {
      // Check if already loaded in this session
      if (sessionLoadedFonts.has(fontFamily)) {
        return;
      }

      // Create Google Fonts URL - exact same pattern as GoogleFontsPanel
      // Note: 'wght' is Google Fonts parameter for font-weight (not a typo)
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
    }

    return () => {
      // Optional: Clean up when component unmounts, on user exited text editing mode
      // cleanupUnusedGoogleFonts();
    };
  }, [elem, cleanupUnusedGoogleFonts]);

  return {
    addToHistory,
    cleanupUnusedGoogleFonts,
    loadGoogleFontCSS,
    proactivelyLoadHistoryFonts,
    sessionLoadedFonts,
  };
};
