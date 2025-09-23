import { match } from 'ts-pattern';

import { FLUXID_HOST } from '@core/helpers/api/flux-id';

const BACKEND_GOOGLE_FONTS_URL = '/api/google-fonts';
const url = new URL(BACKEND_GOOGLE_FONTS_URL, FLUXID_HOST);

// Cache configuration constants
const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours
const REQUEST_TIMEOUT = 10000; // 10 seconds
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_BASE = 1000; // 1 second

// Session-level tracking to prevent redundant requests
interface CacheMetadata {
  requestCount: number;
  sessionId: string;
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
  private sessionId: string;
  private backgroundRefreshPromise: null | Promise<GoogleFontsApiResponse> = null;

  constructor() {
    this.sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    console.log(`🚀 GoogleFontsApiCache initialized for session: ${this.sessionId}`);
  }

  /**
   * Get the complete Google Fonts catalog (cached)
   * Enhanced with session coordination and expiry handling
   */
  async getCache(): Promise<GoogleFontsApiResponse> {
    const startTime = Date.now();

    // Check if we have valid cached data
    if (this.cache && this.metadata) {
      const age = Date.now() - this.metadata.timestamp;

      if (age < CACHE_EXPIRY_TIME) {
        // Cache hit - valid data
        this.metrics.cacheHits++;
        console.log(`📦 Cache hit (age: ${Math.round(age / 1000)}s, session: ${this.sessionId})`);

        // Trigger background refresh if cache is more than 12 hours old
        if (age > CACHE_EXPIRY_TIME / 2 && !this.backgroundRefreshPromise) {
          this.triggerBackgroundRefresh();
        }

        return this.cache;
      } else {
        // Cache expired
        console.log(`⏰ Cache expired (age: ${Math.round(age / 1000)}s), refreshing...`);
        this.clearCache();
      }
    }

    // Check if there's already a request in progress
    if (this.loading) {
      console.log(`⏳ Joining existing request (session: ${this.sessionId})`);

      return this.loading;
    }

    // Start new request with enhanced tracking
    console.log(`🌐 Starting new API request (session: ${this.sessionId})`);
    this.metrics.totalRequests++;

    // Create the promise immediately and store it to ensure proper deduplication
    await Promise.resolve(); // To solve forever pending issue in some environments
    this.loading = this.fetchWithMetrics();

    try {
      this.cache = await this.loading;
      this.metadata = {
        requestCount: this.metrics.totalRequests,
        sessionId: this.sessionId,
        timestamp: Date.now(),
        version: '1.0',
      };

      this.metrics.successfulRequests++;
      this.metrics.averageResponseTime =
        (this.metrics.averageResponseTime * (this.metrics.successfulRequests - 1) + (Date.now() - startTime)) /
        this.metrics.successfulRequests;

      console.log(
        `✅ Cache updated successfully (${this.cache.items?.length || 0} fonts, ${Date.now() - startTime}ms)`,
      );
    } catch (error) {
      this.metrics.failedRequests++;
      console.error(`❌ Cache update failed after ${Date.now() - startTime}ms:`, error);
      throw error;
    } finally {
      this.loading = null;
    }

    return this.cache;
  }

  /**
   * Find a specific font by family name (optimized lookup)
   */
  async findFont(fontFamily: string): Promise<GoogleFontItem | null> {
    const cache = await this.getCache();

    return cache.items.find(({ family }) => family === fontFamily) || null;
  }

  /**
   * Clear the cache with enhanced logging
   */
  clearCache(): void {
    const wasLoaded = Boolean(this.cache);

    this.cache = null;
    this.loading = null;
    this.metadata = null;
    this.backgroundRefreshPromise = null;

    if (wasLoaded) {
      console.log(`🗑️ Google Fonts API cache cleared (session: ${this.sessionId})`);
    }
  }

  /**
   * Force reset for testing - completely resets the cache state
   */
  forceReset(): void {
    this.cache = null;
    this.loading = null;
    this.metadata = null;
    this.backgroundRefreshPromise = null;
    this.metrics = {
      averageResponseTime: 0,
      cacheHits: 0,
      failedRequests: 0,
      successfulRequests: 0,
      totalRequests: 0,
    };
    this.sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    console.log(`🔄 Cache force reset for session: ${this.sessionId}`);
  }

  /**
   * Get comprehensive cache status for debugging
   */
  getCacheStatus(): {
    age?: number;
    cached: boolean;
    isExpired?: boolean;
    isLoading: boolean;
    itemCount: number;
    metrics: RequestMetrics;
    sessionId: string;
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
      sessionId: this.sessionId,
    };
  }

  /**
   * Trigger background refresh for near-expired cache
   */
  private triggerBackgroundRefresh(): void {
    if (this.backgroundRefreshPromise) {
      return; // Already in progress
    }

    console.log(`🔄 Starting background cache refresh (session: ${this.sessionId})`);

    this.backgroundRefreshPromise = this.fetchWithMetrics()
      .then((data) => {
        // Update cache in background without disrupting current operations
        this.cache = data;
        this.metadata = {
          requestCount: this.metrics.totalRequests,
          sessionId: this.sessionId,
          timestamp: Date.now(),
          version: '1.0',
        };
        console.log(`🔄 Background refresh completed (${data.items?.length || 0} fonts)`);

        return data;
      })
      .catch((error) => {
        console.warn(`🔄 Background refresh failed, will retry on next request:`, error);
        throw error;
      })
      .finally(() => {
        this.backgroundRefreshPromise = null;
      });
  }

  /**
   * Enhanced fetch with metrics tracking and retry logic
   */
  private async fetchWithMetrics(): Promise<GoogleFontsApiResponse> {
    const startTime = Date.now();
    let lastError: Error;

    for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        console.log(`🌐 Fetch attempt ${attempt}/${MAX_RETRY_ATTEMPTS} (session: ${this.sessionId})`);

        // Create timeout promise for better Jest compatibility
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Request timeout after ${REQUEST_TIMEOUT}ms`)), REQUEST_TIMEOUT);
        });

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
        const responseTime = Date.now() - startTime;

        console.log(
          `✅ Google Fonts API response received (${data.items?.length || 0} fonts, ${responseTime}ms, session: ${this.sessionId})`,
        );

        return data;
      } catch (error) {
        lastError = error as Error;

        const isLastAttempt = attempt === MAX_RETRY_ATTEMPTS;

        if (error instanceof Error && error.message.includes('timeout')) {
          console.warn(`⏱️ Request timeout on attempt ${attempt} (session: ${this.sessionId})`);
        } else {
          console.warn(`❌ Request failed on attempt ${attempt} (session: ${this.sessionId}):`, error);
        }

        if (!isLastAttempt) {
          const delay = RETRY_DELAY_BASE * Math.pow(2, attempt - 1);

          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    console.error(`❌ All ${MAX_RETRY_ATTEMPTS} attempts failed (session: ${this.sessionId})`);
    throw lastError!;
  }

  /**
   * Get performance metrics
   */
  getMetrics(): RequestMetrics & { sessionId: string } {
    return { ...this.metrics, sessionId: this.sessionId };
  }
}

export const googleFontsApiCache = new GoogleFontsApiCache();
