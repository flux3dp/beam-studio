import { match } from 'ts-pattern';

import { FLUXID_HOST } from '@core/helpers/api/flux-id';

import { CACHE_EXPIRY_TIME, createTimeoutPromise, MAX_RETRY_ATTEMPTS, REQUEST_TIMEOUT } from './cacheUtils';

const BACKEND_GOOGLE_FONTS_URL = '/api/google-fonts';
const url = new URL(BACKEND_GOOGLE_FONTS_URL, FLUXID_HOST);

interface CacheMetadata {
  requestCount: number;
  timestamp: number;
  version: string;
}

interface RequestMetrics {
  averageResponseTime: number;
  cacheHits: number;
  failedRequests: number;
  successfulRequests: number;
  totalRequests: number;
}

export type GoogleFontFiles = Record<
  | '100'
  | '100italic'
  | '200'
  | '200italic'
  | '300'
  | '300italic'
  | '400'
  | '400italic'
  | '500'
  | '500italic'
  | '600'
  | '600italic'
  | '700'
  | '700italic'
  | '800'
  | '800italic'
  | '900'
  | '900italic'
  | 'italic'
  | 'regular',
  string | undefined
>;

export type GoogleFontItem = {
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
};

export type GoogleFontsApiResponse = {
  items: GoogleFontItem[];
  kind: string;
};

/**
 * Singleton cache manager for Google Fonts API responses
 * Features:
 * - Session-level coordination to prevent redundant requests
 * - Expiry handling with background refresh
 * - Comprehensive request tracking and monitoring
 * - Improved concurrent request handling
 */
class GoogleFontsApiCache {
  private cache: GoogleFontsApiResponse | null = null;
  private loading: null | Promise<GoogleFontsApiResponse> = null;
  private metadata: CacheMetadata | null = null;
  private metrics: RequestMetrics = {
    averageResponseTime: 0,
    cacheHits: 0,
    failedRequests: 0,
    successfulRequests: 0,
    totalRequests: 0,
  };
  private backgroundRefreshPromise: null | Promise<GoogleFontsApiResponse> = null;

  constructor() {}

  async getCache(): Promise<GoogleFontsApiResponse> {
    // Check if we have valid cached data
    if (this.cache && this.metadata) {
      const age = Date.now() - this.metadata.timestamp;

      if (age < CACHE_EXPIRY_TIME) {
        this.metrics.cacheHits++;

        if (age > CACHE_EXPIRY_TIME / 2 && !this.backgroundRefreshPromise) {
          this.triggerBackgroundRefresh();
        }

        return this.cache;
      } else {
        this.clearCache();
      }
    }

    if (this.loading) {
      return this.loading;
    }

    this.metrics.totalRequests++;

    this.loading = (async () => {
      await Promise.resolve(); // To solve forever pending issue in some environments

      return this.fetchWithMetrics();
    })();

    try {
      this.cache = await this.loading;
      this.metadata = { requestCount: this.metrics.totalRequests, timestamp: Date.now(), version: '1.0' };
      this.metrics.successfulRequests++;

      console.log(`✅ Google Fonts cache loaded: ${this.cache.items?.length || 0} fonts`);
    } catch (error) {
      this.metrics.failedRequests++;
      console.error('Failed to load Google Fonts cache:', error);
      throw error;
    } finally {
      this.loading = null;
    }

    return this.cache;
  }

  async findFont(fontFamily: string): Promise<GoogleFontItem | null> {
    const cache = await this.getCache();

    return cache.items.find(({ family }) => family === fontFamily) || null;
  }

  clearCache(): void {
    this.cache = null;
    this.loading = null;
    this.metadata = null;
    this.backgroundRefreshPromise = null;
  }

  getCacheStatus(): {
    age?: number;
    cached: boolean;
    isExpired?: boolean;
    isLoading: boolean;
    itemCount: number;
    metrics: RequestMetrics;
  } {
    const age = this.metadata ? Date.now() - this.metadata.timestamp : undefined;
    const isExpired = age ? age > CACHE_EXPIRY_TIME : false;

    return {
      age,
      cached: Boolean(this.cache),
      isExpired,
      isLoading: Boolean(this.loading),
      itemCount: this.cache?.items?.length || 0,
      metrics: { ...this.metrics },
    };
  }

  private triggerBackgroundRefresh(): void {
    if (this.backgroundRefreshPromise) {
      return;
    }

    this.backgroundRefreshPromise = this.fetchWithMetrics()
      .then((data) => {
        this.cache = data;
        this.metadata = {
          requestCount: this.metrics.totalRequests,
          timestamp: Date.now(),
          version: '1.0',
        };

        return data;
      })
      .catch((error) => {
        console.warn('Background Google Fonts refresh failed:', error);
        throw error;
      })
      .finally(() => {
        this.backgroundRefreshPromise = null;
      });
  }

  private async fetchWithMetrics(): Promise<GoogleFontsApiResponse> {
    let lastError: Error;

    for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        const timeoutPromise = createTimeoutPromise(REQUEST_TIMEOUT);
        const fetchPromise = fetch(url, {
          headers: { 'Content-Type': 'application/json' },
          method: 'GET',
        });

        const response = await Promise.race([fetchPromise, timeoutPromise]);

        if (!response.ok) {
          throw match(response.status)
            .with(401, () => new Error('Authentication required. Please log in to access Google Fonts.'))
            .with(403, () => new Error('Access denied. You do not have permission to access Google Fonts.'))
            .with(500, () => new Error('Backend server error. Please try again later.'))
            .otherwise(() => new Error(`${response.status} ${response.statusText}`));
        }

        const data = (await response.json()) as GoogleFontsApiResponse;

        return data;
      } catch (error) {
        lastError = error as Error;

        const isLastAttempt = attempt === MAX_RETRY_ATTEMPTS;

        if (error instanceof Error && error.message.includes('timeout')) {
          console.warn(`⏱️ Request timeout on attempt ${attempt}`);
        } else {
          console.warn(`❌ Request failed on attempt ${attempt}:`, error);
        }

        if (!isLastAttempt) {
          const delay = 1000 * Math.pow(2, attempt - 1);

          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    console.error(`❌ All ${MAX_RETRY_ATTEMPTS} attempts failed`);
    throw lastError!;
  }

  getMetrics(): RequestMetrics {
    return { ...this.metrics };
  }
}

export const googleFontsApiCache = new GoogleFontsApiCache();
