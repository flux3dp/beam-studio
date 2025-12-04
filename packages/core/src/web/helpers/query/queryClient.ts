import { QueryClient } from '@tanstack/react-query';

import { fetchAllAiConfig, getLocale } from '@core/helpers/api/ai-image-config';

import { queryKeys } from './queryKeys';

/**
 * Shared QueryClient instance for the entire application.
 *
 * Default configuration:
 * - staleTime: 5 minutes - data considered fresh for this duration
 * - gcTime: 1 hour - unused data kept in cache for this duration
 * - retry: 2 - automatic retries on failure
 * - refetchOnWindowFocus: true - refetch when window regains focus
 * - refetchOnReconnect: true - refetch when network reconnects
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60, // 1 hour
      refetchOnReconnect: true,
      refetchOnWindowFocus: true,
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

/**
 * Create a fresh QueryClient for testing purposes.
 * Each test should use its own QueryClient to avoid shared state.
 */
export const createTestQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: Infinity,
        retry: false,
        staleTime: Infinity,
      },
    },
  });

/**
 * Prefetch AI config data into the query cache.
 * Called during app initialization to warm the cache before users open the AI panel.
 *
 * This uses the same query key as useAiConfigQuery, so the data will be
 * immediately available when the hook is called.
 */
export const prefetchAiConfig = async (): Promise<void> => {
  const locale = getLocale();

  await queryClient.prefetchQuery({
    queryFn: async () => {
      const result = await fetchAllAiConfig();

      if ('error' in result) {
        throw new Error(result.error);
      }

      return {
        categories: result.categories,
        styles: result.styles,
        stylesWithFields: result.styles,
      };
    },
    queryKey: queryKeys.aiConfig.byLocale(locale),
    staleTime: 1000 * 60 * 60, // 1 hour - same as useAiConfigQuery
  });
};
