// Removed unused ts-pattern imports since we're using helper functions now
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { useStorageStore } from '@core/app/stores/storageStore';
import { googleFontRegistry } from '@core/helpers/fonts/googleFontRegistry';
import { googleFontsApiCache } from '@core/helpers/fonts/googleFontsApiCache';
import type { GoogleFontFiles } from '@core/helpers/fonts/googleFontsApiCache';
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

// Weight preference order for fallback (closest to 400 first)
const WEIGHT_FALLBACK_ORDER = [400, 500, 300, 600, 200, 700, 100, 800, 900];

// Priority ordering for font loading queue
const PRIORITY_ORDER = { critical: 0, high: 1, low: 3, normal: 2 };

/**
 * Discovers all available variants for a font from its variants array
 */
const discoverAvailableVariants = (variants: string[]) => {
  const available = new Set<keyof GoogleFontFiles>();

  for (const variant of variants) {
    if (variant === 'regular') {
      available.add('regular');
      available.add('400');
    } else if (variant === 'italic') {
      available.add('italic');
      available.add('400italic');
    } else if (variant.endsWith('italic')) {
      const weight = variant.replace('italic', '');

      available.add(`${weight}italic` as keyof GoogleFontFiles);
    } else if (/^\d+$/.test(variant)) {
      available.add(variant as keyof GoogleFontFiles);
    }
  }

  return available;
};

/**
 * Finds the best available variant with fallback strategy
 */
const findBestVariant = (
  availableVariants: Set<keyof GoogleFontFiles>,
  requestedWeight: number,
  requestedStyle: 'italic' | 'normal',
): keyof GoogleFontFiles | null => {
  // Helper to create variant keys safely
  const createVariantKey = (style: 'italic' | 'normal', weight: number): keyof GoogleFontFiles => {
    if (style === 'normal' && weight === 400) return 'regular';

    if (style === 'italic' && weight === 400) return 'italic';

    if (style === 'italic') return `${weight}italic` as keyof GoogleFontFiles;

    return `${weight}` as keyof GoogleFontFiles;
  };

  // Try exact match first
  const exactKey = createVariantKey(requestedStyle, requestedWeight);

  if (availableVariants.has(exactKey)) {
    return exactKey;
  }

  // Fallback strategy: try same style with different weights
  for (const weight of WEIGHT_FALLBACK_ORDER) {
    const key = createVariantKey(requestedStyle, weight);

    if (availableVariants.has(key)) {
      return key;
    }
  }

  // Last resort: try different style
  const alternateStyle = requestedStyle === 'normal' ? 'italic' : 'normal';

  for (const weight of WEIGHT_FALLBACK_ORDER) {
    const key = createVariantKey(alternateStyle, weight);

    if (availableVariants.has(key)) {
      console.warn(`Font variant fallback: ${requestedStyle} ${requestedWeight} → ${alternateStyle} ${weight}`);

      return key;
    }
  }

  return null;
};

/**
 * Gets all variants needed for text editing (CSS + TTF for all available weights/styles)
 */
const getAllVariantsForTextEditing = (availableVariants: Set<keyof GoogleFontFiles>) => {
  return Array.from(availableVariants);
};

/**
 * Generates proper PostScript names for Google Font variants
 * Maps weight and style to standard PostScript naming conventions
 */
const generateGoogleFontPostScriptName = (family: string, weight: number, italic: boolean): string => {
  const cleanFamily = family.replace(/\s+/g, '');

  // Standard Google Fonts weight to PostScript style mapping
  const weightStyles: Record<number, string> = {
    100: 'Thin',
    200: 'ExtraLight',
    300: 'Light',
    400: 'Regular',
    500: 'Medium',
    600: 'SemiBold',
    700: 'Bold',
    800: 'ExtraBold',
    900: 'Black',
  };

  const weightStyle = weightStyles[weight] || 'Regular';
  const suffix = italic ? `${weightStyle}Italic` : weightStyle;

  return `${cleanFamily}-${suffix}`;
};

// Font filtering
const ICON_FONT_KEYWORDS = ['icons'];

// Default fallback font constants for offline scenarios
const DEFAULT_FALLBACK_FONT = 'Arial, sans-serif';
const WEB_SAFE_FONTS = [
  'Arial',
  'Arial Black',
  'Comic Sans MS',
  'Courier New',
  'Georgia',
  'Helvetica',
  'Impact',
  'Lucida Console',
  'Lucida Sans Unicode',
  'Palatino Linotype',
  'Tahoma',
  'Times New Roman',
  'Trebuchet MS',
  'Verdana',
];

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

