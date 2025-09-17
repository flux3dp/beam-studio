import { useCallback, useMemo, useState } from 'react';

import {
  type GoogleFontItem as CachedGoogleFontItem,
  getGoogleFontsCatalogSorted,
} from '@core/helpers/fonts/googleFontsApiCache';

interface UseGoogleFontDataReturn {
  // Computed data
  categoryOptions: Array<{ label: string; value: string }>;
  // Actions
  fetchGoogleFonts: () => Promise<void>;
  // Data state
  fonts: CachedGoogleFontItem[];

  languageOptions: Array<{ label: string; value: string }>;
  loadedFonts: Set<string>;

  loadFont: (font: CachedGoogleFontItem) => void;
  loading: boolean;
}

const CATEGORIES = ['serif', 'sans-serif', 'display', 'handwriting', 'monospace'];

/**
 * Custom hook for managing Google Font data and font loading
 * Handles API fetching, font CSS loading, and option generation
 */
export const useGoogleFontData = (): UseGoogleFontDataReturn => {
  const [fonts, setFonts] = useState<CachedGoogleFontItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());

  // Fetch Google Fonts from API
  const fetchGoogleFonts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getGoogleFontsCatalogSorted();

      setFonts(data.items || []);
    } catch (error) {
      console.error('Failed to fetch Google Fonts:', error);
      setFonts([]); // Show empty list on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Load font CSS for preview
  const loadFont = useCallback(
    (font: CachedGoogleFontItem) => {
      if (loadedFonts.has(font.family)) return;

      // Create font face for preview
      // Note: 'wght' is Google Fonts parameter for font-weight (not a typo)
      const fontUrl = `https://fonts.googleapis.com/css2?family=${font.family.replace(/ /g, '+')}:wght@400&display=swap`;
      const link = document.createElement('link');

      link.href = fontUrl;
      link.rel = 'stylesheet';
      document.head.appendChild(link);

      setLoadedFonts((prev) => new Set(prev).add(font.family));
    },
    [loadedFonts],
  );

  // Generate category options
  const categoryOptions = useMemo(() => {
    return CATEGORIES.map((cat) => ({
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
      value: cat,
    }));
  }, []);

  // Generate language options from available fonts
  const languageOptions = useMemo(() => {
    const allSubsets = new Set<string>();

    fonts.forEach((font) => {
      font.subsets.forEach((subset) => allSubsets.add(subset));
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
      .map((subset) => ({
        label: parseSubsetLabel(subset),
        value: subset,
      }));
  }, [fonts]);

  return {
    // Computed
    categoryOptions,
    // Actions
    fetchGoogleFonts,
    // State
    fonts,

    languageOptions,
    loadedFonts,

    loadFont,
    loading,
  };
};
