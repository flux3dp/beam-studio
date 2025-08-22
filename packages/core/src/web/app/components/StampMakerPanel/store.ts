import type { Filter } from 'konva/lib/Node';
import { isNot, isShallowEqual } from 'remeda';
import { match } from 'ts-pattern';
import { create } from 'zustand';
import { combine } from 'zustand/middleware';

type HorizontalFlipOperation = {
  mode: 'horizontalFlip';
  value: boolean;
};

type FilterOperation = {
  filter: Filter;
  mode: 'filter';
};

type BevelRadiusOperation = {
  filter: Filter | null;
  mode: 'bevelRadius';
  value: number;
};

type HistoryOperation = BevelRadiusOperation | FilterOperation | HorizontalFlipOperation;

interface HistoryState {
  index: number;
  operations: HistoryOperation[];
}

interface State {
  bevelRadius: number;
  filters: Filter[];
  history: HistoryState;
  horizontalFlip: boolean;
  lastBevelRadiusFilter: Filter | null;
}

const getDefaultState = (): State => ({
  bevelRadius: 0,
  filters: [],
  history: { index: 0, operations: [] },
  horizontalFlip: false,
  lastBevelRadiusFilter: null,
});

interface ImageEditPanelStore extends State {
  addFilter: (filter: Filter) => void;
  redo: () => void;
  removeFilter: (filter: Filter) => void;
  resetState: () => void;
  setBevelRadius: (value: number, filter: Filter) => void;
  setHorizontalFlip: (value: boolean) => void;
  undo: () => void;
}

const addItemToHistory = ({ index, operations }: HistoryState, item: HistoryOperation): HistoryState => {
  operations.length = index;
  operations.push(item);

  return { index: index + 1, operations };
};

const _addFilter = ({ filters, history }: State, filter: Filter): { filters: Filter[]; history: HistoryState } => {
  const operation: HistoryOperation = { filter, mode: 'filter' };
  const newHistory = addItemToHistory(history, operation);

  console.log('before addFilter', { filters, history });
  console.log('after addFilter', { filters: [...filters, filter], history: newHistory });

  return { filters: [...filters, filter], history: newHistory };
};

const _removeFilter = (state: State, filter: Filter): { filters: Filter[]; history: HistoryState } => {
  const { filters, history } = state;

  if (!filters.includes(filter)) return state;

  const operation: HistoryOperation = { filter, mode: 'filter' };
  const newHistory = addItemToHistory(history, operation);

  console.log('before removeFilter', { filters, history });
  console.log('after removeFilter', {
    filters: filters.filter(isNot(isShallowEqual(filter))),
    history: newHistory,
  });

  return { filters: filters.filter(isNot(isShallowEqual(filter))), history: newHistory };
};

export const useStampMakerPanelStore = create<ImageEditPanelStore>(
  combine(getDefaultState(), (set) => ({
    addFilter: (filter: Filter) => set((state) => _addFilter(state, filter)),
    redo: () =>
      set((state) => {
        const { filters, history } = state;

        if (history.index >= history.operations.length) return state;

        const nextOperation = history.operations[history.index];
        const newHistory = { ...history, index: history.index + 1 };

        return match(nextOperation)
          .with({ mode: 'filter' }, ({ filter }) => {
            filters.push(filter);

            return { filters: [...filters], history: newHistory };
          })
          .with({ mode: 'horizontalFlip' }, ({ value }) => ({ history: newHistory, horizontalFlip: value }))
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
    setBevelRadius: (value: number, filter: Filter) => {
      set((state) => {
        let newFilters = state.filters;

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
          history: addItemToHistory(state.history, { filter, mode: 'bevelRadius', value }),
          lastBevelRadiusFilter: filter,
        };
      });
    },
    setHorizontalFlip: (value: boolean) =>
      set((state) => ({
        history: addItemToHistory(state.history, { mode: 'horizontalFlip', value }),
        horizontalFlip: value,
      })),
    undo: () =>
      set((state) => {
        const { filters, history } = state;

        if (history.index === 0) return state;

        const lastOperation = history.operations[history.index - 1];
        const newHistory = { ...history, index: history.index - 1 };

        return match(lastOperation)
          .with({ mode: 'filter' }, () => {
            filters.pop();

            return { filters: [...filters], history: newHistory };
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