/**
 * Enhanced network connectivity check with multiple validation methods
 */
const isNetworkAvailableForGoogleFonts = (networkState: NetworkState): boolean => {
  // Primary check: navigator.onLine
  if (!networkState.isOnline) {
    return false;
  }

  // Secondary check: connection quality for Google Fonts (if available)
  const connection = (navigator as any).connection;

  if (connection) {
    // Avoid loading Google Fonts on very slow connections
    const slowConnections = ['slow-2g', '2g'];

    if (connection.effectiveType && slowConnections.includes(connection.effectiveType)) {
      console.log(`🐌 Skipping Google Fonts due to slow connection: ${connection.effectiveType}`);

      return false;
    }
  }

  return true;
};

/**
 * Check if a font family is a web-safe font that doesn't need Google Fonts
 */
const isWebSafeFont = (fontFamily: string): boolean => {
  const normalizedFamily = fontFamily.toLowerCase().trim();

  // Use exact matching to prevent false positives like "Arial Nova" matching "Arial"
  return WEB_SAFE_FONTS.some((webSafeFont) => normalizedFamily === webSafeFont.toLowerCase());
};

/**
 * PostScript name mapping for fallback fonts
 */
const FALLBACK_POSTSCRIPT_NAMES: Record<string, string> = {
  'Arial, sans-serif': 'ArialMT',
  'Arial Black, Arial, sans-serif': 'Arial-Black',
  'Courier New, monospace': 'CourierNewPSMT',
  'Times New Roman, serif': 'TimesNewRomanPSMT',
};

/**
 * Get the PostScript name for a fallback font
 */
const getFallbackPostScriptName = (fallbackFont: string): string => {
  return FALLBACK_POSTSCRIPT_NAMES[fallbackFont] || 'ArialMT';
};

/**
 * Get the best fallback font for a given Google Font family
 * Returns a web-safe font that matches the style characteristics
 */
