import { useQuery } from '@tanstack/react-query';

import type { AiConfigData } from '@core/helpers/api/ai-image-config';
import { fetchAllAiConfig, getLocale } from '@core/helpers/api/ai-image-config';
import { queryKeys } from '@core/helpers/query';

import { DEFAULT_CATEGORY, DEFAULT_STYLE } from '../types';

const INITIAL_DATA: AiConfigData = { categories: [DEFAULT_CATEGORY], styles: [DEFAULT_STYLE] };

export const useAiConfigQuery = () => {
  const locale = getLocale();

  return useQuery<AiConfigData, Error>({
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    initialData: INITIAL_DATA,
    initialDataUpdatedAt: 0, // set to 0 to mark initial data as stale
    queryFn: async () => {
      const result = await fetchAllAiConfig();

      if ('error' in result) {
        throw new Error(result.error);
      }

      return result;
    },
    queryKey: queryKeys.aiConfig.byLocale(locale),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};
