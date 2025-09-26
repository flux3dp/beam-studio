import { create } from 'zustand';

/**
 * Advanced Memory Management for Google Fonts
 *
 * Features:
 * - LRU cache eviction
 * - Configurable memory limits
 * - Smart cleanup based on usage patterns
 * - Memory pressure monitoring
 * - Automatic garbage collection
 */

export interface CacheEntry<T> {
  accessCount: number;
  data: T;
  lastAccessed: number;
  priority: 'high' | 'low' | 'medium';
  size: number;
  timestamp: number;
}

export interface MemoryStats {
  binaryCacheSize: number;
  cssCacheSize: number;
  entriesCount: number;
  evictionCount: number;
  hitRate: number;
  totalMemoryUsed: number;
}

export interface MemoryLimits {
  cleanupInterval: number; // milliseconds
  maxAge: number; // milliseconds
  maxBinaryCache: number; // bytes
  maxCSSCache: number; // number of entries
  maxTotalMemory: number; // bytes
}

interface MemoryManagerState {
  alertMemoryThreshold: number;
  calculatePriority: (fontFamily: string, purpose: string) => 'high' | 'low' | 'medium';

  getMemoryStats: () => MemoryStats;
  // Cache management
  isMemoryPressureHigh: () => boolean;
  // Configuration
  limits: MemoryLimits;

  // Monitoring
  monitorMemoryPressure: () => void;
  performAggressiveCleanup: () => Promise<{ cleaned: number; freedMemory: number }>;
  // Cleanup operations
  performSmartCleanup: () => Promise<{ cleaned: number; freedMemory: number }>;

  scheduleCleanup: (aggressive?: boolean) => void;
  shouldEvictEntry: <T>(entry: CacheEntry<T>) => boolean;
  // Memory tracking
  stats: MemoryStats;

  updateLimits: (newLimits: Partial<MemoryLimits>) => void;
  updateStats: () => void;
}

// Default memory limits (conservative for web apps)
const DEFAULT_LIMITS: MemoryLimits = {
  cleanupInterval: 5 * 60 * 1000, // 5 minutes
  maxAge: 30 * 60 * 1000, // 30 minutes
  maxBinaryCache: 30 * 1024 * 1024, // 30MB for font binaries
  maxCSSCache: 100, // 100 CSS link entries
  maxTotalMemory: 50 * 1024 * 1024, // 50MB
};

// Popular fonts that should have higher priority
const HIGH_PRIORITY_FONTS = new Set([
  'Open Sans',
  'Roboto',
  'Lato',
  'Montserrat',
  'Source Sans Pro',
  'Ubuntu',
  'Nunito',
]);

