import Konva from 'konva';
import type { Filter } from 'konva/lib/Node';
import { isNot, isShallowEqual } from 'remeda';
import { create } from 'zustand';
import { combine } from 'zustand/middleware';

import type { InvertOperation } from './types';
import { createExpandFilter } from './utils/createExpandFilter';
import { createShrinkFilter } from './utils/createShrinkFilter';
import type { BackgroundType } from './utils/detectBackgroundType';
import { addItemToHistory } from './utils/historyUtils';
import { addFilter as _addFilter, removeFilter as _removeFilter, type State } from './utils/operationHandlers';
import { handleRedo, handleUndo } from './utils/undoRedoHandlers';

const getDefaultState = (): State => ({
  backgroundType: 'white',
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

export const useStampMakerPanelStore = create<ImageEditPanelStore>(
  combine(getDefaultState(), (set) => ({
    addFilter: (filter: Filter, isFront?: boolean) => set((state) => _addFilter(state, filter, { isFront })),
    redo: () => set((state) => handleRedo(state)),
    removeFilter: (filter: Filter) => set((state) => _removeFilter(state, filter)),
    resetState: () => set(getDefaultState()),
    setBackgroundType: (backgroundType: BackgroundType) =>
      set(() => {
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
          newBevelRadiusFilter =
            newBackground === 'black'
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

    undo: () => set((state) => handleUndo(state)),
  })),
);
