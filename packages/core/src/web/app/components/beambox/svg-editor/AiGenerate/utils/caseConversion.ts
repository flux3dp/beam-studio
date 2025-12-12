import { toSnakeCase } from 'remeda';

export const objectToSnakeCase = (obj: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(Object.entries(obj).map(([key, value]) => [toSnakeCase(key), value]));
