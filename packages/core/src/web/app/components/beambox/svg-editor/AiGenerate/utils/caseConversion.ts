import { toCamelCase, toSnakeCase } from 'remeda';

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