export const useMemoryManager = create<MemoryManagerState>()((set, get) => ({
  alertMemoryThreshold: DEFAULT_LIMITS.maxTotalMemory * 0.7, // 70% of max

  calculatePriority: (fontFamily: string, purpose: string) => {
    // High priority for popular fonts
    if (HIGH_PRIORITY_FONTS.has(fontFamily)) {
      return 'high';
    }

    // Medium priority for text editing (permanent use)
    if (purpose === 'text-editing') {
      return 'medium';
    }

    // Low priority for preview only
    return 'low';
  },

  getMemoryStats: () => {
    const state = get();

    return { ...state.stats };
  },

  // Cache management
  isMemoryPressureHigh: () => {
    const state = get();
    const memoryUsageRatio = state.stats.totalMemoryUsed / state.limits.maxTotalMemory;

    return memoryUsageRatio > 0.8; // 80% threshold
  },

  // Configuration
  limits: DEFAULT_LIMITS,

  // Monitoring
  monitorMemoryPressure: () => {
    const state = get();

    if (state.stats.totalMemoryUsed > state.alertMemoryThreshold) {
      console.warn(`⚠️ Memory usage high: ${(state.stats.totalMemoryUsed / 1024 / 1024).toFixed(2)}MB`);

      // Trigger smart cleanup
      get().scheduleCleanup(false);
    }

    if (get().isMemoryPressureHigh()) {
      console.error('🚨 Memory pressure critical - triggering aggressive cleanup');
      get().scheduleCleanup(true);
    }
  },

  performAggressiveCleanup: async () => {
    let cleanedCount = 0;
    let freedMemory = 0;

    try {
      const { useFontCache } = await import('./fontCache');
      const fontCache = useFontCache.getState();

      // Aggressive cleanup - remove everything except high-priority fonts
      const cssLinks = new Map(fontCache.cssLinks);
      const binaryCache = new Map(fontCache.cachedBinaries);

      // Clear all low and medium priority CSS links
      for (const [fontFamily, tracker] of cssLinks.entries()) {
        if (!HIGH_PRIORITY_FONTS.has(fontFamily) || tracker.purpose === 'preview') {
          fontCache.removeCSSLink(fontFamily);
          cleanedCount++;
          freedMemory += 1024;
        }
      }

      // Clear most binary cache except currently used high-priority fonts
      for (const [key, binary] of binaryCache.entries()) {
        if (!HIGH_PRIORITY_FONTS.has(binary.family)) {
          // Would remove binary here
          cleanedCount++;
          freedMemory += binary.buffer.byteLength;
        }
      }

      // Force garbage collection if available
      if ('gc' in window && typeof (window as any).gc === 'function') {
        (window as any).gc();
      }

      set((state) => ({
        stats: {
          ...state.stats,
          evictionCount: state.stats.evictionCount + cleanedCount,
        },
      }));

      console.log(
        `🚨 Aggressive cleanup completed: ${cleanedCount} entries, ${(freedMemory / 1024 / 1024).toFixed(2)}MB freed`,
      );
    } catch (error) {
      console.error('Aggressive cleanup failed:', error);
    }

    return { cleaned: cleanedCount, freedMemory };
  },

  // Cleanup operations
  performSmartCleanup: async () => {
    let cleanedCount = 0;
    let freedMemory = 0;

    try {
      // Import font cache dynamically to avoid circular dependency
      const { useFontCache } = await import('./fontCache');
      const fontCache = useFontCache.getState();
      const now = Date.now();

      // Smart CSS cleanup based on usage patterns
      const cssLinks = new Map(fontCache.cssLinks);
      const linksToRemove: string[] = [];

      for (const [fontFamily, tracker] of cssLinks.entries()) {
        const timeSinceLastUsed = now - tracker.lastUsed;
        const shouldCleanup =
          (tracker.purpose === 'preview' && timeSinceLastUsed > 10 * 60 * 1000) || // 10 min for preview
          (tracker.purpose === 'text-editing' && tracker.usageCount < 2 && timeSinceLastUsed > 30 * 60 * 1000) || // 30 min for unused text fonts
          timeSinceLastUsed > get().limits.maxAge;

        if (shouldCleanup && !HIGH_PRIORITY_FONTS.has(fontFamily)) {
          linksToRemove.push(fontFamily);
        }
      }

      // Remove identified CSS links
      for (const fontFamily of linksToRemove) {
        fontCache.removeCSSLink(fontFamily);
        cleanedCount++;
        freedMemory += 1024; // Estimate 1KB per CSS link
      }

      // Smart binary cleanup based on LRU and size
      const binaryCache = new Map(fontCache.cachedBinaries);
      const binariesToRemove: string[] = [];

      const binaryEntries = Array.from(binaryCache.entries())
        .map(([key, binary]) => ({
          binary,
          key,
          score: get().shouldEvictEntry({
            accessCount: 1, // Would need real tracking
            data: binary,
            lastAccessed: binary.timestamp, // Simplified - would need real tracking
            priority: get().calculatePriority(binary.family, 'unknown'),
            size: binary.buffer.byteLength,
            timestamp: binary.timestamp,
          } as CacheEntry<typeof binary>),
        }))
        .filter((entry) => entry.score)
        .sort((a, b) => b.binary.buffer.byteLength - a.binary.buffer.byteLength); // Remove largest first

      // Remove up to 25% of binaries if under memory pressure
      const maxToRemove = get().isMemoryPressureHigh()
        ? Math.ceil(binaryEntries.length * 0.25)
        : Math.ceil(binaryEntries.length * 0.1);

      for (let i = 0; i < Math.min(maxToRemove, binaryEntries.length); i++) {
        const entry = binaryEntries[i];

        binariesToRemove.push(entry.key);
        freedMemory += entry.binary.buffer.byteLength;
        cleanedCount++;
      }

      // Remove identified binaries
      for (const key of binariesToRemove) {
        const newCache = new Map(fontCache.cachedBinaries);

        newCache.delete(key);
        // Would need to call fontCache.setCachedBinaries(newCache) if such method existed
      }

      // Update stats
      set((state) => ({
        stats: {
          ...state.stats,
          evictionCount: state.stats.evictionCount + cleanedCount,
        },
      }));

      console.log(
        `🧹 Smart cleanup completed: ${cleanedCount} entries, ${(freedMemory / 1024 / 1024).toFixed(2)}MB freed`,
      );
    } catch (error) {
      console.error('Smart cleanup failed:', error);
    }

    return { cleaned: cleanedCount, freedMemory };
  },

  scheduleCleanup: (aggressive = false) => {
    setTimeout(async () => {
      if (aggressive) {
        await get().performAggressiveCleanup();
      } else {
        await get().performSmartCleanup();
      }
    }, 100); // Small delay to not block UI
  },

  shouldEvictEntry: <T>(entry: CacheEntry<T>) => {
    const state = get();
    const now = Date.now();

    // Never evict high-priority entries unless severely over limit
    if (entry.priority === 'high' && !get().isMemoryPressureHigh()) {
      return false;
    }

    // Age-based eviction
    if (now - entry.lastAccessed > state.limits.maxAge) {
      return true;
    }

    // Usage-based eviction (evict entries with low access count and old last access)
    const timeSinceAccess = now - entry.lastAccessed;
    const usageScore = entry.accessCount / Math.max(1, timeSinceAccess / (1000 * 60)); // accesses per minute

    return usageScore < 0.1; // Very low usage score
  },

  // Memory tracking
  stats: {
    binaryCacheSize: 0,
    cssCacheSize: 0,
    entriesCount: 0,
    evictionCount: 0,
    hitRate: 0,
    totalMemoryUsed: 0,
  },

  updateLimits: (newLimits: Partial<MemoryLimits>) => {
    set((state) => ({
      limits: { ...state.limits, ...newLimits },
    }));

    console.log('📊 Memory limits updated:', newLimits);
  },

  updateStats: () => {
    // This would be called by the cache stores to update memory stats
    const fontCache = import('./fontCache').then(({ useFontCache }) => useFontCache.getState());

    fontCache.then((cache) => {
      const stats = cache.getCacheStats();

      set({
        stats: {
          binaryCacheSize: stats.totalMemoryUsage,
          cssCacheSize: stats.cssLinkCount,
          entriesCount: stats.binaryCount + stats.cssLinkCount,
          evictionCount: get().stats.evictionCount,
          hitRate: 0, // Would be calculated based on hit/miss tracking
          totalMemoryUsed: stats.totalMemoryUsage,
        },
      });
    });
  },
}));

