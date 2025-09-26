import { create } from 'zustand';

import { calculateRetryDelay, MAX_RETRY_ATTEMPTS, REQUEST_TIMEOUT } from '@core/helpers/fonts/cacheUtils';
import { createGoogleFontObject, getWeightAndStyleFromVariant } from '@core/helpers/fonts/fontUtils';
import { googleFontRegistry } from '@core/helpers/fonts/googleFontRegistry';
import { googleFontsApiCache } from '@core/helpers/fonts/googleFontsApiCache';

import {
  DEFAULT_FONT_WEIGHT,
  INITIAL_USAGE_COUNT,
  MAX_CONCURRENT_LOADS,
  PRIORITY_ORDER,
  QUEUE_PROCESS_DELAY,
  RETRY_JITTER_MAX,
} from './constants';
import { useErrorHandling } from './errorHandling';
import { useFontCache } from './fontCache';
import { createBinaryLoader } from './loaders/binaryLoader';
import { useNetworkState } from './networkState';
import type { FontLoadPriority, FontLoadPurpose } from './types';
import { isIconFont, isLocalFont } from './utils/detection';
import { buildGoogleFontURL, discoverAvailableVariants, findBestVariant, getCSSWeight } from './utils/variants';

interface QueuedLoad {
  fontFamily: string;
  priority: FontLoadPriority;
  purpose: FontLoadPurpose;
}

interface FontLoadingState {
  activeFontLoads: Set<string>;
  failedLoads: Map<string, { count: number; error?: string; lastAttempt: number }>;
  isLoaded: (fontFamily: string) => boolean;
  isLoading: (fontFamily: string) => boolean;

  // Binary loading
  loadBinary: (fontFamily: string, weight?: number, style?: 'italic' | 'normal') => Promise<ArrayBuffer | null>;
  // Loading methods with unified interface
  loadFont: (
    fontFamily: string,
    options?: {
      forceReload?: boolean;
      priority?: FontLoadPriority;
      purpose?: FontLoadPurpose;
    },
  ) => Promise<void>;

  // Specialized loading methods
  loadForPreview: (fontFamily: string) => Promise<void>;

  loadForTextEditing: (fontFamily: string) => Promise<void>;
  // Loading state
  loadingFonts: Set<string>;

  processQueue: () => void;
  // Queue management
  queuedFontLoads: QueuedLoad[];
  // Retry and status
  retryFailedFont: (fontFamily: string) => Promise<void>;

  sessionLoadedFonts: Set<string>;
}

