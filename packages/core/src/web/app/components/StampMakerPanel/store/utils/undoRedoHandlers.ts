import Konva from 'konva';
import type { Filter } from 'konva/lib/Node';
import { isNot, isShallowEqual } from 'remeda';
import { match } from 'ts-pattern';

import type { BevelRadiusOperation, State } from '../types';

export const handleRedo = (state: State): Partial<State> => {
  const { filters, history } = state;

  if (history.index >= history.operations.length) return state;

  const nextOperation = history.operations[history.index];
  const newHistory = { ...history, index: history.index + 1 };

  return match(nextOperation)
    .with({ mode: 'addFilter' }, ({ filter, isFront }) => ({
      filters: isFront ? [filter, ...filters] : [...filters, filter],
      history: newHistory,
    }))
    .with({ mode: 'removeFilter' }, ({ filter }) => ({
      filters: filters.filter(isNot(isShallowEqual(filter))),
      history: newHistory,
    }))
    .with({ mode: 'horizontalFlip' }, ({ value: horizontalFlip }) => ({ history: newHistory, horizontalFlip }))
    .with({ mode: 'invert' }, () => ({
      filters: filters.includes(Konva.Filters.Invert)
        ? filters.filter(isNot(isShallowEqual(Konva.Filters.Invert)))
        : [Konva.Filters.Invert, ...filters],
      history: newHistory,
    }))
    .with({ mode: 'bevelRadius' }, ({ filter, value }) => {
      let newFilters = filters;

      // Remove the last bevel radius filter if it exists
      if (state.lastBevelRadiusFilter) {
        newFilters = newFilters.filter(isNot(isShallowEqual(state.lastBevelRadiusFilter)));
      }

      // Add the new filter if it exists and value is not equal to 0
      if (value !== 0 && filter) {
        newFilters = [...newFilters, filter];
      }

      return {
        bevelRadius: value,
        filters: newFilters,
        history: newHistory,
        lastBevelRadiusFilter: filter,
      };
    })
    .otherwise(() => state);
};

export const handleUndo = (state: State): Partial<State> => {
  const { filters, history } = state;

  if (history.index === 0) return state;

  const lastOperation = history.operations[history.index - 1];
  const newHistory = { ...history, index: history.index - 1 };

  return match(lastOperation)
    .with({ mode: 'addFilter' }, ({ filter }) => ({
      filters: filters.filter(isNot(isShallowEqual(filter))),
      history: newHistory,
    }))
    .with({ mode: 'removeFilter' }, ({ filter, index }) => ({
      filters: [...filters.slice(0, index), filter, ...filters.slice(index)],
      history: newHistory,
    }))
    .with({ mode: 'invert' }, () => ({
      filters: filters.includes(Konva.Filters.Invert)
        ? filters.filter(isNot(isShallowEqual(Konva.Filters.Invert)))
        : [Konva.Filters.Invert, ...filters],
      history: newHistory,
    }))
    .with({ mode: 'horizontalFlip' }, ({ value }) => ({ history: newHistory, horizontalFlip: !value }))
    .with({ mode: 'bevelRadius' }, () => {
      // Find the previous bevelRadius operation to restore the previous state
      let previousBevelRadius = 0;
      let previousFilter: Filter | null = null;

      for (let i = history.index - 2; i >= 0; i--) {
        const op = history.operations[i];

        if (op.mode === 'bevelRadius') {
          previousBevelRadius = op.value;
          previousFilter = op.filter;
          break;
        }
      }

      let newFilters = filters;

      // Remove the current bevel radius filter
      const currentOp = lastOperation as BevelRadiusOperation;

      if (currentOp.filter) {
        newFilters = newFilters.filter(isNot(isShallowEqual(currentOp.filter)));
      }

      // Add back the previous filter if it exists and value is not equal to 0
      if (previousBevelRadius !== 0 && previousFilter) {
        newFilters = [...newFilters, previousFilter];
      }

      return {
        bevelRadius: previousBevelRadius,
        filters: newFilters,
        history: newHistory,
        lastBevelRadiusFilter: previousFilter,
      };
    })
    .otherwise(() => state);
};
