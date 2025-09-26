import type { GoogleFontItem } from '@core/helpers/fonts/googleFontsApiCache';
import { googleFontsApiCache } from '@core/helpers/fonts/googleFontsApiCache';

/**
 * Progressive Google Fonts Loader
 *
 * Implements efficient loading strategies:
 * - Search-based loading
 * - Category/language filtering
 * - Popular fonts preloading
 * - Pagination support
 */

// Popular fonts to preload (commonly used fonts)
const POPULAR_FONTS = [
  'Open Sans',
  'Roboto',
  'Lato',
  'Montserrat',
  'Source Sans Pro',
  'Oswald',
  'Poppins',
  'Raleway',
  'Ubuntu',
  'Nunito',
];

interface LoadingOptions {
  category?: string;
  limit?: number;
  offset?: number;
  searchTerm?: string;
  subset?: string;
}

interface LoadingResult {
  fonts: GoogleFontItem[];
  hasMore: boolean;
  total: number;
}

class ProgressiveGoogleFontsLoader {
  private allFonts: GoogleFontItem[] | null = null;
  private popularFonts: GoogleFontItem[] = [];
  private loading = false;

  /**
   * Initialize with popular fonts only (fast startup)
   */
  async initializeWithPopular(): Promise<GoogleFontItem[]> {
    if (this.popularFonts.length > 0) {
      return this.popularFonts;
    }

    try {
      const allFonts = await this.getAllFonts();

      this.popularFonts = allFonts.filter((font) => POPULAR_FONTS.includes(font.family));

      console.log(`🚀 Preloaded ${this.popularFonts.length} popular Google Fonts`);

      return this.popularFonts;
    } catch (error) {
      console.warn('Failed to load popular fonts:', error);

      return [];
    }
  }

  /**
   * Load fonts progressively based on search/filter criteria
   */
  async loadFonts(options: LoadingOptions = {}): Promise<LoadingResult> {
    const { category, limit = 50, offset = 0, searchTerm = '', subset } = options;

    try {
      const allFonts = await this.getAllFonts();

      // Apply filters
      let filteredFonts = allFonts.filter((font) => {
        // Filter out color fonts and icon fonts
        if (font.colorCapabilities && font.colorCapabilities.length > 0) return false;

        if (font.family.toLowerCase().includes('icons')) return false;

        // Category filter
        if (category && font.category !== category) return false;

        // Language/subset filter
        if (subset && !font.subsets.includes(subset)) return false;

        // Search filter
        if (searchTerm && !font.family.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }

        return true;
      });

      // Sort by relevance (popular fonts first, then alphabetical)
      filteredFonts = filteredFonts.sort((a, b) => {
        const aIsPopular = POPULAR_FONTS.includes(a.family);
        const bIsPopular = POPULAR_FONTS.includes(b.family);

        if (aIsPopular && !bIsPopular) return -1;

        if (!aIsPopular && bIsPopular) return 1;

        return a.family.localeCompare(b.family);
      });

      // Apply pagination
      const paginatedFonts = filteredFonts.slice(offset, offset + limit);

      return {
        fonts: paginatedFonts,
        hasMore: offset + limit < filteredFonts.length,
        total: filteredFonts.length,
      };
    } catch (error) {
      console.error('Failed to load fonts progressively:', error);

      return { fonts: [], hasMore: false, total: 0 };
    }
  }

  /**
   * Search fonts with optimized performance
   */
  async searchFonts(searchTerm: string, limit = 20): Promise<GoogleFontItem[]> {
    if (!searchTerm.trim()) {
      return this.popularFonts.slice(0, limit);
    }

    const result = await this.loadFonts({ limit, searchTerm });

    return result.fonts;
  }

  /**
   * Get fonts by category with pagination
   */
  async getFontsByCategory(category: string, limit = 50, offset = 0): Promise<LoadingResult> {
    return this.loadFonts({ category, limit, offset });
  }

  /**
   * Get fonts by language/subset with pagination
   */
  async getFontsByLanguage(subset: string, limit = 50, offset = 0): Promise<LoadingResult> {
    return this.loadFonts({ limit, offset, subset });
  }

  /**
   * Get all available categories
   */
  async getCategories(): Promise<string[]> {
    const allFonts = await this.getAllFonts();
    const categories = [...new Set(allFonts.map((font) => font.category))];

    return categories.sort();
  }

  /**
   * Get all available languages/subsets
   */
  async getLanguages(): Promise<Array<{ label: string; value: string }>> {
    const allFonts = await this.getAllFonts();
    const allSubsets = new Set<string>();

    allFonts.forEach(({ subsets }) => {
      subsets.forEach((subset) => allSubsets.add(subset));
    });

    const languageMapping: Record<string, string> = {
      'chinese-hongkong': 'Chinese (Hong Kong)',
      'chinese-simplified': 'Chinese Simplified',
      'chinese-traditional': 'Chinese Traditional',
    };

    const parseSubsetLabel = (subset: string): string => {
      if (languageMapping[subset]) {
        return languageMapping[subset];
      }

      if (subset.endsWith('-ext')) {
        const baseName = subset.slice(0, -4);

        return `${baseName.charAt(0).toUpperCase() + baseName.slice(1)} Extended`;
      }

      return subset
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    return Array.from(allSubsets)
      .sort()
      .map((subset) => ({ label: parseSubsetLabel(subset), value: subset }));
  }

  /**
   * Preload additional fonts in the background
   */
  async preloadAdditionalFonts(): Promise<void> {
    if (this.allFonts) return; // Already loaded

    // Load in background without blocking UI
    setTimeout(async () => {
      try {
        await this.getAllFonts();
        console.log(`📖 Background loaded ${this.allFonts?.length || 0} additional Google Fonts`);
      } catch (error) {
        console.warn('Background font loading failed:', error);
      }
    }, 2000); // 2 second delay to not block initial UI
  }

  /**
   * Get all fonts (with caching)
   */
  private async getAllFonts(): Promise<GoogleFontItem[]> {
    if (this.allFonts) return this.allFonts;

    if (this.loading) {
      // Wait for existing load to complete
      while (this.loading) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      return this.allFonts || [];
    }

    this.loading = true;
    try {
      const data = await googleFontsApiCache.getCache();

      this.allFonts = data.items || [];

      return this.allFonts;
    } finally {
      this.loading = false;
    }
  }

  /**
   * Clear cache (for testing or refresh)
   */
  clearCache(): void {
    this.allFonts = null;
    this.popularFonts = [];
  }
}

export const progressiveGoogleFontsLoader = new ProgressiveGoogleFontsLoader();
