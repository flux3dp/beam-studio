import type { InputField, Style } from '@core/helpers/api/ai-image-config';

/**
 * Gets input fields for a style from the backend configuration.
 */
export const getInputFieldsForStyle = (styleId: null | string, styles?: Style[]): InputField[] => {
  if (!styleId || !styles) return [];

  const style = styles.find((s) => s.id === styleId);

  return style?.inputFields || [];
};
