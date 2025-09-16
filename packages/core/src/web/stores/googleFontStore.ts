import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { registerGoogleFont } from '@core/app/actions/beambox/font-funcs';
import { useStorageStore } from '@core/app/stores/storageStore';
import { getGoogleFont } from '@core/helpers/fonts/googleFontsApiCache';
import type { GeneralFont, GoogleFont } from '@core/interfaces/IFont';

// Performance configuration constants
const FONT_LOAD_TIMEOUT = 10000; // 10 seconds timeout
const MAX_RETRY_ATTEMPTS = 3; // Maximum retry attempts
const RETRY_DELAY_BASE = 1000; // Base delay for exponential backoff (1 second)
const MAX_CONCURRENT_LOADS = 5; // Maximum concurrent font loads
const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Icon font detection - these contain symbols/icons, not text
const ICON_FONT_KEYWORDS = ['icons'];

/**
 * Checks if a font is likely an icon/symbol font unsuitable for text
 */
const isIconFont = (fontFamily: string): boolean => {
  const lowerName = fontFamily.toLowerCase();

  return ICON_FONT_KEYWORDS.some((keyword) => lowerName.includes(keyword));
};

/**
 * Creates a network state detector
 */
const createNetworkDetector = (): NetworkState => {
  const connection =
    (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

  return {
    effectiveType: connection?.effectiveType || 'unknown',
    isOnline: navigator.onLine,
    lastChecked: Date.now(),
  };
};

/**
 * Exponential backoff delay calculation
 */
const calculateRetryDelay = (attempt: number): number => {
  return RETRY_DELAY_BASE * Math.pow(2, attempt - 1) + Math.random() * 1000; // Add jitter
};

/**
 * Creates a timeout promise that rejects after specified milliseconds
 */
const createTimeoutPromise = (ms: number): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms);
  });
};

/**
 * Fetch with timeout and retry logic
 */