const getFallbackFont = (googleFontFamily: string): string => {
  const lowerFamily = googleFontFamily.toLowerCase();

  // Serif fonts fallback to Times New Roman
  if (
    lowerFamily.includes('serif') ||
    lowerFamily.includes('times') ||
    lowerFamily.includes('georgia') ||
    lowerFamily.includes('playfair') ||
    lowerFamily.includes('baskerville')
  ) {
    return 'Times New Roman, serif';
  }

  // Monospace fonts fallback to Courier New
  if (
    lowerFamily.includes('mono') ||
    lowerFamily.includes('code') ||
    lowerFamily.includes('courier') ||
    lowerFamily.includes('console')
  ) {
    return 'Courier New, monospace';
  }

  // Display/decorative fonts fallback to Impact or Arial Black
  if (
    lowerFamily.includes('display') ||
    lowerFamily.includes('bold') ||
    lowerFamily.includes('black') ||
    lowerFamily.includes('heavy')
  ) {
    return 'Arial Black, Arial, sans-serif';
  }

  // Default to Arial for sans-serif fonts
  return DEFAULT_FALLBACK_FONT;
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
  getFallbackFont: (googleFontFamily: string) => string;
  getFallbackPostScriptName: (fallbackFont: string) => string;
  getLoadedFonts: () => string[];
  getRegisteredFonts: () => string[];
  isGoogleFontLoaded: (fontFamily: string) => boolean;
  isGoogleFontLoading: (fontFamily: string) => boolean;
  isGoogleFontRegistered: (fontFamily: string) => boolean;
  isNetworkAvailableForGoogleFonts: () => boolean;
  isWebSafeFont: (fontFamily: string) => boolean;
  loadGoogleFont: (fontFamily: string) => Promise<void>;
  loadGoogleFontBinary: (
    fontFamily: string,
    weight?: number,
    style?: 'italic' | 'normal',
  ) => Promise<ArrayBuffer | null>;
  loadGoogleFontForPreview: (fontFamily: string) => Promise<void>;
  loadGoogleFontForTextEditing: (fontFamily: string) => Promise<void>;
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
      const fontData = (await googleFontsApiCache.findFont(fontFamily)) as any;

      if (!fontData) {
        throw new Error(`Font ${fontFamily} not found in Google Fonts API cache`);
      }

      if (isIconFont(fontFamily)) {
        return null;
      }

      // Discover available variants and find best match
      const availableVariants = discoverAvailableVariants(fontData.variants);
      const variantKey = findBestVariant(availableVariants, weight, style);

      if (!variantKey) {
        console.warn(`No suitable variant found for ${fontFamily} (${weight}, ${style})`);

        return null;
      }

      const fontUrl = fontData.files?.[variantKey];

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
  const italic = style === 'italic';

  // Standard Google Fonts weight to PostScript style mapping
  const weightStyles: Record<number, string> = {
    100: 'Thin',
    200: 'ExtraLight',
    300: 'Light',
    400: 'Regular',
    500: 'Medium',
    600: 'SemiBold',
    700: 'Bold',
    800: 'ExtraBold',
    900: 'Black',
  };

  const styleWeight = weightStyles[weight] || 'Regular';
  const displayStyle = italic ? `${styleWeight} Italic` : styleWeight;

  return {
    binaryLoader,
    family: fontFamily,
    italic,
    postscriptName: generateGoogleFontPostScriptName(fontFamily, weight, italic),
    source: 'google',
    style: displayStyle,
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
          // Upgrade from preview to text editing - need to load all variants
          await get().loadGoogleFontForTextEditing(fontFamily);

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
            // Discover available variants instead of assuming 400 weight exists
            const fontData = await googleFontsApiCache.findFont(fontFamily);

            if (!fontData) {
              throw new Error(`Font ${fontFamily} not found in Google Fonts API cache`);
            }

            const availableVariants = discoverAvailableVariants(fontData.variants);
            const bestVariant = findBestVariant(availableVariants, DEFAULT_FONT_WEIGHT, 'normal');

            if (!bestVariant) {
              throw new Error(`No suitable variant found for ${fontFamily}`);
            }

            // Enhanced variant key to weight conversion
            let weight = DEFAULT_FONT_WEIGHT;

            if (bestVariant === 'regular') {
              weight = 400;
            } else if (bestVariant === 'italic') {
              // 'italic' means fallback to italic style, but need to find actual available italic weight
              const availableItalicVariants = Array.from(availableVariants).filter(
                (v) => v.includes('italic') || v === 'italic',
              );

              if (availableItalicVariants.length > 0) {
                // Find the first available italic weight
                const firstItalic = availableItalicVariants[0];

                if (firstItalic === 'italic') {
                  weight = 400; // 'italic' = 400italic
                } else {
                  // Extract weight from variants like '300italic', '500italic'
                  const italicWeight = Number.parseInt(firstItalic.replace('italic', ''));

                  weight = !Number.isNaN(italicWeight) ? italicWeight : 400;
                }
              } else {
                // No italic variants found, use first available weight regardless of style
                const firstNumericVariant = Array.from(availableVariants).find(
                  (v) => /^\d+$/.test(v) || v === 'regular',
                );

                weight =
                  firstNumericVariant === 'regular'
                    ? 400
                    : firstNumericVariant
                      ? Number.parseInt(firstNumericVariant)
                      : 400;
              }
            } else if (bestVariant.includes('italic')) {
              // Extract weight from variants like '700italic', '300italic'
              const weightPart = bestVariant.replace('italic', '');
              const parsed = Number.parseInt(weightPart);

              if (!Number.isNaN(parsed)) {
                weight = parsed;
              } else {
                // Fallback: if we can't parse weight from italic variant, use first available weight
                const firstNumericVariant = Array.from(availableVariants).find((v) => /^\d+$/.test(v));

                if (firstNumericVariant) {
                  weight = Number.parseInt(firstNumericVariant);
                }
              }
            } else if (/^\d+$/.test(bestVariant)) {
              // Pure numeric variants like '300', '700'
              const parsed = Number.parseInt(bestVariant);

              if (!Number.isNaN(parsed)) {
                weight = parsed;
              }
            } else {
              // Unknown variant format - use first available numeric weight
              console.warn(`Unknown variant format '${bestVariant}' for ${fontFamily}, using first available weight`);

              const firstNumericVariant = Array.from(availableVariants).find((v) => /^\d+$/.test(v) || v === 'regular');

              if (firstNumericVariant) {
                weight = firstNumericVariant === 'regular' ? 400 : Number.parseInt(firstNumericVariant);
              }
            }

            console.log(`🔧 Font ${fontFamily}: Available variants: [${Array.from(availableVariants).join(', ')}]`);
            console.log(`🔧 Font ${fontFamily}: Best variant '${bestVariant}' → weight ${weight}`);

            // Detect italic-only fonts (fonts that only have italic variants, no normal variants)
            const hasNormalVariants = Array.from(availableVariants).some((v) => v === 'regular' || /^\d+$/.test(v));
            const hasOnlyItalicVariants =
              !hasNormalVariants && Array.from(availableVariants).some((v) => v === 'italic' || /^\d+italic$/.test(v));

            let fontUrl: string;

            if (hasOnlyItalicVariants) {
              // Use italic format for italic-only fonts like Molle
              fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:ital,wght@1,${weight}&display=swap`;
              console.log(`🔧 Font ${fontFamily}: Using italic-only format (ital,wght@1,${weight})`);
            } else {
              // Use standard weight-based format for fonts with normal variants
              fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@${weight}&display=swap`;
            }

            console.log(fontUrl);

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

        try {
          const fontData = await googleFontsApiCache.findFont(fontFamily);

          if (!fontData) {
            console.warn(`Font data not found for preview: ${fontFamily}`);

            return;
          }

          // Discover available variants and find best match for preview
          const availableVariants = discoverAvailableVariants(fontData.variants);
          const bestVariant = findBestVariant(availableVariants, DEFAULT_FONT_WEIGHT, 'normal');

          if (!bestVariant) {
            console.warn(`No suitable variant found for preview: ${fontFamily}`);

            return;
          }

          // Convert variant key to Google Fonts CSS API format
          let cssWeight = '';

          if (bestVariant === 'regular') {
            cssWeight = '400';
          } else if (bestVariant === 'italic') {
            cssWeight = '400:ital';
          } else if (bestVariant.includes('italic')) {
            const weight = bestVariant.replace('italic', '');

            cssWeight = `${weight}:ital`;
          } else {
            cssWeight = bestVariant;
          }

          const fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:${cssWeight.includes(':ital') ? 'ital,wght@1,' + cssWeight.replace(':ital', '') : 'wght@' + cssWeight}&display=swap`;

          // Check for existing tracker
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

          // Load the CSS
          const link = document.createElement('link');

          link.href = fontUrl;
          link.rel = 'stylesheet';

          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error(`Font CSS load timeout for preview: ${fontFamily}`));
            }, FONT_LOAD_TIMEOUT);

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

          // Discover all available variants for comprehensive text editing support
          const availableVariants = discoverAvailableVariants(fontData.variants);
          const allVariants = getAllVariantsForTextEditing(availableVariants);

          // Build CSS URL with all available variants
          const weights = allVariants
            .map((variant) => {
              if (variant === 'regular') return '400';

              if (variant === 'italic') return '400:ital';

              return variant.includes('italic') ? `${variant.replace('italic', '')}:ital` : variant;
            })
            .filter((w, i, arr) => arr.indexOf(w) === i) // Remove duplicates
            .sort((a, b) => {
              const numA = Number.parseInt(a.split(':')[0]);
              const numB = Number.parseInt(b.split(':')[0]);

              return numA - numB;
            });

          const fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:ital,wght@${weights.map((w) => (w.includes(':ital') ? `1,${w.replace(':ital', '')}` : `0,${w}`)).join(';')}&display=swap`;

          // Check if already loaded
          const existingTracker = state.cssLinks.get(fontFamily);

          if (
            existingTracker &&
            (existingTracker.purpose === 'text-editing' || existingTracker.purpose === 'preview')
          ) {
            // Update/upgrade the tracker for text editing
            set((state) => {
              const updatedLinks = new Map(state.cssLinks);
              const tracker = updatedLinks.get(fontFamily)!;

              tracker.purpose = 'text-editing'; // Upgrade if needed
              tracker.lastUsed = Date.now();
              tracker.usageCount += INITIAL_USAGE_COUNT;
              updatedLinks.set(fontFamily, tracker);

              return { cssLinks: updatedLinks };
            });

            // Load all TTF variants for text editing AND register all variants
            const loadPromises = allVariants.map(async (variant) => {
              const weight =
                variant === 'regular'
                  ? 400
                  : variant === 'italic'
                    ? 400
                    : Number.parseInt(variant.replace('italic', ''));
              const style = variant.includes('italic') ? 'italic' : 'normal';

              try {
                // Load TTF binary
                await state.loadGoogleFontBinary(fontFamily, weight, style);

                // Register this specific variant with proper PostScript name
                const variantFont = createGoogleFontObject(fontFamily, weight, style, state.loadGoogleFontBinary);

                googleFontRegistry.registerGoogleFont(variantFont);
              } catch (error) {
                console.warn(`Failed to load TTF for ${fontFamily} ${weight} ${style}:`, error);
              }
            });

            await Promise.allSettled(loadPromises);

            return;
          }

          // Load CSS for all variants
          const link = document.createElement('link');

          link.href = fontUrl;
          link.rel = 'stylesheet';

          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error(`Font CSS load timeout: ${fontFamily}`));
            }, FONT_LOAD_TIMEOUT);

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

          // Track the CSS link
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

          // Load all TTF variants for text editing AND register all variants
          const loadPromises = allVariants.map(async (variant) => {
            const weight =
              variant === 'regular' ? 400 : variant === 'italic' ? 400 : Number.parseInt(variant.replace('italic', ''));
            const style = variant.includes('italic') ? 'italic' : 'normal';

            try {
              // Load TTF binary
              await state.loadGoogleFontBinary(fontFamily, weight, style);

              // Register this specific variant with proper PostScript name
              const variantFont = createGoogleFontObject(fontFamily, weight, style, state.loadGoogleFontBinary);

              googleFontRegistry.registerGoogleFont(variantFont);
            } catch (error) {
              console.warn(`Failed to load TTF for ${fontFamily} ${weight} ${style}:`, error);
            }
          });

          await Promise.allSettled(loadPromises);

          // Register the primary font family using the actual first variant
          if (!state.registeredFonts.has(fontFamily)) {
            // Use the first available variant from the original font data
            const firstVariant = fontData.variants[0];
            let primaryWeight = 400;
            let primaryStyle: 'italic' | 'normal' = 'normal';

            if (firstVariant === 'regular') {
              primaryWeight = 400;
              primaryStyle = 'normal';
            } else if (firstVariant === 'italic') {
              primaryWeight = 400;
              primaryStyle = 'italic';
            } else if (firstVariant.endsWith('italic')) {
              primaryWeight = Number.parseInt(firstVariant.replace('italic', ''));
              primaryStyle = 'italic';
            } else if (/^\d+$/.test(firstVariant)) {
              primaryWeight = Number.parseInt(firstVariant);
              primaryStyle = 'normal';
            }

            const primaryFont = createGoogleFontObject(
              fontFamily,
              primaryWeight,
              primaryStyle,
              state.loadGoogleFontBinary,
            );

            googleFontRegistry.registerGoogleFont(primaryFont);
            set((state) => ({ registeredFonts: new Set(state.registeredFonts).add(fontFamily) }));
          }
        } catch (error) {
          console.error(`Failed to load font for text editing: ${fontFamily}`, error);
        }
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

          // Use the actual first variant from the font data
          const firstVariant = fontData.variants[0];
          let primaryWeight = DEFAULT_FONT_WEIGHT;
          let primaryStyle: 'italic' | 'normal' = 'normal';

          if (firstVariant === 'regular') {
            primaryWeight = 400;
            primaryStyle = 'normal';
          } else if (firstVariant === 'italic') {
            primaryWeight = 400;
            primaryStyle = 'italic';
          } else if (firstVariant.endsWith('italic')) {
            primaryWeight = Number.parseInt(firstVariant.replace('italic', ''));
            primaryStyle = 'italic';
          } else if (/^\d+$/.test(firstVariant)) {
            primaryWeight = Number.parseInt(firstVariant);
            primaryStyle = 'normal';
          }

          const googleFont = createGoogleFontObject(fontFamily, primaryWeight, primaryStyle, (family, weight, style) =>
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

  // 🔥 PHASE 1: Pre-populate Google Fonts cache during store initialization
  // This ensures cache is ready before any font loading operations (app startup, BVG import, etc.)
  googleFontsApiCache
    .getCache()
    .then(() => {
      console.log('✅ Google Fonts cache pre-populated successfully during store initialization');
    })
    .catch((error) => {
      console.warn('⚠️ Google Fonts cache pre-population failed, font loading will use fallbacks:', error);
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
