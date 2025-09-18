import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { registerGoogleFont } from '@core/app/actions/beambox/font-funcs';
import { useStorageStore } from '@core/app/stores/storageStore';
import { getGoogleFont } from '@core/helpers/fonts/googleFontsApiCache';
import type { GeneralFont, GoogleFont } from '@core/interfaces/IFont';

// Network and timing constants
const FONT_LOAD_TIMEOUT = 10000;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_BASE = 1000;
const RETRY_JITTER_MAX = 1000;
const MAX_CONCURRENT_LOADS = 5;
const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours
const NETWORK_STATE_CHECK_INTERVAL = 30000; // 30 seconds
const CSS_CLEANUP_INTERVAL = 300000; // 5 minutes

// Font processing constants
const DEFAULT_FONT_WEIGHT = 400;
const FONT_HISTORY_MAX_SIZE = 5;
const INITIAL_USAGE_COUNT = 1;
const QUEUE_PROCESS_DELAY = 100;

// Priority ordering for font loading queue
const PRIORITY_ORDER = { critical: 0, high: 1, low: 3, normal: 2 };

// Font filtering
const ICON_FONT_KEYWORDS = ['icons'];

const isIconFont = (fontFamily: string): boolean => {
  const lowerName = fontFamily.toLowerCase();

  return ICON_FONT_KEYWORDS.some((keyword) => lowerName.includes(keyword));
};

const createNetworkDetector = (): NetworkState => {
  const connection =
    (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

  return {
    effectiveType: connection?.effectiveType || 'unknown',
    isOnline: navigator.onLine,
    lastChecked: Date.now(),
  };
};

const calculateRetryDelay = (attempt: number): number => {
  return RETRY_DELAY_BASE * Math.pow(2, attempt - 1) + Math.random() * RETRY_JITTER_MAX;
};

const createTimeoutPromise = (ms: number): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms);
  });
};

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

      if (attempt < attempts) {
        const delay = calculateRetryDelay(attempt);

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
};

export interface NetworkState {
  effectiveType?: string;
  isOnline: boolean;
  lastChecked: number;
}

export interface GoogleFontBinary {
  buffer: ArrayBuffer;
  family: string;
  style: 'italic' | 'normal';
  timestamp: number;
  weight: number;
}

export type FontLoadPurpose = 'context' | 'preview' | 'static' | 'text-editing';
export type FontLoadPriority = 'critical' | 'high' | 'low' | 'normal';

export interface FontLoadOptions {
  fontFamily: string;
  forceReload?: boolean;
  priority?: FontLoadPriority;
  purpose: FontLoadPurpose;
  style?: 'italic' | 'normal';
  weight?: number;
}

interface CSSLinkTracker {
  element: HTMLLinkElement;
  fontFamily: string;
  lastUsed: number;
  purpose: FontLoadPurpose;
  url: string;
  usageCount: number;
}

interface GoogleFontState {
  activeFontLoads: Set<string>;
  addToHistory: (font: GeneralFont) => void;
  cachedBinaries: Map<string, GoogleFontBinary>;
  cleanupUnusedCSSLinks: (maxAge?: number) => void;
  clearBinaryCache: () => void;
  cssLinks: Map<string, CSSLinkTracker>;
  failedLoads: Map<string, { count: number; error?: string; lastAttempt: number }>;
  getBinaryFromCache: (fontFamily: string, weight?: number, style?: 'italic' | 'normal') => GoogleFontBinary | null;
  getLoadedFonts: () => string[];
  getRegisteredFonts: () => string[];
  isGoogleFontLoaded: (fontFamily: string) => boolean;
  isGoogleFontLoading: (fontFamily: string) => boolean;
  isGoogleFontRegistered: (fontFamily: string) => boolean;
  loadGoogleFont: (fontFamily: string) => Promise<void>;
  loadGoogleFontBinary: (
    fontFamily: string,
    weight?: number,
    style?: 'italic' | 'normal',
  ) => Promise<ArrayBuffer | null>;
  loadGoogleFontForPreview: (fontFamily: string) => Promise<void>;
  loadGoogleFontWithOptions: (options: FontLoadOptions) => Promise<void>;
  loadingFonts: Set<string>;
  networkState: NetworkState;
  processQueue: () => void;
  queuedFontLoads: Array<{ fontFamily: string; priority: FontLoadPriority; purpose: FontLoadPurpose }>;
  registeredFonts: Set<string>;
  registerGoogleFont: (fontFamily: string) => void;
  retryFailedFont: (fontFamily: string) => Promise<void>;
  sessionLoadedFonts: Set<string>;
  updateNetworkState: () => void;
}

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
    weight = DEFAULT_FONT_WEIGHT,
    style: 'italic' | 'normal' = 'normal',
  ): Promise<ArrayBuffer | null> => {
    const startTime = Date.now();

    const cached = getCachedBinary(fontFamily, weight, style);

    if (cached) {
      if (Date.now() - cached.timestamp < CACHE_EXPIRY_TIME) {
        return cached.buffer;
      }
    }

    if (!networkState.isOnline) {
      return null;
    }

    try {
      const fontData = await getGoogleFont(fontFamily);

      if (!fontData) {
        throw new Error(`Font ${fontFamily} not found in Google Fonts API cache`);
      }

      if (isIconFont(fontFamily)) {
        return null;
      }

      const variantKey =
        style === 'normal' && weight === DEFAULT_FONT_WEIGHT
          ? 'regular'
          : style === 'italic' && weight === DEFAULT_FONT_WEIGHT
            ? 'italic'
            : style === 'italic'
              ? `${weight}italic`
              : `${weight}`;

      const fontUrl = fontData.files?.[variantKey] || fontData.files?.regular || Object.values(fontData.files || {})[0];

      if (!fontUrl) {
        return null;
      }

      const fontResponse = await fetchWithRetry(fontUrl as string, MAX_RETRY_ATTEMPTS);
      const ttfBuffer = await fontResponse.arrayBuffer();
      const loadTime = Date.now() - startTime;

      setCachedBinary(fontFamily, weight, style, ttfBuffer, loadTime);

      return ttfBuffer;
    } catch (error) {
      console.error(`Failed to load Google Font binary for ${fontFamily} ${weight} ${style}:`, error);

      return null;
    }
  };
};

