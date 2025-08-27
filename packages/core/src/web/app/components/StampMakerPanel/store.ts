import Konva from 'konva';
import type { Filter } from 'konva/lib/Node';
import { isNot, isShallowEqual } from 'remeda';
import { match } from 'ts-pattern';
import { create } from 'zustand';
import { combine } from 'zustand/middleware';

import { createExpandFilter } from './utils/createExpandFilter';
import { createShrinkFilter } from './utils/createShrinkFilter';
import type { BackgroundType } from './utils/detectBackgroundType';
import { getFilterForBackgroundType } from './utils/detectBackgroundType';

type AddFilterOperation = {
  filter: Filter;
  isFront: boolean;
  mode: 'addFilter';
};

type RemoveFilterOperation = {
  filter: Filter;
  index: number;
  mode: 'removeFilter';
};

type InvertOperation = {
  mode: 'invert';
  newBevelRadiusFilter: Filter | null;
  oldBevelRadiusFilter: Filter | null;
  value: 'black' | 'white';
};

type HorizontalFlipOperation = {
  mode: 'horizontalFlip';
  value: boolean;
};

type BevelRadiusOperation = {
  filter: Filter | null;
  mode: 'bevelRadius';
  value: number;
};

type HistoryOperation =
  | AddFilterOperation
  | BevelRadiusOperation
  | HorizontalFlipOperation
  | InvertOperation
  | RemoveFilterOperation;

interface HistoryState {
  index: number;
  operations: HistoryOperation[];
}

interface State {
  backgroundType: BackgroundType;
  bevelRadius: number;
  filters: Filter[];
  history: HistoryState;
  horizontalFlip: boolean;
  lastBevelRadiusFilter: Filter | null;
}

const getDefaultState = (): State => ({
  backgroundType: 'white', // Default assumption, will be detected from actual image
  bevelRadius: 0,
  filters: [],
  history: { index: 0, operations: [] },
  horizontalFlip: false,
  lastBevelRadiusFilter: null,
});

interface ImageEditPanelStore extends State {
  addFilter: (filter: Filter, isFront?: boolean) => void;
  redo: () => void;
  removeFilter: (filter: Filter) => void;
  resetState: () => void;
  setBackgroundType: (backgroundType: BackgroundType) => void;
  setBevelRadius: (value: number) => void;
  setHorizontalFlip: (value: boolean) => void;
  toggleInvert: () => void;
  undo: () => void;
}

const addItemToHistory = ({ index, operations }: HistoryState, item: HistoryOperation): HistoryState => {
  operations.length = index;
  operations.push(item);

  return { index: index + 1, operations };
};

const _addFilter = (
  state: State,
  filter: Filter,
  options: { history?: HistoryState; isFront?: boolean } = { isFront: false },
): { filters: Filter[]; history: HistoryState } => {
  const { filters, history } = state;
  const operation: AddFilterOperation = { filter, isFront: options.isFront!, mode: 'addFilter' };
  const newHistory = options.history ?? addItemToHistory(history, operation);

  return { filters: options.isFront ? [filter, ...filters] : [...filters, filter], history: newHistory };
};

const _removeFilter = (
  state: State,
  filter: Filter,
  options: { history?: HistoryState } = {},
): { filters: Filter[]; history: HistoryState } => {
  const { filters, history } = state;

  const filterIndex = filters.findIndex((f) => isShallowEqual(f, filter));

  if (filterIndex === -1) return state;

  const operation: RemoveFilterOperation = { filter, index: filterIndex, mode: 'removeFilter' };
  const newHistory = options.history ?? addItemToHistory(history, operation);

  return { filters: filters.filter(isNot(isShallowEqual(filter))), history: newHistory };
};

