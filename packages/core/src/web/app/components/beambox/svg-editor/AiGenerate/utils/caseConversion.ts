/**
 * Convert camelCase string to snake_case
 * Example: textToDisplay -> text_to_display
 */
export const toSnakeCase = (str: string): string => str.replace(/([A-Z])/g, '_$1').toLowerCase();

/**
 * Convert snake_case string to camelCase
 * Example: text_to_display -> textToDisplay
 */
export const toCamelCase = (str: string): string => str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

/**
 * Convert an object's keys from camelCase to snake_case
 */
export const objectToSnakeCase = (obj: Record<string, unknown>): Record<string, unknown> => {
  const result: Record<string, unknown> = {};

  Object.entries(obj).forEach(([key, value]) => {
    result[toSnakeCase(key)] = value;
  });

  return result;
};

/**
 * Convert an object's keys from snake_case to camelCase
 */
export const objectToCamelCase = (obj: Record<string, unknown>): Record<string, unknown> => {
  const result: Record<string, unknown> = {};

  Object.entries(obj).forEach(([key, value]) => {
    result[toCamelCase(key)] = value;
  });

  return result;
};