const createGoogleFontObject = (
  fontFamily: string,
  weight = DEFAULT_FONT_WEIGHT,
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

export const useGoogleFontStore = create<GoogleFontState>()(
  devtools(
    (set, get) => ({
      activeFontLoads: new Set(),
      addToHistory: (font: GeneralFont) => {
        if (!font.family) return;

        const fontHistory = useStorageStore.getState()['font-history'];
        const newHistory = fontHistory.filter((name) => name !== font.family);

        newHistory.unshift(font.family);

        if (newHistory.length > FONT_HISTORY_MAX_SIZE) newHistory.pop();

        useStorageStore.getState().set('font-history', newHistory);
      },
      cachedBinaries: new Map<string, GoogleFontBinary>(),

      cleanupUnusedCSSLinks: (maxAge = CSS_CLEANUP_INTERVAL) => {
        const now = Date.now();
        const state = get();
        const updatedLinks = new Map(state.cssLinks);
        let cleanedCount = 0;

        const fontsInUse = new Set<string>();

        try {
          const textElements = [
            ...document.querySelectorAll('#svgcontent g.layer:not([display="none"]) text'),
            ...document.querySelectorAll('#svg_defs text'),
          ] as SVGTextElement[];

          textElements.forEach((textElem) => {
            const fontFamily = textElem.getAttribute('font-family');

            if (fontFamily) {
              const cleanFontFamily = fontFamily.replace(/^['"]+|['"]+$/g, '').trim();

              if (cleanFontFamily) {
                fontsInUse.add(cleanFontFamily);
              }
            }
          });
        } catch (error) {
          console.warn('Failed to scan document for font usage during cleanup:', error);
        }

        for (const [fontFamily, tracker] of updatedLinks.entries()) {
          const isActivelyUsed = fontsInUse.has(fontFamily);
          const isOld = now - tracker.lastUsed > maxAge;
          const isTextEditingFont = tracker.purpose === 'text-editing';

          if (isOld && !isActivelyUsed && !isTextEditingFont) {
            if (tracker.element && tracker.element.parentNode) {
              tracker.element.parentNode.removeChild(tracker.element);
            }

            updatedLinks.delete(fontFamily);
            cleanedCount++;
          } else if (isActivelyUsed) {
            tracker.lastUsed = now;
            updatedLinks.set(fontFamily, tracker);
          }
        }

        if (cleanedCount > 0 || fontsInUse.size > 0) {
          set({ cssLinks: updatedLinks });

          if (cleanedCount > 0) {
            console.log(`🗑️ Cleaned up ${cleanedCount} unused Google Font CSS links.`);
          }
        }
      },
      clearBinaryCache: () => {
        set({ cachedBinaries: new Map() });
      },
      cssLinks: new Map<string, CSSLinkTracker>(),
      failedLoads: new Map(),
      getBinaryFromCache: (fontFamily: string, weight = DEFAULT_FONT_WEIGHT, style: 'italic' | 'normal' = 'normal') => {
        const cacheKey = `${fontFamily}-${weight}-${style}`;

        return get().cachedBinaries.get(cacheKey) || null;
      },

      getLoadedFonts: () => {
        return Array.from(get().sessionLoadedFonts);
      },

      getRegisteredFonts: () => {
        return Array.from(get().registeredFonts);
      },

      isGoogleFontLoaded: (fontFamily: string) => {
        return get().sessionLoadedFonts.has(fontFamily);
      },
      isGoogleFontLoading: (fontFamily: string) => {
        return get().loadingFonts.has(fontFamily);
      },
      isGoogleFontRegistered: (fontFamily: string) => {
        return get().registeredFonts.has(fontFamily);
      },
      loadGoogleFont: async (fontFamily: string) => {
        const state = get();

        const existingTracker = state.cssLinks.get(fontFamily);

        if (state.sessionLoadedFonts.has(fontFamily) && existingTracker?.purpose === 'preview') {
          set((state) => {
            const updatedLinks = new Map(state.cssLinks);
            const tracker = updatedLinks.get(fontFamily)!;

            tracker.purpose = 'text-editing';
            tracker.lastUsed = Date.now();
            tracker.usageCount += INITIAL_USAGE_COUNT;
            updatedLinks.set(fontFamily, tracker);

            return { cssLinks: updatedLinks };
          });

          return;
        }

        if (state.sessionLoadedFonts.has(fontFamily) || state.loadingFonts.has(fontFamily)) {
          return;
        }

        if (isIconFont(fontFamily)) {
          return;
        }

        if (!state.networkState.isOnline) {
          set((state) => ({
            queuedFontLoads: [...state.queuedFontLoads, { fontFamily, priority: 'normal', purpose: 'text-editing' }],
          }));

          return;
        }

        if (state.activeFontLoads.size >= MAX_CONCURRENT_LOADS) {
          set((state) => ({
            queuedFontLoads: [...state.queuedFontLoads, { fontFamily, priority: 'normal', purpose: 'text-editing' }],
          }));

          return;
        }

        set((state) => ({
          activeFontLoads: new Set(state.activeFontLoads).add(fontFamily),
          loadingFonts: new Set(state.loadingFonts).add(fontFamily),
        }));

        let retryCount = 0;

        const attemptLoad = async (): Promise<void> => {
          try {
            const fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@${DEFAULT_FONT_WEIGHT}&display=swap`;
            const state = get();
            const existingTracker = state.cssLinks.get(fontFamily);

            if (existingTracker) {
              set((state) => {
                const updatedLinks = new Map(state.cssLinks);
                const tracker = updatedLinks.get(fontFamily)!;

                tracker.lastUsed = Date.now();
                tracker.usageCount += INITIAL_USAGE_COUNT;
                updatedLinks.set(fontFamily, tracker);

                return { cssLinks: updatedLinks };
              });
            } else if (!document.querySelector(`link[href="${fontUrl}"]`)) {
              const link = document.createElement('link');

              link.href = fontUrl;
              link.rel = 'stylesheet';

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

                const tracker: CSSLinkTracker = {
                  element: link,
                  fontFamily,
                  lastUsed: Date.now(),
                  purpose: 'text-editing',
                  url: fontUrl,
                  usageCount: INITIAL_USAGE_COUNT,
                };

                set((state) => ({
                  cssLinks: new Map(state.cssLinks).set(fontFamily, tracker),
                }));
              });
            }

            set((state) => ({
              activeFontLoads: new Set([...state.activeFontLoads].filter((f) => f !== fontFamily)),
              failedLoads: new Map([...state.failedLoads].filter(([key]) => key !== fontFamily)),
              loadingFonts: new Set([...state.loadingFonts].filter((f) => f !== fontFamily)),
              sessionLoadedFonts: new Set(state.sessionLoadedFonts).add(fontFamily),
            }));

            setTimeout(() => get().processQueue(), QUEUE_PROCESS_DELAY);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);

            retryCount++;

            if (retryCount < MAX_RETRY_ATTEMPTS) {
              const delay = calculateRetryDelay(retryCount);

              await new Promise((resolve) => setTimeout(resolve, delay));

              return attemptLoad();
            } else {
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
              setTimeout(() => get().processQueue(), QUEUE_PROCESS_DELAY);
            }
          }
        };

        await attemptLoad();
      },

      loadGoogleFontBinary: async (
        fontFamily: string,
        weight = DEFAULT_FONT_WEIGHT,
        style: 'italic' | 'normal' = 'normal',
      ) => {
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
      loadGoogleFontForPreview: async (fontFamily: string) => {
        const state = get();

        if (state.sessionLoadedFonts.has(fontFamily)) return;

        if (isIconFont(fontFamily)) return;

        const fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@${DEFAULT_FONT_WEIGHT}&display=swap`;
        const existingTracker = state.cssLinks.get(fontFamily);

        if (existingTracker) {
          set((state) => {
            const updatedLinks = new Map(state.cssLinks);
            const tracker = updatedLinks.get(fontFamily)!;

            tracker.lastUsed = Date.now();
            tracker.usageCount += INITIAL_USAGE_COUNT;
            updatedLinks.set(fontFamily, tracker);

            return { cssLinks: updatedLinks };
          });

          return;
        }

        const link = document.createElement('link');

        link.href = fontUrl;
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        const tracker: CSSLinkTracker = {
          element: link,
          fontFamily,
          lastUsed: Date.now(),
          purpose: 'preview',
          url: fontUrl,
          usageCount: INITIAL_USAGE_COUNT,
        };

        set((state) => ({
          cssLinks: new Map(state.cssLinks).set(fontFamily, tracker),
          sessionLoadedFonts: new Set(state.sessionLoadedFonts).add(fontFamily),
        }));
      },

      loadGoogleFontWithOptions: async (options: FontLoadOptions) => {
        const { fontFamily, forceReload = false, priority = 'normal', purpose } = options;
        const state = get();

        if (!forceReload && state.sessionLoadedFonts.has(fontFamily)) {
          return;
        }

        if (state.activeFontLoads.size >= MAX_CONCURRENT_LOADS) {
          const queueItem = { fontFamily, priority, purpose };
          const existingIndex = state.queuedFontLoads.findIndex((item) => item.fontFamily === fontFamily);

          if (existingIndex === -1) {
            const priorityOrder = PRIORITY_ORDER;
            const insertIndex = state.queuedFontLoads.findIndex(
              (item) => priorityOrder[item.priority] > priorityOrder[priority],
            );

            set((state) => {
              const newQueue = [...state.queuedFontLoads];

              if (insertIndex === -1) {
                newQueue.push(queueItem);
              } else {
                newQueue.splice(insertIndex, 0, queueItem);
              }

              return { queuedFontLoads: newQueue };
            });
          }

          return;
        }

        await get().loadGoogleFont(fontFamily);
      },

      loadingFonts: new Set<string>(),
      networkState: createNetworkDetector(),

      processQueue: () => {
        const state = get();

        while (state.activeFontLoads.size < MAX_CONCURRENT_LOADS && state.queuedFontLoads.length > 0) {
          const queueItem = state.queuedFontLoads.shift()!;
          const { fontFamily } = queueItem;

          if (!state.sessionLoadedFonts.has(fontFamily) && !state.activeFontLoads.has(fontFamily)) {
            set((state) => {
              const newQueue = [...state.queuedFontLoads];

              return { queuedFontLoads: newQueue };
            });

            state.activeFontLoads.add(fontFamily);

            get()
              .loadGoogleFont(fontFamily)
              .finally(() => {
                set((state) => {
                  const newActive = new Set(state.activeFontLoads);

                  newActive.delete(fontFamily);

                  return { activeFontLoads: newActive };
                });

                setTimeout(() => get().processQueue(), QUEUE_PROCESS_DELAY);
              });
          }
        }
      },

      queuedFontLoads: [],
      registeredFonts: new Set<string>(),

      registerGoogleFont: (fontFamily: string) => {
        const state = get();

        if (state.registeredFonts.has(fontFamily)) {
          return;
        }

        const googleFont = createGoogleFontObject(fontFamily, DEFAULT_FONT_WEIGHT, 'normal', (family, weight, style) =>
          state.loadGoogleFontBinary(family, weight, style),
        );

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

if (typeof window !== 'undefined') {
  const store = useGoogleFontStore.getState();

  window.addEventListener('online', () => store.updateNetworkState());
  window.addEventListener('offline', () => store.updateNetworkState());

  if ('connection' in navigator) {
    const connection =
      (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

    if (connection && 'addEventListener' in connection) {
      connection.addEventListener('change', () => store.updateNetworkState());
    }
  }

  setInterval(() => {
    const currentState = useGoogleFontStore.getState().networkState;

    if (Date.now() - currentState.lastChecked > NETWORK_STATE_CHECK_INTERVAL) {
      store.updateNetworkState();
    }
  }, NETWORK_STATE_CHECK_INTERVAL);

  setInterval(() => {
    useGoogleFontStore.getState().cleanupUnusedCSSLinks();
  }, CSS_CLEANUP_INTERVAL);
}
