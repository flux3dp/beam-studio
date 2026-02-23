/**
 * Factory for creating default puzzle state.
 * Explicit defaults with type-specific overrides — no config traversal needed.
 */

import {
  DEFAULT_BORDER_RADIUS,
  DEFAULT_BORDER_WIDTH,
  DEFAULT_COLUMNS,
  DEFAULT_HEXAGON_ROWS,
  DEFAULT_ORIENTATION,
  DEFAULT_PIECE_SIZE,
  DEFAULT_RADIUS,
  DEFAULT_ROWS,
  DEFAULT_TAB_SIZE,
} from './constants';
import type { PuzzleState, ShapeType } from './types';

/** Base defaults shared by all puzzle types */
const BASE_DEFAULTS = {
  border: {
    enabled: false,
    guideLines: false,
    radius: DEFAULT_BORDER_RADIUS,
    width: DEFAULT_BORDER_WIDTH,
  },
  columns: DEFAULT_COLUMNS,
  image: {
    bleed: 2,
    dataUrl: null,
    enabled: false,
    exportAs: 'print' as const,
    offsetX: 0,
    offsetY: 0,
    zoom: 100,
  },
  orientation: DEFAULT_ORIENTATION as 1 | 2 | 3 | 4,
  pieceSize: DEFAULT_PIECE_SIZE,
  rows: DEFAULT_ROWS,
  tabSize: DEFAULT_TAB_SIZE,
  viewMode: 'design' as const,
};

/** Type-specific overrides for shapes with unique defaults */
const TYPE_SPECIFIC_DEFAULTS: Record<ShapeType, Partial<PuzzleState>> = {
  circle: {},
  heart: {},
  hexagon: { radius: DEFAULT_RADIUS, rows: DEFAULT_HEXAGON_ROWS },
  rectangle: { radius: DEFAULT_RADIUS },
};

/**
 * Creates a default PuzzleState for the given shape type.
 * Combines base defaults with type-specific overrides.
 */
export const createDefaultStateFromConfig = (typeId: ShapeType): PuzzleState =>
  ({
    ...BASE_DEFAULTS,
    ...TYPE_SPECIFIC_DEFAULTS[typeId],
    typeId,
  }) as PuzzleState;