const fetchWithRetry = async (url: string, attempts = 1): Promise<Response> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const fetchPromise = fetch(url);
      const timeoutPromise = createTimeoutPromise(FONT_LOAD_TIMEOUT);

      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (response.ok) {
        return response;
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error as Error;
      console.warn(`Font fetch attempt ${attempt}/${attempts} failed:`, error);

      if (attempt < attempts) {
        const delay = calculateRetryDelay(attempt);

        console.log(`Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
};

/**
 * Interface for font loading analytics
 */
export interface FontLoadingMetrics {
  errorMessage?: string;
  fontFamily: string;
  loadTime: number;
  retryCount: number;
  success: boolean;
  timestamp: number;
}

/**
 * Interface for network state
 */
export interface NetworkState {
  effectiveType?: string; // 'slow-2g' | '2g' | '3g' | '4g'
  isOnline: boolean;
  lastChecked: number;
}

/**
 * Interface for cached Google Font binary data
 */
export interface GoogleFontBinary {
  buffer: ArrayBuffer;
  family: string;
  style: 'italic' | 'normal';
  timestamp: number;
  weight: number;
}

/**
 * Google Font Store State Interface
 */
interface GoogleFontState {
  // Concurrency control
  activeFontLoads: Set<string>;
  addToHistory: (font: GeneralFont) => void;
  // Binary cache for text-to-path conversion
  cachedBinaries: Map<string, GoogleFontBinary>;

  clearBinaryCache: () => void;

  // Error handling
  failedLoads: Map<string, { count: number; error?: string; lastAttempt: number }>;
  getBinaryFromCache: (fontFamily: string, weight?: number, style?: 'italic' | 'normal') => GoogleFontBinary | null;
  getLoadedFonts: () => string[];
  getRegisteredFonts: () => string[];

  // Getters
  isGoogleFontLoaded: (fontFamily: string) => boolean;
  isGoogleFontLoading: (fontFamily: string) => boolean;
  isGoogleFontRegistered: (fontFamily: string) => boolean;
  // Actions
  loadGoogleFont: (fontFamily: string) => Promise<void>;
  loadGoogleFontBinary: (
    fontFamily: string,
    weight?: number,
    style?: 'italic' | 'normal',
  ) => Promise<ArrayBuffer | null>;
  loadingFonts: Set<string>;

  networkState: NetworkState;
  processQueue: () => void;
  queuedFontLoads: string[];

  registeredFonts: Set<string>;
  registerGoogleFont: (fontFamily: string) => void;

  retryFailedFont: (fontFamily: string) => Promise<void>;
  // Loading state
  sessionLoadedFonts: Set<string>;
  updateNetworkState: () => void;
}

/**
 * Create binary loader function for Google Fonts with performance tracking
 */
const createBinaryLoader = (
  getCachedBinary: (fontFamily: string, weight?: number, style?: 'italic' | 'normal') => GoogleFontBinary | null,
  setCachedBinary: (
    fontFamily: string,
    weight: number,
    style: 'italic' | 'normal',
    buffer: ArrayBuffer,
    loadTime: number,
  ) => void,
  networkState: NetworkState,
) => {
  return async (
    fontFamily: string,
    weight = 400,
    style: 'italic' | 'normal' = 'normal',
  ): Promise<ArrayBuffer | null> => {
    const startTime = Date.now();

    // Check cache first
    const cached = getCachedBinary(fontFamily, weight, style);

    if (cached) {
      // Check if cache is expired
      if (Date.now() - cached.timestamp < CACHE_EXPIRY_TIME) {
        return cached.buffer;
      }
    }

    // Check network state
    if (!networkState.isOnline) {
      return null;
    }

    try {
      // Get font data from cache
      const fontData = await getGoogleFont(fontFamily);

      if (!fontData) {
        throw new Error(`Font ${fontFamily} not found in Google Fonts API cache`);
      }

      if (isIconFont(fontFamily)) {
        return null; // Filter out icon fonts
      }

      // Find the correct variant
      const variantKey =
        style === 'normal' && weight === 400
          ? 'regular'
          : style === 'italic' && weight === 400
            ? 'italic'
            : style === 'italic'
              ? `${weight}italic`
              : `${weight}`;

      const fontUrl = fontData.files?.[variantKey] || fontData.files?.regular || Object.values(fontData.files || {})[0];

      if (!fontUrl) {
        return null;
      }

      // Fetch font binary data with retry logic
      const fontResponse = await fetchWithRetry(fontUrl as string, MAX_RETRY_ATTEMPTS);
      const ttfBuffer = await fontResponse.arrayBuffer();
      const loadTime = Date.now() - startTime;

      // Cache the binary with load time
      setCachedBinary(fontFamily, weight, style, ttfBuffer, loadTime);

      return ttfBuffer;
    } catch (error) {
      console.error(`Failed to load Google Font binary for ${fontFamily} ${weight} ${style}:`, error);

      return null;
    }
  };
};

/**
 * Create Google Font object for registration
 */
const createGoogleFontObject = (
  fontFamily: string,
  weight = 400,
  style: 'italic' | 'normal' = 'normal',
  binaryLoader: (fontFamily: string, weight?: number, style?: 'italic' | 'normal') => Promise<ArrayBuffer | null>,
): GoogleFont => {
  return {
    binaryLoader,
    family: fontFamily,
    italic: style === 'italic',
    postscriptName: fontFamily.replace(/\s+/g, '') + (style === 'italic' ? '-Italic' : '-Regular'),
    source: 'google',
    style: style === 'italic' ? 'Italic' : 'Regular',
    weight,
  };
};

/**
 * Zustand Google Font Store
 */
export const useGoogleFontStore = create<GoogleFontState>()(
  devtools(
    (set, get) => ({
      // Concurrency control
      activeFontLoads: new Set(),
      // Add font to history
      addToHistory: (font: GeneralFont) => {
        if (!font.family) return;

        const fontHistory = useStorageStore.getState()['font-history'];

        // Remove if already exists and add to front
        const newHistory = fontHistory.filter((name) => name !== font.family);

        newHistory.unshift(font.family);

        // Keep only latest 5
        if (newHistory.length > 5) newHistory.pop();

        useStorageStore.getState().set('font-history', newHistory);
      },
      cachedBinaries: new Map<string, GoogleFontBinary>(),
      // Clear binary cache
      clearBinaryCache: () => {
        set({ cachedBinaries: new Map() });
      },

      // Error handling and retry logic
      failedLoads: new Map(),

      getBinaryFromCache: (fontFamily: string, weight = 400, style: 'italic' | 'normal' = 'normal') => {
        const cacheKey = `${fontFamily}-${weight}-${style}`;

        return get().cachedBinaries.get(cacheKey) || null;
      },

      getLoadedFonts: () => {
        return Array.from(get().sessionLoadedFonts);
      },

      getRegisteredFonts: () => {
        return Array.from(get().registeredFonts);
      },

      // Getters
      isGoogleFontLoaded: (fontFamily: string) => {
        return get().sessionLoadedFonts.has(fontFamily);
      },
      isGoogleFontLoading: (fontFamily: string) => {
        return get().loadingFonts.has(fontFamily);
      },

      isGoogleFontRegistered: (fontFamily: string) => {
        return get().registeredFonts.has(fontFamily);
      },
      // Load Google Font CSS with performance enhancements
      loadGoogleFont: async (fontFamily: string) => {
        const state = get();

        // Skip if already loaded or loading
        if (state.sessionLoadedFonts.has(fontFamily) || state.loadingFonts.has(fontFamily)) {
          return;
        }

        // Filter out icon fonts
        if (isIconFont(fontFamily)) {
          return;
        }

        // Check network state
        if (!state.networkState.isOnline) {
          set((state) => ({
            queuedFontLoads: [...state.queuedFontLoads, fontFamily],
          }));

          return;
        }

        // Check concurrency limit
        if (state.activeFontLoads.size >= MAX_CONCURRENT_LOADS) {
          set((state) => ({
            queuedFontLoads: [...state.queuedFontLoads, fontFamily],
          }));

          return;
        }

        // Mark as loading and active
        set((state) => ({
          activeFontLoads: new Set(state.activeFontLoads).add(fontFamily),
          loadingFonts: new Set(state.loadingFonts).add(fontFamily),
        }));

        let retryCount = 0;

        const attemptLoad = async (): Promise<void> => {
          try {
            // Create Google Fonts URL
            const fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@400&display=swap`;

            // Check if CSS link already exists in DOM
            if (!document.querySelector(`link[href="${fontUrl}"]`)) {
              // Create and append link element with timeout
              const link = document.createElement('link');

              link.href = fontUrl;
              link.rel = 'stylesheet';

              // Promise that resolves when font loads or times out
              await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => {
                  reject(new Error(`Font CSS load timeout after ${FONT_LOAD_TIMEOUT}ms`));
                }, FONT_LOAD_TIMEOUT);

                link.onload = () => {
                  clearTimeout(timeout);
                  resolve();
                };

                link.onerror = (error) => {
                  clearTimeout(timeout);
                  reject(new Error(`Font CSS failed to load: ${error}`));
                };

                document.head.appendChild(link);
              });
            }

            // Mark as loaded and remove from active
            set((state) => ({
              activeFontLoads: new Set([...state.activeFontLoads].filter((f) => f !== fontFamily)),
              failedLoads: new Map([...state.failedLoads].filter(([key]) => key !== fontFamily)),
              loadingFonts: new Set([...state.loadingFonts].filter((f) => f !== fontFamily)),
              sessionLoadedFonts: new Set(state.sessionLoadedFonts).add(fontFamily),
            }));

            // Process queue
            setTimeout(() => get().processQueue(), 100);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);

            retryCount++;

            console.warn(`Font load attempt ${retryCount}/${MAX_RETRY_ATTEMPTS} failed for ${fontFamily}:`, error);

            if (retryCount < MAX_RETRY_ATTEMPTS) {
              const delay = calculateRetryDelay(retryCount);

              console.log(`Retrying ${fontFamily} in ${delay}ms...`);

              await new Promise((resolve) => setTimeout(resolve, delay));

              return attemptLoad();
            } else {
              // All retries failed
              set((state) => ({
                activeFontLoads: new Set([...state.activeFontLoads].filter((f) => f !== fontFamily)),
                failedLoads: new Map(state.failedLoads).set(fontFamily, {
                  count: retryCount,
                  error: errorMessage,
                  lastAttempt: Date.now(),
                }),
                loadingFonts: new Set([...state.loadingFonts].filter((f) => f !== fontFamily)),
              }));

              console.error(`Failed to load Google Font CSS after ${retryCount} attempts: ${fontFamily}`);

              // Process queue anyway
              setTimeout(() => get().processQueue(), 100);
            }
          }
        };

        await attemptLoad();
      },

      // Load Google Font binary data
      loadGoogleFontBinary: async (fontFamily: string, weight = 400, style: 'italic' | 'normal' = 'normal') => {
        const state = get();
        const binaryLoader = createBinaryLoader(
          (family, w, s) => state.getBinaryFromCache(family, w, s),
          (family, w, s, buffer) => {
            set((state) => {
              const newMap = new Map(state.cachedBinaries);
              const cacheKey = `${family}-${w}-${s}`;

              newMap.set(cacheKey, {
                buffer,
                family,
                style: s,
                timestamp: Date.now(),
                weight: w,
              });

              return { cachedBinaries: newMap };
            });
          },
          state.networkState,
        );

        return binaryLoader(fontFamily, weight, style);
      },

      loadingFonts: new Set<string>(),

      // Network state management
      networkState: createNetworkDetector(),
      processQueue: () => {
        const state = get();

        while (state.activeFontLoads.size < MAX_CONCURRENT_LOADS && state.queuedFontLoads.length > 0) {
          const fontFamily = state.queuedFontLoads.shift()!;

          if (!state.sessionLoadedFonts.has(fontFamily) && !state.activeFontLoads.has(fontFamily)) {
            state.activeFontLoads.add(fontFamily);

            // Process asynchronously
            get()
              .loadGoogleFont(fontFamily)
              .finally(() => {
                set((state) => {
                  const newActive = new Set(state.activeFontLoads);

                  newActive.delete(fontFamily);

                  return { activeFontLoads: newActive };
                });

                // Process next in queue
                setTimeout(() => get().processQueue(), 100);
              });
          }
        }
      },
      queuedFontLoads: [],

      registeredFonts: new Set<string>(),

      // Register Google Font for text-to-path conversion
      registerGoogleFont: (fontFamily: string) => {
        const state = get();

        if (state.registeredFonts.has(fontFamily)) {
          return;
        }

        // Create GoogleFont object
        const googleFont = createGoogleFontObject(fontFamily, 400, 'normal', (family, weight, style) =>
          state.loadGoogleFontBinary(family, weight, style),
        );

        // Register with FontFuncs
        const registered = registerGoogleFont(googleFont);

        if (registered) {
          set((state) => ({ registeredFonts: new Set(state.registeredFonts).add(fontFamily) }));
        } else {
          console.warn(`Failed to register Google Font: ${fontFamily}`);
        }
      },

      retryFailedFont: async (fontFamily: string) => {
        const failedLoad = get().failedLoads.get(fontFamily);

        if (!failedLoad) return;

        const timeSinceLastAttempt = Date.now() - failedLoad.lastAttempt;
        const minimumWaitTime = calculateRetryDelay(failedLoad.count);

        if (timeSinceLastAttempt < minimumWaitTime) {
          return;
        }

        await get().loadGoogleFont(fontFamily);
      },

      // Initial state
      sessionLoadedFonts: new Set<string>(),

      updateNetworkState: () => {
        const newState = createNetworkDetector();

        set({ networkState: newState });

        if (newState.isOnline && get().queuedFontLoads.length > 0) {
          get().processQueue();
        }
      },
    }),
    { name: 'google-font-store' },
  ),
);

