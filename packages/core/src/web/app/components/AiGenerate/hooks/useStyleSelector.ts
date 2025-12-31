/**
 * useStyleSelector - Shared hook for style selection logic.
 *
 * Used by both StyleSelectionPanel (desktop) and MobileStyleSelector (mobile).
 * Encapsulates:
 * - Category filtering (excludes 'customize')
 * - Initial category selection based on current style
 * - Styles for selected category
 */
import { useMemo, useState } from 'react';

import { getCategoryIdFromStyle, getStylesForCategory } from '../utils/categories';

import { useAiConfigQuery } from './useAiConfigQuery';

interface UseStyleSelectorOptions {
  styleId: string;
}

export const useStyleSelector = ({ styleId }: UseStyleSelectorOptions) => {
  const {
    data: { categories, styles },
  } = useAiConfigQuery();

  // Filter out 'customize' category for display
  const displayCategories = useMemo(() => categories.filter((c) => c.id !== 'customize'), [categories]);

  // Initialize selected category based on current style
  const [selectedCategory, setSelectedCategory] = useState(() =>
    getCategoryIdFromStyle(styleId, styles, displayCategories),
  );

  // Get styles for the selected category
  const categoryStyles = useMemo(
    () => getStylesForCategory(selectedCategory, styles, displayCategories),
    [selectedCategory, styles, displayCategories],
  );

  return { categoryStyles, displayCategories, selectedCategory, setSelectedCategory, styles };
};
