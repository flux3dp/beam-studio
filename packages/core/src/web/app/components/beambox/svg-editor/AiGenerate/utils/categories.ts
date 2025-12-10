import type { Category, Style } from '@core/helpers/api/ai-image-config';

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
export const getStyleConfig = (styleId: string, styles: Style[] = []): Style => {
  return styles.find((s) => s.id === styleId) || styles[0] || { id: 'plain', tags: ['customize'] };
};

/**
 * Get the first category containing a specific style.
 */
export const getCategoryForOption = (
  styleId: null | string,
  styles: Style[] = [],
  categories: Category[] = [],
): Category | null => {
  if (!styleId) return null;

  const style = styles.find((s) => s.id === styleId);

  if (!style) return null;

  return categories.find((cat) => cat.tags.some((tag) => style.tags.includes(tag))) || null;
};
