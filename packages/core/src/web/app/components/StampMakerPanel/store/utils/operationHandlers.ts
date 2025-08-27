import type { Filter } from 'konva/lib/Node';
import { isNot, isShallowEqual } from 'remeda';

import type { AddFilterOperation, HistoryState, RemoveFilterOperation } from '../types';

import type { BackgroundType } from './detectBackgroundType';
import { addItemToHistory } from './historyUtils';

export interface State {
  backgroundType: BackgroundType;
  bevelRadius: number;
  filters: Filter[];
  history: HistoryState;
  horizontalFlip: boolean;
  lastBevelRadiusFilter: Filter | null;
}

export const addFilter = (
  state: State,
  filter: Filter,
  options: { history?: HistoryState; isFront?: boolean } = { isFront: false },
): { filters: Filter[]; history: HistoryState } => {
  const { filters, history } = state;
  const operation: AddFilterOperation = {
    filter,
    isFront: options.isFront!,
    mode: 'addFilter',
  };
  const newHistory = options.history ?? addItemToHistory(history, operation);

  return {
    filters: options.isFront ? [filter, ...filters] : [...filters, filter],
    history: newHistory,
  };
};

export const removeFilter = (
  state: State,
  filter: Filter,
  options: { history?: HistoryState } = {},
): { filters: Filter[]; history: HistoryState } => {
  const { filters, history } = state;

  const filterIndex = filters.findIndex((f) => isShallowEqual(f, filter));

  if (filterIndex === -1) return state;

  const operation: RemoveFilterOperation = {
    filter,
    index: filterIndex,
    mode: 'removeFilter',
  };
  const newHistory = options.history ?? addItemToHistory(history, operation);

  return {
    filters: filters.filter(isNot(isShallowEqual(filter))),
    history: newHistory,
  };
};
