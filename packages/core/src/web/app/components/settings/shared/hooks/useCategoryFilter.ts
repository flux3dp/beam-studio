import { useMemo } from 'react';

import type { SettingCategoryConfig } from '../../modal/types';

interface UseCategoryFilterResult {
  visibleCategories: SettingCategoryConfig[];
}

export const useCategoryFilter = (categories: SettingCategoryConfig[]): UseCategoryFilterResult => {
  const visibleCategories = useMemo(() => categories.filter((cat) => cat.visible !== false), [categories]);

  return { visibleCategories };
};
