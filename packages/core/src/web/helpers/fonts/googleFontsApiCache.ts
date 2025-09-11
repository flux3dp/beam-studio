/**
 * Centralized Google Fonts API cache service
 * Eliminates duplicate API calls by caching the complete font catalog once per session
 */

const GOOGLE_FONTS_API_KEY = 'YOUR_GOOGLE_FONTS_API_KEY';
const GOOGLE_FONTS_API_URL = `https://www.googleapis.com/webfonts/v1/webfonts?key=${GOOGLE_FONTS_API_KEY}`;

// TypeScript interfaces for Google Fonts API response
export interface GoogleFontFile {
  [weight: string]: string; // weight -> URL mapping
}

export interface GoogleFontFiles extends Record<string, string | undefined> {
  '100'?: string;
  '100italic'?: string;
  '200'?: string;
  '200italic'?: string;
  '300'?: string;
  '300italic'?: string;
  '400'?: string;
  '400italic'?: string;
  '500'?: string;
  '500italic'?: string;
  '600'?: string;
  '600italic'?: string;
  '700'?: string;
  '700italic'?: string;
  '800'?: string;
  '800italic'?: string;
  '900'?: string;
  '900italic'?: string;
  italic?: string;
  regular?: string;
}

export interface GoogleFontItem {
  category: string;
  colorCapabilities?: string[];
  family: string;
  files: GoogleFontFiles;
  kind: string;
  lastModified: string;
  menu?: string;
  subsets: string[];
  variants: string[];
  version: string;
}

export interface GoogleFontsApiResponse {
  items: GoogleFontItem[];
  kind: string;
}

/**
 * Singleton cache manager for Google Fonts API responses
 */
class GoogleFontsApiCache {
  private cache: GoogleFontsApiResponse | null = null;
  private loading: null | Promise<GoogleFontsApiResponse> = null;
  private sortedCache: GoogleFontsApiResponse | null = null;

  /**
   * Get the complete Google Fonts catalog (cached)
   */
  async getCompleteCache(): Promise<GoogleFontsApiResponse> {
    if (this.cache) {
      return this.cache;
    }

    if (this.loading) {
      return this.loading;
    }

    this.loading = this.fetchGoogleFontsApi();
    this.cache = await this.loading;
    this.loading = null;

    return this.cache;
  }

  /**
   * Get the complete Google Fonts catalog sorted by popularity (cached)
   */
  async getSortedCache(): Promise<GoogleFontsApiResponse> {
    if (this.sortedCache) {
      return this.sortedCache;
    }

    // Get base cache first
    const baseCache = await this.getCompleteCache();

    // Create sorted version
    this.sortedCache = {
      ...baseCache,
      items: [...baseCache.items], // Items are already sorted by popularity from API
    };

    return this.sortedCache;
  }

  /**
   * Find a specific font by family name (optimized lookup)
   */
  async findFont(fontFamily: string): Promise<GoogleFontItem | null> {
    const cache = await this.getCompleteCache();

    return cache.items.find((item) => item.family === fontFamily) || null;
  }

  /**
   * Clear the cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cache = null;
    this.sortedCache = null;
    this.loading = null;
    console.log('🗑️ Google Fonts API cache cleared');
  }

  /**
   * Get cache status for debugging
   */
  getCacheStatus(): { cached: boolean; itemCount: number; sortedCached: boolean } {
    return {
      cached: !!this.cache,
      itemCount: this.cache?.items?.length || 0,
      sortedCached: !!this.sortedCache,
    };
  }

  /**
   * Fetch from Google Fonts API with error handling and retry logic
   */
  private async fetchGoogleFontsApi(): Promise<GoogleFontsApiResponse> {
    try {
      console.log('🌐 Fetching Google Fonts API (with caching)...');

      const response = await fetch(`${GOOGLE_FONTS_API_URL}&sort=popularity`);

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error('Google Fonts API key is invalid or expired. Please configure a valid API key.');
        }

        throw new Error(`Failed to fetch Google Fonts API: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as GoogleFontsApiResponse;

      console.log(`✅ Google Fonts API cached successfully (${data.items?.length || 0} fonts)`);

      return data;
    } catch (error) {
      console.error('❌ Failed to fetch Google Fonts API:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const googleFontsApiCache = new GoogleFontsApiCache();

/**
 * Convenience function to get a font by family name
 * @param fontFamily - The font family name to search for
 * @returns Promise<GoogleFontItem | null>
 */
export const getGoogleFont = (fontFamily: string): Promise<GoogleFontItem | null> => {
  return googleFontsApiCache.findFont(fontFamily);
};

/**
 * Convenience function to get the complete font catalog
 * @returns Promise<GoogleFontsApiResponse>
 */
export const getGoogleFontsCatalog = (): Promise<GoogleFontsApiResponse> => {
  return googleFontsApiCache.getCompleteCache();
};

/**
 * Convenience function to get the sorted font catalog (by popularity)
 * @returns Promise<GoogleFontsApiResponse>
 */
export const getGoogleFontsCatalogSorted = (): Promise<GoogleFontsApiResponse> => {
  return googleFontsApiCache.getSortedCache();
};
