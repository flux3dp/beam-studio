/**
 * Google Font Store - Unified Interface
 *
 * This file provides backward compatibility while using the new focused store architecture.
 * The large monolithic store has been split into focused modules:
 * - fontCache: Binary and CSS caching
 * - fontLoading: Loading operations and queue management
 * - fontRegistry: Font registration and history
 * - networkState: Network monitoring
 */

// Export focused stores for direct access when needed
export { useFontCache } from './fontCache';

export { useFontLoading } from './fontLoading';
export { useFontRegistry } from './fontRegistry';
export { useNetworkState } from './networkState';
// Re-export types for external consumers
export type { FontLoadOptions, FontLoadPriority, FontLoadPurpose } from './types';

// Export the unified store interface for backward compatibility
export { useGoogleFontStore } from './unifiedStore';
