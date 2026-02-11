import { match } from 'ts-pattern';

import type { ViewMode } from './constants';

export type ShapeType = 'circle' | 'heart' | 'rectangle';

/** Jitter coefficients for a single tab edge */
export interface TabJitter {
  /** Tab depth offset perpendicular to edge */
  depthOffset: number;
  /** Perpendicular offset at entry point (20% along edge) */
  entryOffset: number;
  /** Perpendicular offset at exit point (80% along edge) */
  exitOffset: number;
  flip: boolean;
  /** Neck position offset along edge */
  neckOffset: number;
  /** Shoulder width offset */
  shoulderOffset: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Geometry types - Used across geometry, hooks, and Preview components
// ─────────────────────────────────────────────────────────────────────────────

export interface PuzzleEdges {
  boundaryPath: string;
  horizontalEdges: string;
  verticalEdges: string;
}

export interface MergeGroup {
  pieces: Array<{ col: number; row: number }>;
  sharedEdges: Array<{ col1: number; col2: number; row1: number; row2: number }>;
}

export interface PuzzleLayout {
  height: number;
  offsetX: number;
  offsetY: number;
  width: number;
}

export interface PuzzleGeometry {
  /** Board base outer boundary path (if border enabled) */
  boardBasePath?: string;
  /** Shape boundary path for clipping */
  boundaryPath: string;
  /** Puzzle edge paths */
  edges: PuzzleEdges;
  /** Frame dimensions (puzzle + border) */
  frameHeight: number;
  frameWidth: number;
  /** Base layout info */
  layout: PuzzleLayout;
  /** Merge groups for shapes that don't fill their bounding box */
  mergeGroups: MergeGroup[];
  /** Raised edges frame path with inner cutout (if border enabled) */
  raisedEdgesPath?: string;
}

/**
 * Shape metadata describing capabilities and parameter resolution.
 * Queried by consumer code instead of checking shape names directly.
 */
export interface ShapeMetadata {
  /** Corner radius for the outer border frame (resolved from state) */
  borderCornerRadius: number;
  /** Corner radius for the puzzle boundary (resolved from state) */
  boundaryCornerRadius: number;
  /** Whether the shape fills its entire bounding box (no clipping/merging needed when true) */
  fillsBoundingBox: boolean;
  /** Corner radius for the inner cutout of raised edges (resolved from state) */
  innerCutoutCornerRadius: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Property definition types - Used by OptionsPanel and PropertyRenderer
// ─────────────────────────────────────────────────────────────────────────────

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

export interface PuzzleTypeConfig {
  id: ShapeType;
  nameKey: string;
  properties: PropertyDef[];
  thumbnail: string;
}

export interface ImageState {
  bleed: number;
  dataUrl: null | string;
  enabled: boolean;
  exportAs: 'engrave' | 'none' | 'print';
  file: File | null;
  /** Horizontal offset as percentage of puzzle width (-150 to 150) */
  offsetX: number;
  /** Vertical offset as percentage of puzzle height (-150 to 150) */
  offsetY: number;
  zoom: number;
}

export interface BorderState {
  enabled: boolean;
  guideLines: boolean;
  radius: number;
  width: number;
}

interface BasePuzzleState {
  border: BorderState;
  columns: number;
  image: ImageState;
  orientation: 1 | 2 | 3 | 4;
  pieceSize: number;
  rows: number;
  tabSize: number;
  viewMode: ViewMode;
}

export interface CirclePuzzleState extends BasePuzzleState {
  typeId: 'circle';
}

export interface HeartPuzzleState extends BasePuzzleState {
  typeId: 'heart';
}

export interface RectanglePuzzleState extends BasePuzzleState {
  radius: number;
  typeId: 'rectangle';
}

export type PuzzleState = CirclePuzzleState | HeartPuzzleState | RectanglePuzzleState;

/** Keys for nested state objects updated via `onNestedStateChange`. */
export type NestedStateKey = 'border' | 'image';

/**
 * Fields that can be updated through the dynamic property system.
 * Auto-derived from each state variant so new shape-specific fields are included automatically.
 * Excludes `typeId` — shape switching is handled by `createDefaultPuzzleState`.
 */
export type PuzzleStateUpdate = Partial<
  Omit<CirclePuzzleState, 'typeId'> & Omit<HeartPuzzleState, 'typeId'> & Omit<RectanglePuzzleState, 'typeId'>
>;

export const createDefaultImageState = (): ImageState => ({
  bleed: 2,
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
  guideLines: false,
  radius: 0,
  width: 5,
});

const createBaseDefaults = (): BasePuzzleState => ({
  border: createDefaultBorderState(),
  columns: 5,
  image: createDefaultImageState(),
  orientation: 1,
  pieceSize: 15,
  rows: 5,
  tabSize: 20,
  viewMode: 'design',
});

export const createDefaultPuzzleState = (typeId: ShapeType): PuzzleState =>
  match(typeId)
    .with('circle', () => ({ ...createBaseDefaults(), typeId: 'circle' as const }))
    .with('heart', () => ({ ...createBaseDefaults(), typeId: 'heart' as const }))
    .with('rectangle', () => ({ ...createBaseDefaults(), radius: 0, typeId: 'rectangle' as const }))
    .exhaustive();
