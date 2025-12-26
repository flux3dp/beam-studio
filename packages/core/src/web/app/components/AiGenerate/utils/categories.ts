import type { Category, Style } from '@core/helpers/api/ai-image-config';

import { DEFAULT_CATEGORY, DEFAULT_STYLE } from '../types';

/**
 * Find styles that match ANY of a category's tags.
 */
export const getStylesForCategory = (
  categoryId: string,
  styles: Style[] = [],
  categories: Category[] = [],
): Style[] => {
  const category = categories.find((c) => c.id === categoryId);

  if (!category) return [];

  return styles.filter((style) => style.tags.some((tag) => category.tags.includes(tag)));
};

/**
 * Get config for a style ID, with a safe fallback.
 */
export const getStyleConfig = (styleId: string, styles: Style[] = []): Style =>
  styles.find((s) => s.id === styleId) || styles[0] || DEFAULT_STYLE;

/**
 * Get the first category's id containing a specific style.
 */
export const getCategoryIdFromStyle = (styleId: string, styles: Style[], categories: Category[] = []): string => {
  const fallback = categories[0]?.id || DEFAULT_CATEGORY.id;

  if (!styleId) return fallback;

  const style = styles.find((s) => s.id === styleId);

  if (!style) return fallback;

  return categories.find((cat) => cat.tags.some((tag) => style.tags.includes(tag)))?.id || fallback;
};

/**
 * Get the first style from the first non-customize category.
 */
export const getDefaultStyle = (styles: Style[] = [], categories: Category[] = []): null | Style => {
  const firstCategory = categories.find((c) => c.id !== 'customize');

  if (!firstCategory) return null;

  const categoryStyles = getStylesForCategory(firstCategory.id, styles, categories);

  return categoryStyles[0] || null;
};
