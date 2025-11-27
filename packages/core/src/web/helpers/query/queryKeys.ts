/**
 * Type-safe query key factory for TanStack Query.
 *
 * This pattern provides:
 * - Centralized key management
 * - Type safety for query keys
 * - Easy cache invalidation by scope
 *
 * @example
 * // Invalidate all AI config queries
 * queryClient.invalidateQueries({ queryKey: queryKeys.aiConfig.all });
 *
 * // Invalidate specific locale
 * queryClient.invalidateQueries({ queryKey: queryKeys.aiConfig.byLocale('en-us') });
 */
export const queryKeys = {
  aiConfig: {
    all: ['ai-config'] as const,
    byLocale: (locale: string) => [...queryKeys.aiConfig.all, locale] as const,
  },
  // Future query keys can be added here
  // e.g., userCredits, deviceStatus, etc.
} as const;

// Type helper for extracting query key types
export type QueryKeys = typeof queryKeys;
