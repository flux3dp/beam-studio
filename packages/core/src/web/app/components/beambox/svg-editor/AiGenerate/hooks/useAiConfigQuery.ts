import { useQuery } from '@tanstack/react-query';
import { pick } from 'remeda';

import type { MappedCategory, MappedStyle, StyleWithInputFields } from '@core/helpers/api/ai-image-config';
import { fetchAllAiConfig, getLocale } from '@core/helpers/api/ai-image-config';
import { queryKeys } from '@core/helpers/query';

export interface AiConfigData {
  categories: MappedCategory[];
  styles: MappedStyle[];
  stylesWithFields: StyleWithInputFields[];
}

export const useAiConfigQuery = () => {
  const locale = getLocale();

  return useQuery<AiConfigData, Error>({
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    queryFn: async () => {
      const result = await fetchAllAiConfig();

      if ('error' in result) {
        throw new Error(result.error);
      }

      return pick(result, ['categories', 'styles', 'stylesWithFields']);
    },
    queryKey: queryKeys.aiConfig.byLocale(locale),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};
