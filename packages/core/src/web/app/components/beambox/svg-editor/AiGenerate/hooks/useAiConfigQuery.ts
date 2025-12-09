import { useQuery } from '@tanstack/react-query';

import type { Category, Style } from '@core/helpers/api/ai-image-config';
import { fetchAllAiConfig, getLocale } from '@core/helpers/api/ai-image-config';
import { queryKeys } from '@core/helpers/query';

export interface AiConfigData {
  categories: Category[];
  styles: Style[];
}

const PLACEHOLDER_DATA: AiConfigData = {
  categories: [{ displayName: 'Customize', id: 'customize', previewImage: '', tags: ['customize'] }],
  styles: [
    {
      displayName: 'Customize',
      id: 'customize',
      inputFields: [
        { key: 'description', label: 'Description', maxLength: 2000, placeholder: 'Enter prompts', required: false },
      ],
      modes: ['text-to-image', 'edit'],
      previewImage: '',
      tags: ['customize'],
    },
  ],
};

export const useAiConfigQuery = () => {
  const locale = getLocale();

  return useQuery<AiConfigData, Error>({
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    placeholderData: PLACEHOLDER_DATA,
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
