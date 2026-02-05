import { match } from 'ts-pattern';

import type { ShapeType } from './shapeGenerators';

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
  shapeType: ShapeType;
  thumbnail: string;
}

export interface ImageState {
  bleed: number;
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
  viewMode: 'design' | 'exploded';
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

/**
 * Fields that can be updated through the dynamic property system.
 * Includes all shared fields plus every shape-specific field (e.g. `radius`).
 * Excludes `typeId` — shape switching is handled by `createDefaultPuzzleState`.
 */
export type PuzzleStateUpdate = Partial<BasePuzzleState & { radius: number }>;

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

const baseDefaults: BasePuzzleState = {
  border: createDefaultBorderState(),
  columns: 5,
  image: createDefaultImageState(),
  orientation: 1,
  pieceSize: 15,
  rows: 5,
  tabSize: 20,
  viewMode: 'design',
};

export const createDefaultPuzzleState = (typeId: ShapeType): PuzzleState =>
  match(typeId)
    .with('circle', () => ({ ...baseDefaults, typeId: 'circle' as const }))
    .with('heart', () => ({ ...baseDefaults, typeId: 'heart' as const }))
    .with('rectangle', () => ({ ...baseDefaults, radius: 0, typeId: 'rectangle' as const }))
    .exhaustive();

/** Jitter coefficients for a single tab edge */
export interface TabJitter {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  flip: boolean;
}

export interface PuzzleJitterMap {
  horizontal: TabJitter[][];
  vertical: TabJitter[][];
}
