import type { MappedInputField, StyleWithInputFields } from '@core/helpers/api/ai-image-config';

/**
 * Gets input fields for a style from the backend configuration.
 */
export const getInputFieldsForStyle = (
  styleId: null | string,
  stylesWithFields?: StyleWithInputFields[],
): MappedInputField[] => {
  if (!styleId || !stylesWithFields) return [];

  const style = stylesWithFields.find((s) => s.id === styleId);

  return style?.inputFields || [];
};
