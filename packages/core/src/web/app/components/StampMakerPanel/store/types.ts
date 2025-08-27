import type { Filter } from 'konva/lib/Node';

export type AddFilterOperation = {
  filter: Filter;
  isFront: boolean;
  mode: 'addFilter';
};

export type RemoveFilterOperation = {
  filter: Filter;
  index: number;
  mode: 'removeFilter';
};

export type InvertOperation = {
  mode: 'invert';
  newBevelRadiusFilter: Filter | null;
  oldBevelRadiusFilter: Filter | null;
  value: 'black' | 'white';
};

export type HorizontalFlipOperation = {
  mode: 'horizontalFlip';
  value: boolean;
};

export type BevelRadiusOperation = {
  filter: Filter | null;
  mode: 'bevelRadius';
  value: number;
};

export type HistoryOperation =
  | AddFilterOperation
  | BevelRadiusOperation
  | HorizontalFlipOperation
  | InvertOperation
  | RemoveFilterOperation;

export interface HistoryState {
  index: number;
  operations: HistoryOperation[];
}