// Convenience hooks for specific state slices
export const useLoadedGoogleFonts = () => useGoogleFontStore((state) => state.sessionLoadedFonts);

export const useRegisteredGoogleFonts = () => useGoogleFontStore((state) => state.registeredFonts);

export const useGoogleFontActions = () =>
  useGoogleFontStore((state) => ({
    addToHistory: state.addToHistory,
    clearBinaryCache: state.clearBinaryCache,
    loadGoogleFont: state.loadGoogleFont,
    loadGoogleFontBinary: state.loadGoogleFontBinary,
    registerGoogleFont: state.registerGoogleFont,
  }));

export const useGoogleFontGetters = () =>
  useGoogleFontStore((state) => ({
    getBinaryFromCache: state.getBinaryFromCache,
    getLoadedFonts: state.getLoadedFonts,
    getRegisteredFonts: state.getRegisteredFonts,
    isGoogleFontLoaded: state.isGoogleFontLoaded,
    isGoogleFontLoading: state.isGoogleFontLoading,
    isGoogleFontRegistered: state.isGoogleFontRegistered,
  }));

// Network state management - Set up event listeners
if (typeof window !== 'undefined') {
  const store = useGoogleFontStore.getState();

  // Listen for online/offline events
  window.addEventListener('online', () => {
    store.updateNetworkState();
  });

  window.addEventListener('offline', () => {
    store.updateNetworkState();
  });

  // Listen for connection changes (if supported)
  if ('connection' in navigator) {
    const connection =
      (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

    if (connection && 'addEventListener' in connection) {
      connection.addEventListener('change', () => {
        store.updateNetworkState();
      });
    }
  }

  // Periodic network state check (every 30 seconds)
  setInterval(() => {
    const currentState = useGoogleFontStore.getState().networkState;
    const now = Date.now();

    // Only update if it's been more than 30 seconds since last check
    if (now - currentState.lastChecked > 30000) {
      store.updateNetworkState();
    }
  }, 30000);
}
