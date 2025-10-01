import { useCallback, useMemo, useState } from 'react';

import { useGoogleFontStore } from '@core/app/stores/googleFontStore';
import {
  type GoogleFontItem as CachedGoogleFontItem,
  googleFontsApiCache,
} from '@core/helpers/fonts/googleFontsApiCache';

interface UseGoogleFontDataReturn {
  categoryOptions: Array<{ label: string; value: string }>;
  fetchGoogleFonts: () => Promise<void>;
  fonts: CachedGoogleFontItem[];
  isLoading: boolean;
  languageOptions: Array<{ label: string; value: string }>;
  loadFont: (font: CachedGoogleFontItem) => Promise<void>;
  loadFontForTextEditing: (fontFamily: string) => Promise<void>;
}

const CATEGORIES = ['serif', 'sans-serif', 'display', 'handwriting', 'monospace'];

/**
 * Custom hook for managing Google Font data and font loading
 * Handles API fetching, font CSS loading, and option generation
 */
export const useGoogleFontData = (): UseGoogleFontDataReturn => {
  const [fonts, setFonts] = useState(Array.of<CachedGoogleFontItem>());
  const [isLoading, setIsLoading] = useState(false);
  const loadGoogleFontForPreview = useGoogleFontStore((state) => state.loadGoogleFontForPreview);
  const loadGoogleFont = useGoogleFontStore((state) => state.loadGoogleFont);

  // Fetch Google Fonts from API
  const fetchGoogleFonts = useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await googleFontsApiCache.getCache();

      setFonts(data.items || []);
    } catch (error) {
      console.error('Failed to fetch Google Fonts:', error);
      setFonts([]); // Show empty list on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadFont = useCallback(
    async (font: CachedGoogleFontItem) => {
      const currentState = useGoogleFontStore.getState();

      if (currentState.sessionLoadedFonts.has(font.family)) return;

      // Use optimized preview loading (low priority, preview purpose)
      await loadGoogleFontForPreview(font.family);
    },
    [loadGoogleFontForPreview],
  );

  // Load font for text editing (permanent, upgrades from preview if needed)
  const loadFontForTextEditing = useCallback(
    async (fontFamily: string) => {
      await loadGoogleFont(fontFamily);
    },
    [loadGoogleFont],
  );

  const categoryOptions = useMemo(
    () => CATEGORIES.map((cat) => ({ label: cat.charAt(0).toUpperCase() + cat.slice(1), value: cat })),
    [],
  );

  const languageOptions = useMemo(() => {
    const allSubsets = new Set<string>();

    fonts.forEach(({ subsets }) => {
      subsets.forEach((subset) => allSubsets.add(subset));
    });

    const languageMapping: Record<string, string> = {
      'chinese-hongkong': 'Chinese (Hong Kong)',
      'chinese-simplified': 'Chinese Simplified',
      'chinese-traditional': 'Chinese Traditional',
    };

    const parseSubsetLabel = (subset: string): string => {
      // First check if we have a custom mapping
      if (languageMapping[subset]) {
        return languageMapping[subset];
      }

      // Handle '-ext' suffix
      if (subset.endsWith('-ext')) {
        const baseName = subset.slice(0, -4); // Remove '-ext'

        return `${baseName.charAt(0).toUpperCase() + baseName.slice(1)} Extended`;
      }

      // Replace hyphens with spaces and capitalize each word
      return subset
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    return Array.from(allSubsets)
      .sort()
      .map((subset) => ({ label: parseSubsetLabel(subset), value: subset }));
  }, [fonts]);

  return {
    categoryOptions,
    fetchGoogleFonts,
    fonts,
    isLoading,
    languageOptions,
    loadFont,
    loadFontForTextEditing,
  };
};