export const useStampMakerPanelStore = create<ImageEditPanelStore>(
  combine(getDefaultState(), (set) => ({
    addFilter: (filter: Filter, isFront?: boolean) => set((state) => _addFilter(state, filter, { isFront })),
    redo: () =>
      set((state) => {
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
          .with({ mode: 'horizontalFlip' }, ({ value }) => ({ history: newHistory, horizontalFlip: value }))
          .with({ mode: 'invert' }, ({ newBevelRadiusFilter, oldBevelRadiusFilter, value }) => {
            let newFilters = filters;
            const isCurrentlyInverted = filters.includes(Konva.Filters.Invert);

            // Handle bevel radius filter changes
            if (oldBevelRadiusFilter) {
              newFilters = newFilters.filter(isNot(isShallowEqual(oldBevelRadiusFilter)));
            }

            if (newBevelRadiusFilter) {
              newFilters = [...newFilters, newBevelRadiusFilter];
            }

            // Handle invert filter
            if (isCurrentlyInverted) {
              newFilters = newFilters.filter(isNot(isShallowEqual(Konva.Filters.Invert)));
            } else {
              newFilters = [Konva.Filters.Invert, ...newFilters];
            }

            return {
              backgroundType: value,
              filters: newFilters,
              history: newHistory,
              lastBevelRadiusFilter: newBevelRadiusFilter,
            };
          })
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
      }),
    removeFilter: (filter: Filter) => set((state) => _removeFilter(state, filter)),
    resetState: () => set(getDefaultState()),
    setBackgroundType: (backgroundType: BackgroundType) =>
      set(() => {
        // If background type changed and there's an active bevel radius, update the filter
        // if (state.backgroundType !== backgroundType && state.bevelRadius > 0) {
        //   const filterType = getFilterForBackgroundType(backgroundType);
        //   const newFilter =
        //     filterType === 'expand'
        //       ? createExpandFilter({ rampWidth: state.bevelRadius * 10 })
        //       : createShrinkFilter({ rampWidth: state.bevelRadius * 10 });

        //   let filters = state.filters;

        //   // Remove the old bevel radius filter
        //   if (state.lastBevelRadiusFilter) {
        //     filters = filters.filter(isNot(isShallowEqual(state.lastBevelRadiusFilter)));
        //   }

        //   // Add the new filter
        //   if (newFilter) {
        //     filters = [...filters, newFilter];
        //   }

        //   return {
        //     backgroundType,
        //     filters,
        //     lastBevelRadiusFilter: newFilter,
        //   };
        // }

        return { backgroundType };
      }),
    setBevelRadius: (bevelRadius: number) => {
      set((state) => {
        const filter =
          state.backgroundType === 'black'
            ? createExpandFilter({ rampWidth: bevelRadius * 10 })
            : createShrinkFilter({ rampWidth: bevelRadius * 10 });
        let filters = state.filters;

        // Remove the last bevel radius filter if it exists
        if (state.lastBevelRadiusFilter) {
          filters = filters.filter(isNot(isShallowEqual(state.lastBevelRadiusFilter)));
        }

        // Add the new filter if it exists and value is not equal to 0
        if (bevelRadius !== 0 && filter) {
          filters = [...filters, filter];
        }

        return {
          bevelRadius,
          filters,
          history: addItemToHistory(state.history, { filter, mode: 'bevelRadius', value: bevelRadius }),
          lastBevelRadiusFilter: filter,
        };
      });
    },
    setHorizontalFlip: (value: boolean) =>
      set((state) => ({
        history: addItemToHistory(state.history, { mode: 'horizontalFlip', value }),
        horizontalFlip: value,
      })),
    toggleInvert: () =>
      set((state) => {
        const { backgroundType, bevelRadius, filters, lastBevelRadiusFilter } = state;
        const isInverted = filters.includes(Konva.Filters.Invert);
        const newBackground = backgroundType === 'black' ? 'white' : 'black';

        let newBevelRadiusFilter: Filter | null = null;
        let newFilters = filters;

        // If there's an active bevel radius, we need to update the filter type
        if (bevelRadius > 0) {
          const filterType = getFilterForBackgroundType(newBackground);

          newBevelRadiusFilter =
            filterType === 'expand'
              ? createExpandFilter({ rampWidth: bevelRadius * 10 })
              : createShrinkFilter({ rampWidth: bevelRadius * 10 });

          // Remove the old bevel radius filter
          if (lastBevelRadiusFilter) {
            newFilters = newFilters.filter(isNot(isShallowEqual(lastBevelRadiusFilter)));
          }

          // Add the new bevel radius filter
          if (newBevelRadiusFilter) {
            newFilters = [...newFilters, newBevelRadiusFilter];
          }
        }

        const operation: InvertOperation = {
          mode: 'invert',
          newBevelRadiusFilter,
          oldBevelRadiusFilter: lastBevelRadiusFilter,
          value: newBackground,
        };

        const newHistory = addItemToHistory(state.history, operation);
        let updatedState: Partial<State> = {
          backgroundType: newBackground,
          filters: newFilters,
          history: newHistory,
          lastBevelRadiusFilter: newBevelRadiusFilter,
        };

        if (isInverted) {
          updatedState.filters = newFilters.filter(isNot(isShallowEqual(Konva.Filters.Invert)));
        } else {
          updatedState.filters = [Konva.Filters.Invert, ...newFilters];
        }

        return updatedState;
      }),
    undo: () =>
      set((state) => {
        const { filters, history } = state;

        if (history.index === 0) return state;

        const lastOperation = history.operations[history.index - 1];
        const newHistory = { ...history, index: history.index - 1 };

        return match(lastOperation)
          .with({ mode: 'addFilter' }, ({ filter }) => ({
            filters: filters.filter(isNot(isShallowEqual(filter))),
            history: newHistory,
          }))
          .with({ mode: 'removeFilter' }, ({ filter, index }) => {
            const newFilters = [...filters];

            newFilters.splice(index, 0, filter);

            return { filters: newFilters, history: newHistory };
          })
          .with({ mode: 'invert' }, ({ newBevelRadiusFilter, oldBevelRadiusFilter, value }) => {
            let newFilters = filters;
            const isCurrentlyInverted = filters.includes(Konva.Filters.Invert);

            // Restore bevel radius filter changes (reverse the operation)
            if (newBevelRadiusFilter) {
              newFilters = newFilters.filter(isNot(isShallowEqual(newBevelRadiusFilter)));
            }

            if (oldBevelRadiusFilter) {
              newFilters = [...newFilters, oldBevelRadiusFilter];
            }

            // Restore invert filter state
            if (isCurrentlyInverted) {
              newFilters = newFilters.filter(isNot(isShallowEqual(Konva.Filters.Invert)));
            } else {
              newFilters = [Konva.Filters.Invert, ...newFilters];
            }

            // Find the previous background type
            let previousBackgroundType: BackgroundType = value === 'black' ? 'white' : 'black';

            return {
              backgroundType: previousBackgroundType,
              filters: newFilters,
              history: newHistory,
              lastBevelRadiusFilter: oldBevelRadiusFilter,
            };
          })
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
      }),
  })),
);
