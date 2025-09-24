import { create } from 'zustand';

import { useStorageStore } from '@core/app/stores/storageStore';
import { calculateRetryDelay, MAX_RETRY_ATTEMPTS, REQUEST_TIMEOUT } from '@core/helpers/fonts/cacheUtils';
import { googleFontRegistry } from '@core/helpers/fonts/googleFontRegistry';
import { googleFontsApiCache } from '@core/helpers/fonts/googleFontsApiCache';
import type { GeneralFont } from '@core/interfaces/IFont';

import {
  CSS_CLEANUP_INTERVAL,
  DEFAULT_FONT_WEIGHT,
  FONT_HISTORY_MAX_SIZE,
  INITIAL_USAGE_COUNT,
  MAX_CONCURRENT_LOADS,
  NETWORK_STATE_CHECK_INTERVAL,
  PRIORITY_ORDER,
  QUEUE_PROCESS_DELAY,
  RETRY_JITTER_MAX,
} from './constants';
import { createBinaryLoader } from './loaders/binaryLoader';
import { createGoogleFontObject } from './loaders/fontFactory';
import type { CSSLinkTracker, GoogleFontState } from './types';
import { isIconFont, isLocalFont, isWebSafeFont } from './utils/detection';
import { getFallbackFont, getFallbackPostScriptName } from './utils/fallbacks';
import { createNetworkDetector, isNetworkAvailableForGoogleFonts } from './utils/network';
import { discoverAvailableVariants, findBestVariant, getCSSWeight, getWeightAndStyle } from './utils/variants';