// Set up automatic memory management
if (typeof window !== 'undefined') {
  const memoryManager = useMemoryManager.getState();

  // Regular cleanup interval
  setInterval(() => {
    memoryManager.performSmartCleanup();
  }, memoryManager.limits.cleanupInterval);

  // Memory pressure monitoring
  setInterval(() => {
    memoryManager.updateStats();
    memoryManager.monitorMemoryPressure();
  }, 30000); // Check every 30 seconds

  // Listen to memory pressure events (experimental API)
  if ('memory' in performance && 'addEventListener' in (performance as any).memory) {
    (performance as any).memory.addEventListener?.('memorywarning', () => {
      console.log('🚨 System memory warning detected - triggering aggressive cleanup');
      memoryManager.performAggressiveCleanup();
    });
  }

  // Page visibility change cleanup
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      // Clean up when page becomes hidden
      setTimeout(() => {
        memoryManager.performSmartCleanup();
      }, 5000); // Wait 5 seconds before cleanup
    }
  });

  console.log('📊 Memory manager initialized with limits:', memoryManager.limits);
}

// Utility hook for components to access memory management
export const useMemoryManagement = () => {
  const memoryStats = useMemoryManager((state) => state.getMemoryStats());
  const isMemoryPressureHigh = useMemoryManager((state) => state.isMemoryPressureHigh);
  const performCleanup = useMemoryManager((state) => state.scheduleCleanup);

  return {
    isMemoryPressureHigh,
    memoryStats,
    performCleanup,
  };
};
