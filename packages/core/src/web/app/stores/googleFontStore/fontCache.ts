import { create } from 'zustand';

import { CSS_CLEANUP_INTERVAL, INITIAL_USAGE_COUNT } from './constants';
import type { CSSLinkTracker, GoogleFontBinary } from './types';

interface FontCacheState {
  addCSSLink: (fontFamily: string, tracker: CSSLinkTracker) => void;
  // Binary font cache
  cachedBinaries: Map<string, GoogleFontBinary>;
  cleanupUnusedCSSLinks: (maxAge?: number) => void;
  clearBinaryCache: () => void;

  // CSS link management
  cssLinks: Map<string, CSSLinkTracker>;
  getBinaryFromCache: (fontFamily: string, weight?: number, style?: 'italic' | 'normal') => GoogleFontBinary | null;
  // Cache statistics
  getCacheStats: () => {
    binaryCount: number;
    cssLinkCount: number;
    totalMemoryUsage: number;
  };
  removeCSSLink: (fontFamily: string) => void;
  storeBinaryInCache: (fontFamily: string, weight: number, style: 'italic' | 'normal', buffer: ArrayBuffer) => void;

  updateCSSLinkUsage: (fontFamily: string) => void;
}

export const useFontCache = create<FontCacheState>()((set, get) => ({
  addCSSLink: (fontFamily: string, tracker: CSSLinkTracker) => {
    set((state) => ({
      cssLinks: new Map(state.cssLinks).set(fontFamily, tracker),
    }));
  },

  // Binary font cache
  cachedBinaries: new Map(),

  cleanupUnusedCSSLinks: (maxAge = CSS_CLEANUP_INTERVAL) => {
    const now = Date.now();
    const state = get();
    const updatedLinks = new Map(state.cssLinks);
    const fontsInUse = new Set<string>();
    let cleanedCount = 0;

    try {
      // Scan DOM for fonts currently in use
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

    // Enhanced cleanup with memory management integration
    for (const [fontFamily, tracker] of updatedLinks.entries()) {
      const isActivelyUsed = fontsInUse.has(fontFamily);
      const isOld = now - tracker.lastUsed > maxAge;
      const isTextEditingFont = tracker.purpose === 'text-editing';

      // Enhanced cleanup logic with priority consideration
      const shouldCleanup =
        (isOld && !isActivelyUsed && !isTextEditingFont) ||
        (tracker.purpose === 'preview' && now - tracker.lastUsed > 10 * 60 * 1000) || // 10 min for preview
        (tracker.usageCount < 2 && now - tracker.lastUsed > 30 * 60 * 1000); // 30 min for unused

      if (shouldCleanup) {
        if (tracker.element && tracker.element.parentNode) {
          tracker.element.parentNode.removeChild(tracker.element);
        }

        updatedLinks.delete(fontFamily);
        cleanedCount++;
      } else if (isActivelyUsed) {
        tracker.lastUsed = now;
        tracker.usageCount += 1;
        updatedLinks.set(fontFamily, tracker);
      }
    }

    if (cleanedCount > 0 || fontsInUse.size > 0) {
      set({ cssLinks: updatedLinks });

      if (cleanedCount > 0) {
        console.log(`🗑️ Smart cleanup removed ${cleanedCount} unused Google Font CSS links.`);
      }

      // Update memory manager stats
      import('./memoryManager').then(({ useMemoryManager }) => {
        useMemoryManager.getState().updateStats();
      });
    }
  },

  clearBinaryCache: () => {
    set({ cachedBinaries: new Map() });
  },

  // CSS link management
  cssLinks: new Map<string, CSSLinkTracker>(),

  getBinaryFromCache: (fontFamily: string, weight = 400, style: 'italic' | 'normal' = 'normal') => {
    const cacheKey = `${fontFamily}-${weight}-${style}`;

    return get().cachedBinaries.get(cacheKey) || null;
  },

  // Cache statistics
  getCacheStats: () => {
    const state = get();
    const totalMemoryUsage = Array.from(state.cachedBinaries.values()).reduce(
      (total, binary) => total + binary.buffer.byteLength,
      0,
    );

    return {
      binaryCount: state.cachedBinaries.size,
      cssLinkCount: state.cssLinks.size,
      totalMemoryUsage,
    };
  },

  removeCSSLink: (fontFamily: string) => {
    set((state) => {
      const updatedLinks = new Map(state.cssLinks);
      const tracker = updatedLinks.get(fontFamily);

      if (tracker && tracker.element && tracker.element.parentNode) {
        tracker.element.parentNode.removeChild(tracker.element);
      }

      updatedLinks.delete(fontFamily);

      return { cssLinks: updatedLinks };
    });
  },

  storeBinaryInCache: (fontFamily: string, weight: number, style: 'italic' | 'normal', buffer: ArrayBuffer) => {
    set((state) => {
      const newMap = new Map(state.cachedBinaries);
      const cacheKey = `${fontFamily}-${weight}-${style}`;

      newMap.set(cacheKey, {
        buffer,
        family: fontFamily,
        style,
        timestamp: Date.now(),
        weight,
      });

      return { cachedBinaries: newMap };
    });
  },

  updateCSSLinkUsage: (fontFamily: string) => {
    set((state) => {
      const updatedLinks = new Map(state.cssLinks);
      const tracker = updatedLinks.get(fontFamily);

      if (tracker) {
        tracker.lastUsed = Date.now();
        tracker.usageCount += INITIAL_USAGE_COUNT;
        updatedLinks.set(fontFamily, tracker);
      }

      return { cssLinks: updatedLinks };
    });
  },
}));

// Set up automatic cleanup interval
if (typeof window !== 'undefined') {
  setInterval(() => {
    useFontCache.getState().cleanupUnusedCSSLinks();
  }, CSS_CLEANUP_INTERVAL);
}
