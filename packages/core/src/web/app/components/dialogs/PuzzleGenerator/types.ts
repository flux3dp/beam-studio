/**
 * Puzzle Generator Type Definitions
 *
 * This file defines the schema-driven configuration system for puzzle types.
 * New puzzle types can be added by defining a PuzzleTypeConfig object.
 */

import type { ShapeType } from './shapeGenerators';

// ============================================================================
// Property Definition Types
// ============================================================================

export type PropertyType = 'group' | 'image-upload' | 'number' | 'select' | 'slider' | 'toggle';

interface BasePropertyDef {
  condition?: (state: PuzzleState) => boolean;
  key: string;
  labelKey: string;
  type: PropertyType;
  visible?: boolean;
}

export interface NumberPropertyDef extends BasePropertyDef {
  default: number;
  max: number;
  min: number;
  step?: number;
  type: 'number' | 'slider';
  unit?: string;
}

export interface SelectPropertyDef extends BasePropertyDef {
  default: number | string;
  options: Array<{ labelKey: string; value: number | string }>;
  type: 'select';
}

export interface TogglePropertyDef extends BasePropertyDef {
  default: boolean;
  type: 'toggle';
}

export interface ImageUploadPropertyDef extends BasePropertyDef {
  accept: string;
  maxResolution: number;
  maxSizeMB: number;
  type: 'image-upload';
}

export interface GroupPropertyDef extends BasePropertyDef {
  children: PropertyDef[];
  enabledBy?: string;
  expandable?: boolean;
  type: 'group';
}

export type PropertyDef =
  | GroupPropertyDef
  | ImageUploadPropertyDef
  | NumberPropertyDef
  | SelectPropertyDef
  | TogglePropertyDef;

// ============================================================================
// Puzzle Type Configuration
// ============================================================================

export interface PuzzleTypeConfig {
  gridGenerator: ShapeType;
  id: string;
  nameKey: string;
  properties: PropertyDef[];
  thumbnail: string;
}

// ============================================================================
// State Types
// ============================================================================

export interface ImageState {
  dataUrl: null | string;
  enabled: boolean;
  exportAs: 'engrave' | 'print';
  file: File | null;
  offsetX: number;
  offsetY: number;
  zoom: number;
}

export interface BorderState {
  enabled: boolean;
  radius: number;
  width: number;
}

export interface PuzzleState {
  [key: string]: unknown;

  border: BorderState;
  columns: number;
  image: ImageState;
  orientation: 1 | 2 | 3 | 4;
  pieceSize: number;
  rows: number;
  tabSize: number;
  typeId: string;
  viewMode: 'assembled' | 'layers';
}

// ============================================================================
// Default State Factory
// ============================================================================

export const createDefaultImageState = (): ImageState => ({
  dataUrl: null,
  enabled: false,
  exportAs: 'print',
  file: null,
  offsetX: 0,
  offsetY: 0,
  zoom: 100,
});

export const createDefaultBorderState = (): BorderState => ({
  enabled: false,
  radius: 0,
  width: 5,
});

export const createDefaultPuzzleState = (typeId: string): PuzzleState => ({
  border: createDefaultBorderState(),
  columns: 5,
  image: createDefaultImageState(),
  orientation: 1,
  pieceSize: 15,
  rows: 5,
  tabSize: 20,
  typeId,
  viewMode: 'assembled',
});

// ============================================================================
// Utility Types
// ============================================================================

export type PuzzleStateUpdater = (updates: Partial<PuzzleState>) => void;
export type NestedStateUpdater<T> = (key: keyof PuzzleState, updates: Partial<T>) => void;

// ============================================================================
// Jitter Types (for natural-looking tab variation)
// ============================================================================

/**
 * Jitter coefficients for a single tab edge (Draradech algorithm)
 *
 * These coefficients create unique, natural-looking tabs:
 * - flip: Random direction (true = outward, false = inward)
 * - a: Start curve offset (inherited from previous tab's 'e', inverted if flip changed)
 * - b: Horizontal shift of the entire knob
 * - c: Vertical shift of the entire knob
 * - d: Asymmetry factor (makes left/right sides of knob different)
 * - e: End curve offset (passed to next tab as 'a')
 */
export interface TabJitter {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  flip: boolean;
}

/**
 * Pre-computed jitter map for entire puzzle
 * Ensures reproducibility and smooth continuity between adjacent tabs
 */
export interface PuzzleJitterMap {
  horizontal: TabJitter[][];
  vertical: TabJitter[][];
}
