import Konva from 'konva';
import { isNot, isShallowEqual } from 'remeda';
import { create } from 'zustand';
import { combine } from 'zustand/middleware';

import type { InvertOperation, State } from './types';
import { addItemToHistory } from './utils/addItemToHistory';
import { createExpandFilter } from './utils/createExpandFilter';
import { createShrinkFilter } from './utils/createShrinkFilter';
import { handleRedo, handleUndo } from './utils/undoRedoHandlers';

const getDefaultState = (): State => ({
  bevelRadius: 0,
  filters: [],
  history: { index: 0, operations: [] },
  horizontalFlip: false,
  lastBevelRadiusFilter: null,
});

interface StampMakerPanelStore extends State {
  isInverted: () => boolean;
  redo: () => void;
  resetState: () => void;
  setBevelRadius: (value: number) => void;
  setHorizontalFlip: (value: boolean) => void;
  toggleInvert: () => void;
  undo: () => void;
}

export const useStampMakerPanelStore = create<StampMakerPanelStore>(
  combine(getDefaultState(), (set, get) => ({
    isInverted: () => get().filters.includes(Konva.Filters.Invert),
    redo: () => set((state) => handleRedo(state)),
    resetState: () => set(getDefaultState()),
    setBevelRadius: (bevelRadius: number) => {
      set((state) => {
        const filter =
          bevelRadius > 0
            ? createShrinkFilter({ rampWidth: bevelRadius * 10 })
            : createExpandFilter({ rampWidth: -bevelRadius * 10 });
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
          lastBevelRadiusFilter: bevelRadius === 0 ? null : filter,
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
        const { filters } = state;
        const isInverted = filters.includes(Konva.Filters.Invert);
        const operation: InvertOperation = { mode: 'invert' };
        const updatedState: Partial<State> = {
          filters: isInverted
            ? filters.filter(isNot(isShallowEqual(Konva.Filters.Invert)))
            : [Konva.Filters.Invert, ...filters],
          history: addItemToHistory(state.history, operation),
        };

        return updatedState;
      }),

    undo: () => set((state) => handleUndo(state)),
  })),
);
