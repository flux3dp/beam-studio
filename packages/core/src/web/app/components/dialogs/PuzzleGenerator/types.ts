/**
 * Puzzle Generator Type Definitions
 *
 * This file defines the schema-driven configuration system for puzzle types.
 * New puzzle types can be added by defining a PuzzleTypeConfig object.
 */

// ============================================================================
// Property Definition Types
// ============================================================================

export type PropertyType = 'group' | 'image-upload' | 'number' | 'select' | 'slider' | 'toggle';

interface BasePropertyDef {
  condition?: (state: PuzzleState) => boolean; // dynamic visibility based on state
  key: string;
  labelKey: string; // i18n key under puzzle_generator.*
  type: PropertyType;
  visible?: boolean; // default true
}

export interface NumberPropertyDef extends BasePropertyDef {
  default: number;
  max: number;
  min: number;
  step?: number;
  type: 'number' | 'slider';
  unit?: string; // 'mm', '%', '°', etc.
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
  accept: string; // e.g., 'image/jpeg,image/png,image/webp'
  maxResolution: number;
  maxSizeMB: number;
  type: 'image-upload';
}

export interface GroupPropertyDef extends BasePropertyDef {
  children: PropertyDef[];
  enabledBy?: string; // key of toggle that enables this group
  expandable?: boolean; // accordion style
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

export type GridGeneratorType = 'rectangle' | 'warpedCircle' | 'warpedHeart' | string;

export interface PuzzleTypeConfig {
  // Optional SVG clip path definition for preview
  getClipPath?: (width: number, height: number) => string;
  gridGenerator: GridGeneratorType;
  id: string;
  nameKey: string; // i18n key for display name (e.g., 'types.circle_jigsaw')
  properties: PropertyDef[];
  supportsExplodedView?: boolean; // Whether to show exploded view toggle (default: false)
  thumbnail: string; // imported image asset
}

// ============================================================================
// State Types
// ============================================================================

export interface ImageState {
  dataUrl: null | string;
  enabled: boolean;
  exportAs: 'engrave' | 'print';
  file: File | null;
  offsetX: number; // -1000 to 1000
  offsetY: number; // -1000 to 1000
  zoom: number; // 25-400%
}

export interface BorderState {
  enabled: boolean;
  radius: number; // 0-50
  width: number; // 1-20mm
}

export interface PuzzleState {
  // Extensible: additional properties from custom types
  [key: string]: unknown;

  border: BorderState;
  // Grid settings
  columns: number;
  // Nested state groups
  image: ImageState;
  orientation: 1 | 2 | 3 | 4;
  pieceSize: number; // mm

  rows: number;
  tabSize: number; // Display value 0-30, converted to 0-12% internally (value * 0.4)

  // Current puzzle type
  typeId: string;

  // View mode for preview
  viewMode: 'assembled' | 'exploded';
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
  tabSize: 20, // Display value 20 (internally 20 * 0.4 = 8%)
  typeId,
  viewMode: 'assembled',
});

// ============================================================================
// Utility Types
// ============================================================================

export type PuzzleStateUpdater = (updates: Partial<PuzzleState>) => void;
export type NestedStateUpdater<T> = (key: keyof PuzzleState, updates: Partial<T>) => void;
