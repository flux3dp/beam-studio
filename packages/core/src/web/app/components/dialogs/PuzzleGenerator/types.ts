import type { ViewMode } from './constants';

export type ShapeType = 'circle' | 'heart' | 'hexagon' | 'rectangle';

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
  horizontalEdges: string;
  verticalEdges: string;
}

export interface GridPosition {
  col: number;
  row: number;
}

export interface MergeGroup {
  pieces: GridPosition[];
  sharedEdges: Array<{ col1: number; col2: number; row1: number; row2: number }>;
}

export interface PieceVisibility extends GridPosition {
  visibleRatio: number;
}

export interface PuzzleLayout {
  height: number;
  offsetX: number;
  offsetY: number;
  width: number;
}

export interface ClipContext {
  centerYOffset: number;
  cornerRadius: number;
  height: number;
  shapeType: ShapeType;
  width: number;
}

export interface PuzzleGeometry {
  boardBasePath?: string;
  boundaryPath: string;
  clipContext: ClipContext;
  edges: PuzzleEdges;
  frameHeight: number;
  frameWidth: number;
  layout: PuzzleLayout;
  mergeGroups: MergeGroup[];
  meta: ShapeMetadata;
  raisedEdgesPath?: string;
}

export interface ShapeMetadata {
  borderCornerRadius: number;
  boundaryCornerRadius: number;
  boundaryHeight: number;
  centerYOffset: number;
  fillsBoundingBox: boolean;
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

export interface HexagonPuzzleState extends BasePuzzleState {
  radius: number;
  typeId: 'hexagon';
}

export interface RectanglePuzzleState extends BasePuzzleState {
  radius: number;
  typeId: 'rectangle';
}

export type PuzzleState = CirclePuzzleState | HeartPuzzleState | HexagonPuzzleState | RectanglePuzzleState;

/** Keys for nested state objects updated via `onNestedStateChange`. */
export type NestedStateKey = 'border' | 'image';

/**
 * Fields that can be updated through the dynamic property system.
 * Uses a distributive mapped union — an update can contain fields from any single shape variant.
 * Excludes `typeId` — shape switching is handled by `createDefaultPuzzleState`.
 */
export type PuzzleStateUpdate = {
  [K in PuzzleState['typeId']]: Partial<Omit<Extract<PuzzleState, { typeId: K }>, 'typeId'>>;
}[PuzzleState['typeId']];

/**
 * Creates default puzzle state by deriving values from property configuration.
 * Config (puzzleTypes.config.ts) is the single source of truth for defaults.
 *
 * NOTE: This is now implemented in configToState.ts to avoid circular dependencies.
 * Re-exported here for convenience.
 */
export { createDefaultStateFromConfig } from './configToState';
