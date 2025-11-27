export const toSnakeCase = (str: string): string => str.replace(/([A-Z])/g, '_$1').toLowerCase();

export const toCamelCase = (str: string): string => str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

export const objectToSnakeCase = (obj: Record<string, unknown>): Record<string, unknown> => {
  const result: Record<string, unknown> = {};

  Object.entries(obj).forEach(([key, value]) => {
    result[toSnakeCase(key)] = value;
  });

  return result;
};

export const objectToCamelCase = (obj: Record<string, unknown>): Record<string, unknown> => {
  const result: Record<string, unknown> = {};

  Object.entries(obj).forEach(([key, value]) => {
    result[toCamelCase(key)] = value;
  });

  return result;
};