export const useFontLoading = create<FontLoadingState>()((set, get) => ({
  activeFontLoads: new Set(),
  failedLoads: new Map(),
  // Status checks
  isLoaded: (fontFamily: string) => get().sessionLoadedFonts.has(fontFamily),
  isLoading: (fontFamily: string) => get().loadingFonts.has(fontFamily),

  // Binary loading implementation
  loadBinary: async (fontFamily: string, weight = DEFAULT_FONT_WEIGHT, style: 'italic' | 'normal' = 'normal') => {
    const fontCache = useFontCache.getState();
    const networkState = useNetworkState.getState();

    const binaryLoader = createBinaryLoader(
      (family, w, s) => fontCache.getBinaryFromCache(family, w, s),
      (family, w, s, buffer) => fontCache.storeBinaryInCache(family, w, s, buffer),
      networkState,
    );

    return binaryLoader(fontFamily, weight, style);
  },

  // CSS loading helper
  loadCSSFont: async (fontFamily: string, fontUrl: string, purpose: FontLoadPurpose) => {
    const fontCache = useFontCache.getState();
    const existingTracker = fontCache.cssLinks.get(fontFamily);

    if (existingTracker) {
      fontCache.updateCSSLinkUsage(fontFamily);

      return;
    }

    if (document.querySelector(`link[href="${fontUrl}"]`)) {
      return;
    }

    const link = document.createElement('link');

    link.href = fontUrl;
    link.rel = 'stylesheet';

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Font CSS load timeout: ${fontFamily}`));
      }, REQUEST_TIMEOUT);

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

    fontCache.addCSSLink(fontFamily, {
      element: link,
      fontFamily,
      lastUsed: Date.now(),
      purpose,
      url: fontUrl,
      usageCount: INITIAL_USAGE_COUNT,
    });
  },

  // Unified loading interface
  loadFont: async (fontFamily: string, options = {}) => {
    const { forceReload = false, priority = 'normal', purpose = 'text-editing' } = options;
    const state = get();
    const networkState = useNetworkState.getState();
    const fontCache = useFontCache.getState();

    // Check if already loaded
    if (!forceReload && state.sessionLoadedFonts.has(fontFamily)) {
      const existingTracker = fontCache.cssLinks.get(fontFamily);

      if (existingTracker?.purpose === 'preview' && purpose === 'text-editing') {
        // Upgrade from preview to text editing
        await get().loadForTextEditing(fontFamily);
      }

      return;
    }

    // Skip unsupported fonts
    if (isLocalFont(fontFamily) || isIconFont(fontFamily)) {
      return;
    }

    // Queue if offline or at capacity
    if (!networkState.isOnline || state.activeFontLoads.size >= MAX_CONCURRENT_LOADS) {
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

    // Start loading
    set((state) => ({
      activeFontLoads: new Set(state.activeFontLoads).add(fontFamily),
      loadingFonts: new Set(state.loadingFonts).add(fontFamily),
    }));

    await get().performFontLoad(fontFamily, purpose);
  },

  // Binary loading and registration
  loadFontBinariesAndRegister: async (fontFamily: string, variants: string[]) => {
    const state = get();
    const loadPromises = variants.map(async (variant) => {
      const { style, weight } = getWeightAndStyleFromVariant(variant);

      try {
        await state.loadBinary(fontFamily, weight, /italic/i.test(style) ? 'italic' : 'normal');

        const variantFont = createGoogleFontObject({
          binaryLoader: state.loadBinary,
          fontFamily,
          style,
          weight,
        });

        googleFontRegistry.registerGoogleFont(variantFont);
      } catch (error) {
        console.warn(`Failed to load TTF for ${fontFamily} ${weight} ${style}:`, error);
      }
    });

    await Promise.allSettled(loadPromises);
  },

  // Convenience methods
  loadForPreview: async (fontFamily: string) => {
    await get().loadFont(fontFamily, { priority: 'low', purpose: 'preview' });
  },

  loadForTextEditing: async (fontFamily: string) => {
    await get().loadFont(fontFamily, { priority: 'normal', purpose: 'text-editing' });
  },

  // Loading state
  loadingFonts: new Set(),

  // Internal loading method with enhanced error handling
  performFontLoad: async (fontFamily: string, purpose: FontLoadPurpose) => {
    let retryCount = 0;
    const errorHandler = useErrorHandling.getState();
    const networkState = useNetworkState.getState();

    const attemptLoad = async (): Promise<void> => {
      try {
        // Check network connectivity first
        if (!networkState.isOnline) {
          throw new Error('No network connection available');
        }

        const fontData = await googleFontsApiCache.findFont(fontFamily);

        if (!fontData) {
          throw new Error(`Font ${fontFamily} not found in Google Fonts API cache`);
        }

        // Build CSS URL based on purpose
        const availableVariants = discoverAvailableVariants(fontData.variants);
        let fontUrl: string;

        if (purpose === 'preview') {
          const bestVariant = findBestVariant(availableVariants, DEFAULT_FONT_WEIGHT, 'normal');

          if (!bestVariant) throw new Error(`No suitable variant found for ${fontFamily}`);

          fontUrl = buildGoogleFontURL(fontFamily, { variant: bestVariant });
        } else {
          // Full loading for text editing
          const allVariants = Array.from(availableVariants);
          const weights = allVariants
            .map((variant) => getCSSWeight(variant))
            .filter((w, i, arr) => arr.indexOf(w) === i)
            .sort((a, b) => Number.parseInt(a.split(':')[0]) - Number.parseInt(b.split(':')[0]));

          fontUrl = buildGoogleFontURL(fontFamily, { weights });
        }

        // Load CSS
        await get().loadCSSFont(fontFamily, fontUrl, purpose);

        // For text editing, also load binaries and register fonts
        if (purpose === 'text-editing') {
          await get().loadFontBinariesAndRegister(fontFamily, fontData.variants);
        }

        // Mark as loaded successfully
        set((state) => ({
          activeFontLoads: new Set([...state.activeFontLoads].filter((f) => f !== fontFamily)),
          failedLoads: new Map([...state.failedLoads].filter(([key]) => key !== fontFamily)),
          loadingFonts: new Set([...state.loadingFonts].filter((f) => f !== fontFamily)),
          sessionLoadedFonts: new Set(state.sessionLoadedFonts).add(fontFamily),
        }));

        console.log(`✅ Successfully loaded Google Font: ${fontFamily} for ${purpose}`);
        setTimeout(() => get().processQueue(), QUEUE_PROCESS_DELAY);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isNetworkError =
          errorMessage.includes('network') || errorMessage.includes('connection') || errorMessage.includes('fetch');

        retryCount++;

        // Report error with appropriate categorization
        const errorCategory = isNetworkError ? 'network' : 'font-loading';
        const severity = retryCount >= MAX_RETRY_ATTEMPTS ? 'high' : 'medium';

        errorHandler.reportError({
          category: errorCategory,
          context: {
            networkOnline: networkState.isOnline,
            purpose,
            timestamp: Date.now(),
          },
          fontFamily,
          message: errorMessage,
          recoverable: retryCount < MAX_RETRY_ATTEMPTS,
          retryCount,
          severity,
        });

        if (retryCount < MAX_RETRY_ATTEMPTS) {
          const delay = calculateRetryDelay(retryCount, RETRY_JITTER_MAX);

          console.warn(`⚠️ Retry ${retryCount}/${MAX_RETRY_ATTEMPTS} for ${fontFamily} in ${delay}ms`);
          await new Promise((resolve) => setTimeout(resolve, delay));

          return attemptLoad();
        } else {
          // Final failure - mark as failed and suggest fallback
          const fallbackFont = errorHandler.getFallbackFont(fontFamily);

          set((state) => ({
            activeFontLoads: new Set([...state.activeFontLoads].filter((f) => f !== fontFamily)),
            failedLoads: new Map(state.failedLoads).set(fontFamily, {
              count: retryCount,
              error: errorMessage,
              lastAttempt: Date.now(),
            }),
            loadingFonts: new Set([...state.loadingFonts].filter((f) => f !== fontFamily)),
          }));

          console.error(
            `❌ Failed to load Google Font after ${retryCount} attempts: ${fontFamily}. Suggesting fallback: ${fallbackFont}`,
          );

          // Enable offline mode if network issues persist
          if (isNetworkError) {
            errorHandler.enableOfflineMode();
          }

          setTimeout(() => get().processQueue(), QUEUE_PROCESS_DELAY);
        }
      }
    };

    await attemptLoad();
  },

  processQueue: () => {
    const state = get();

    while (state.activeFontLoads.size < MAX_CONCURRENT_LOADS && state.queuedFontLoads.length > 0) {
      const queueItem = state.queuedFontLoads.shift()!;
      const { fontFamily } = queueItem;

      if (!state.sessionLoadedFonts.has(fontFamily) && !state.activeFontLoads.has(fontFamily)) {
        set((state) => ({
          queuedFontLoads: [...state.queuedFontLoads],
        }));

        state.activeFontLoads.add(fontFamily);

        get()
          .loadFont(fontFamily, { priority: queueItem.priority, purpose: queueItem.purpose })
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

  // Queue management
  queuedFontLoads: [],

  // Retry functionality
  retryFailedFont: async (fontFamily: string) => {
    const failedLoad = get().failedLoads.get(fontFamily);

    if (!failedLoad) return;

    const timeSinceLastAttempt = Date.now() - failedLoad.lastAttempt;
    const minimumWaitTime = calculateRetryDelay(failedLoad.count, RETRY_JITTER_MAX);

    if (timeSinceLastAttempt < minimumWaitTime) {
      return;
    }

    await get().loadFont(fontFamily, { forceReload: true });
  },
  sessionLoadedFonts: new Set(),
}));
