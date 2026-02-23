/**
 * Derives default puzzle state from property configuration.
 * This makes puzzleTypes.config.ts the single source of truth for defaults.
 */

import { getPuzzleTypeById } from './puzzleTypes.config';
import type { PropertyDef, PuzzleState, ShapeType } from './types';

/**
 * Sets a nested value in an object using dot notation.
 * @example setNestedValue(obj, 'border.width', 5) → obj.border.width = 5
 */
const setNestedValue = (obj: any, path: string, value: unknown): void => {
  const parts = path.split('.');

  if (parts.length === 1) {
    obj[path] = value;

    return;
  }

  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];

    if (!(key in current)) {
      current[key] = {};
    }

    current = current[key];
  }

  current[parts[parts.length - 1]] = value;
};

/**
 * Recursively extracts default values from property definitions.
 * Type-specific defaults are handled by using different property definitions
 * in the config (e.g., HEXAGON_ROWS_PROPERTY vs ROWS_PROPERTY).
 */
const extractDefaults = (properties: PropertyDef[], state: any): void => {
  properties.forEach((prop) => {
    if (prop.type === 'group') {
      // Recursively process group children
      extractDefaults(prop.children, state);
    } else if (prop.type === 'image-upload') {
      // Initialize image.dataUrl as null to match type declaration
      setNestedValue(state, prop.key, null);
    } else if ('default' in prop) {
      // Extract default value for all other property types
      setNestedValue(state, prop.key, prop.default);
    }
  });
};

/**
 * Creates a default PuzzleState by reading property definitions from config.
 * This ensures config is the single source of truth for all defaults.
 */
export const createDefaultStateFromConfig = (typeId: ShapeType): PuzzleState => {
  const config = getPuzzleTypeById(typeId);

  if (!config) {
    throw new Error(`Unknown puzzle type: ${typeId}`);
  }

  // Start with typeId and viewMode (not in properties)
  const state: any = {
    typeId,
    viewMode: 'design',
  };

  // Extract all defaults from property tree
  extractDefaults(config.properties, state);

  return state as PuzzleState;
};
