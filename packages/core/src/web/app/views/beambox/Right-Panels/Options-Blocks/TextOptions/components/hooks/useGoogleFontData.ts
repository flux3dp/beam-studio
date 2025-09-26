import { useCallback, useEffect, useState } from 'react';

import { useFontLoading } from '@core/app/stores/googleFontStore';
import type { GoogleFontItem as CachedGoogleFontItem } from '@core/helpers/fonts/googleFontsApiCache';
import { progressiveGoogleFontsLoader } from '@core/helpers/fonts/progressiveGoogleFontsLoader';

interface UseGoogleFontDataReturn {
  categoryOptions: Array<{ label: string; value: string }>;
  fetchGoogleFonts: (options?: { category?: string; language?: string; searchTerm?: string }) => Promise<void>;
  fonts: CachedGoogleFontItem[];
  hasMore: boolean;
  languageOptions: Array<{ label: string; value: string }>;
  loadedFonts: Set<string>;
  loadFont: (font: CachedGoogleFontItem) => Promise<void>;
  loadFontForTextEditing: (fontFamily: string) => Promise<void>;
  loading: boolean;
  loadMoreFonts: () => Promise<void>;
}

/**
 * Progressive Google Font data hook with optimized loading
 * Features:
 * - Loads popular fonts first for fast startup
 * - Search-based font loading
 * - Category and language filtering
 * - Pagination support
 * - Background preloading
 */
export const useGoogleFontData = (): UseGoogleFontDataReturn => {
  const [fonts, setFonts] = useState<CachedGoogleFontItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [languageOptions, setLanguageOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [hasMore, setHasMore] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<{ category?: string; language?: string; searchTerm?: string }>(
    {},
  );
  const [currentOffset, setCurrentOffset] = useState(0);

  // Use the new focused stores
  const sessionLoadedFonts = useFontLoading((state) => state.sessionLoadedFonts);
  const loadForPreview = useFontLoading((state) => state.loadForPreview);
  const loadForTextEditing = useFontLoading((state) => state.loadForTextEditing);

  // Initialize with popular fonts and load options
  useEffect(() => {
    const initializeProgressiveLoading = async () => {
      setLoading(true);
      try {
        // Load popular fonts first for immediate display
        const popularFonts = await progressiveGoogleFontsLoader.initializeWithPopular();

        setFonts(popularFonts);

        // Load categories and languages for filters
        const [categories, languages] = await Promise.all([
          progressiveGoogleFontsLoader.getCategories(),
          progressiveGoogleFontsLoader.getLanguages(),
        ]);

        setCategoryOptions(
          categories.map((cat) => ({
            label: cat.charAt(0).toUpperCase() + cat.slice(1),
            value: cat,
          })),
        );
        setLanguageOptions(languages);

        // Start background preloading
        progressiveGoogleFontsLoader.preloadAdditionalFonts();

        console.log(`🚀 Initialized progressive loading with ${popularFonts.length} popular fonts`);
      } catch (error) {
        console.error('Failed to initialize progressive font loading:', error);
        setFonts([]);
      } finally {
        setLoading(false);
      }
    };

    initializeProgressiveLoading();
  }, []);

  // Progressive font fetching with filters
  const fetchGoogleFonts = useCallback(
    async (options: { category?: string; language?: string; searchTerm?: string } = {}) => {
      if (loading) return;

      setLoading(true);
      setCurrentFilters(options);
      setCurrentOffset(0);

      try {
        const result = await progressiveGoogleFontsLoader.loadFonts({
          category: options.category,
          limit: 50,
          offset: 0,
          searchTerm: options.searchTerm,
          subset: options.language,
        });

        setFonts(result.fonts);
        setHasMore(result.hasMore);
        setCurrentOffset(50);

        console.log(`📚 Loaded ${result.fonts.length} fonts (${result.total} total available)`);
      } catch (error) {
        console.error('Failed to fetch fonts progressively:', error);
        setFonts([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [loading],
  );

  // Load more fonts for pagination
  const loadMoreFonts = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);

    try {
      const result = await progressiveGoogleFontsLoader.loadFonts({
        category: currentFilters.category,
        limit: 50,
        offset: currentOffset,
        searchTerm: currentFilters.searchTerm,
        subset: currentFilters.language,
      });

      setFonts((prev) => [...prev, ...result.fonts]);
      setHasMore(result.hasMore);
      setCurrentOffset((prev) => prev + 50);

      console.log(`📚+ Loaded ${result.fonts.length} additional fonts`);
    } catch (error) {
      console.error('Failed to load more fonts:', error);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, currentFilters, currentOffset]);

  // Unified font loading for preview (lightweight)
  const loadFont = useCallback(
    async (font: CachedGoogleFontItem) => {
      if (sessionLoadedFonts.has(font.family)) return;

      try {
        await loadForPreview(font.family);
      } catch (error) {
        console.warn(`Failed to load font for preview: ${font.family}`, error);
      }
    },
    [sessionLoadedFonts, loadForPreview],
  );

  // Unified font loading for text editing (full loading)
  const loadFontForTextEditing = useCallback(
    async (fontFamily: string) => {
      try {
        await loadForTextEditing(fontFamily);
      } catch (error) {
        console.error(`Failed to load font for text editing: ${fontFamily}`, error);
        throw error; // Re-throw for caller to handle
      }
    },
    [loadForTextEditing],
  );

  return {
    categoryOptions,
    fetchGoogleFonts,
    fonts,
    hasMore,
    languageOptions,
    loadedFonts: sessionLoadedFonts,
    loadFont,
    loadFontForTextEditing,
    loading,
    loadMoreFonts,
  };
};