export const useGoogleFontStore = create<GoogleFontState>()((set, get) => ({
  activeFontLoads: new Set(),
  addToHistory: (font: GeneralFont) => {
    if (!font.family) return;

    const fontHistory = useStorageStore.getState()['font-history'];
    const newHistory = fontHistory.filter((name) => name !== font.family);

    newHistory.unshift(font.family);

    if (newHistory.length > FONT_HISTORY_MAX_SIZE) newHistory.pop();

    useStorageStore.getState().set('font-history', newHistory);
  },
  cachedBinaries: new Map(),
  cleanupUnusedCSSLinks: (maxAge = CSS_CLEANUP_INTERVAL) => {
    const now = Date.now();
    const state = get();
    const updatedLinks = new Map(state.cssLinks);
    const fontsInUse = new Set<string>();
    let cleanedCount = 0;

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
  getFallbackFont: (googleFontFamily: string) => {
    return getFallbackFont(googleFontFamily);
  },
  getFallbackPostScriptName: (fallbackFont: string) => {
    return getFallbackPostScriptName(fallbackFont);
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
  isNetworkAvailableForGoogleFonts: () => {
    return isNetworkAvailableForGoogleFonts(get().networkState);
  },
  isWebSafeFont: (fontFamily: string) => {
    return isWebSafeFont(fontFamily);
  },
  loadGoogleFont: async (fontFamily: string) => {
    const state = get();
    const existingTracker = state.cssLinks.get(fontFamily);

    if (state.sessionLoadedFonts.has(fontFamily) && existingTracker?.purpose === 'preview') {
      await get().loadGoogleFontForTextEditing(fontFamily);

      return;
    }

    if (state.sessionLoadedFonts.has(fontFamily) || state.loadingFonts.has(fontFamily)) {
      return;
    }

    if (isLocalFont(fontFamily) || isIconFont(fontFamily)) {
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
        const fontData = await googleFontsApiCache.findFont(fontFamily);

        if (!fontData) {
          throw new Error(`Font ${fontFamily} not found in Google Fonts API cache`);
        }

        const availableVariants = discoverAvailableVariants(fontData.variants);
        const bestVariant = findBestVariant(availableVariants, DEFAULT_FONT_WEIGHT, 'normal');

        if (!bestVariant) {
          throw new Error(`No suitable variant found for ${fontFamily}`);
        }

        let weight = DEFAULT_FONT_WEIGHT;

        if (bestVariant === 'regular') {
          weight = 400;
        } else if (bestVariant === 'italic') {
          const availableItalicVariants = Array.from(availableVariants).filter(
            (v) => v.includes('italic') || v === 'italic',
          );

          if (availableItalicVariants.length > 0) {
            const firstItalic = availableItalicVariants[0];

            if (firstItalic === 'italic') {
              weight = 400;
            } else {
              const italicWeight = Number.parseInt(firstItalic.replace('italic', ''));

              weight = !Number.isNaN(italicWeight) ? italicWeight : 400;
            }
          } else {
            const firstNumericVariant = Array.from(availableVariants).find((v) => /^\d+$/.test(v) || v === 'regular');

            weight =
              firstNumericVariant === 'regular'
                ? 400
                : firstNumericVariant
                  ? Number.parseInt(firstNumericVariant)
                  : 400;
          }
        } else if (bestVariant.includes('italic')) {
          const weightPart = bestVariant.replace('italic', '');
          const parsed = Number.parseInt(weightPart);

          if (!Number.isNaN(parsed)) {
            weight = parsed;
          } else {
            const firstNumericVariant = Array.from(availableVariants).find((v) => /^\d+$/.test(v));

            if (firstNumericVariant) {
              weight = Number.parseInt(firstNumericVariant);
            }
          }
        } else if (/^\d+$/.test(bestVariant)) {
          const parsed = Number.parseInt(bestVariant);

          if (!Number.isNaN(parsed)) {
            weight = parsed;
          }
        } else {
          console.warn(`Unknown variant format '${bestVariant}' for ${fontFamily}, using first available weight`);

          const firstNumericVariant = Array.from(availableVariants).find((v) => /^\d+$/.test(v) || v === 'regular');

          if (firstNumericVariant) {
            weight = firstNumericVariant === 'regular' ? 400 : Number.parseInt(firstNumericVariant);
          }
        }

        const hasNormalVariants = Array.from(availableVariants).some((v) => v === 'regular' || /^\d+$/.test(v));
        const hasOnlyItalicVariants =
          !hasNormalVariants && Array.from(availableVariants).some((v) => v === 'italic' || /^\d+italic$/.test(v));

        let fontUrl: string;

        if (hasOnlyItalicVariants) {
          fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:ital,wght@1,${weight}&display=swap`;
        } else {
          fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@${weight}&display=swap`;
        }

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
              reject(new Error(`Font CSS load timeout after ${REQUEST_TIMEOUT}ms`));
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
          const delay = calculateRetryDelay(retryCount, RETRY_JITTER_MAX);

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

          newMap.set(cacheKey, { buffer, family, style: s, timestamp: Date.now(), weight: w });

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

    try {
      const fontData = await googleFontsApiCache.findFont(fontFamily);

      if (!fontData) {
        console.warn(`Font data not found for preview: ${fontFamily}`);

        return;
      }

      const availableVariants = discoverAvailableVariants(fontData.variants);
      const bestVariant = findBestVariant(availableVariants, DEFAULT_FONT_WEIGHT, 'normal');

      if (!bestVariant) {
        console.warn(`No suitable variant found for preview: ${fontFamily}`);

        return;
      }

      const cssWeight = getCSSWeight(bestVariant);
      const fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:${cssWeight.includes(':ital') ? 'ital,wght@1,' + cssWeight.replace(':ital', '') : 'wght@' + cssWeight}&display=swap`;
      const existingTracker = state.cssLinks.get(fontFamily);

      if (existingTracker && existingTracker.purpose === 'preview') {
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

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Font CSS load timeout for preview: ${fontFamily}`));
        }, REQUEST_TIMEOUT);

        link.onload = () => {
          clearTimeout(timeout);
          resolve();
        };

        link.onerror = () => {
          clearTimeout(timeout);
          reject(new Error(`Font CSS failed to load for preview: ${fontFamily}`));
        };

        document.head.appendChild(link);
      });

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
    } catch (error) {
      console.error(`Failed to load font for preview: ${fontFamily}`, error);
    }
  },

  loadGoogleFontForTextEditing: async (fontFamily: string) => {
    const state = get();

    if (isIconFont(fontFamily)) return;

    try {
      const fontData = await googleFontsApiCache.findFont(fontFamily);

      if (!fontData) {
        console.warn(`Font data not found for text editing: ${fontFamily}`);

        return;
      }

      const availableVariants = discoverAvailableVariants(fontData.variants);
      const allVariants = Array.from(availableVariants);
      const weights = allVariants
        .map((variant) => getCSSWeight(variant))
        .filter((w, i, arr) => arr.indexOf(w) === i)
        .sort((a, b) => Number.parseInt(a.split(':')[0]) - Number.parseInt(b.split(':')[0]));
      const fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:ital,wght@${weights.map((w) => (w.includes(':ital') ? `1,${w.replace(':ital', '')}` : `0,${w}`)).join(';')}&display=swap`;
      const existingTracker = state.cssLinks.get(fontFamily);

      if (existingTracker && (existingTracker.purpose === 'text-editing' || existingTracker.purpose === 'preview')) {
        set((state) => {
          const updatedLinks = new Map(state.cssLinks);
          const tracker = updatedLinks.get(fontFamily)!;

          tracker.purpose = 'text-editing';
          tracker.lastUsed = Date.now();
          tracker.usageCount += INITIAL_USAGE_COUNT;
          updatedLinks.set(fontFamily, tracker);

          return { cssLinks: updatedLinks };
        });

        const loadPromises = allVariants.map(async (variant) => {
          const { style, weight } = getWeightAndStyle(variant);

          try {
            await state.loadGoogleFontBinary(fontFamily, weight, style);

            const variantFont = createGoogleFontObject(fontFamily, weight, style, state.loadGoogleFontBinary);

            googleFontRegistry.registerGoogleFont(variantFont);
          } catch (error) {
            console.warn(`Failed to load TTF for ${fontFamily} ${weight} ${style}:`, error);
          }
        });

        await Promise.allSettled(loadPromises);

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

        link.onerror = () => {
          clearTimeout(timeout);
          reject(new Error(`Font CSS failed to load: ${fontFamily}`));
        };

        document.head.appendChild(link);
      });

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
        sessionLoadedFonts: new Set(state.sessionLoadedFonts).add(fontFamily),
      }));

      const loadPromises = allVariants.map(async (variant) => {
        const { style, weight } = getWeightAndStyle(variant);

        try {
          await state.loadGoogleFontBinary(fontFamily, weight, style);

          const variantFont = createGoogleFontObject(fontFamily, weight, style, state.loadGoogleFontBinary);

          googleFontRegistry.registerGoogleFont(variantFont);
        } catch (error) {
          console.warn(`Failed to load TTF for ${fontFamily} ${weight} ${style}:`, error);
        }
      });

      await Promise.allSettled(loadPromises);

      if (!state.registeredFonts.has(fontFamily)) {
        const { style, weight } = getWeightAndStyle(fontData.variants[0]);
        const primaryFont = createGoogleFontObject(fontFamily, weight, style, state.loadGoogleFontBinary);

        googleFontRegistry.registerGoogleFont(primaryFont);
        set((state) => ({ registeredFonts: new Set(state.registeredFonts).add(fontFamily) }));
      }
    } catch (error) {
      console.error(`Failed to load font for text editing: ${fontFamily}`, error);
    }
  },

  loadGoogleFontWithOptions: async (options) => {
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
  registerGoogleFont: async (fontFamily: string) => {
    const state = get();

    if (state.registeredFonts.has(fontFamily)) {
      return;
    }

    try {
      const fontData = await googleFontsApiCache.findFont(fontFamily);

      if (!fontData) {
        console.warn(`Font data not found for registration: ${fontFamily}`);

        return;
      }

      const { style, weight } = getWeightAndStyle(fontData.variants[0]);
      const googleFont = createGoogleFontObject(fontFamily, weight, style, (family, weight, style) =>
        state.loadGoogleFontBinary(family, weight, style),
      );

      const registered = googleFontRegistry.registerGoogleFont(googleFont);

      if (registered) {
        set((state) => ({ registeredFonts: new Set(state.registeredFonts).add(fontFamily) }));
      } else {
        console.warn(`Failed to register Google Font: ${fontFamily}`);
      }
    } catch (error) {
      console.error(`Failed to register Google Font ${fontFamily}:`, error);
    }
  },

  retryFailedFont: async (fontFamily: string) => {
    const failedLoad = get().failedLoads.get(fontFamily);

    if (!failedLoad) return;

    const timeSinceLastAttempt = Date.now() - failedLoad.lastAttempt;
    const minimumWaitTime = calculateRetryDelay(failedLoad.count, RETRY_JITTER_MAX);

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
}));

if (typeof window !== 'undefined') {
  const store = useGoogleFontStore.getState();

  googleFontsApiCache
    .getCache()
    .then(() => {
      console.log('Google Fonts cache pre-populated successfully during store initialization');
    })
    .catch((error) => {
      console.warn('Google Fonts cache pre-population failed, font loading will use fallbacks:', error);
    });

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
