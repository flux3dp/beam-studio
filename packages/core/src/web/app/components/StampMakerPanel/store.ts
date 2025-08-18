import { match } from 'ts-pattern';
import { create } from 'zustand';
import { combine } from 'zustand/middleware';

interface LineItem {
  points: number[];
  strokeWidth: number;
}

type EraserOperation = {
  line: LineItem;
  mode: 'eraser';
};

type HistoryOperation = EraserOperation;

interface HistoryState {
  index: number;
  operations: HistoryOperation[];
}

interface State {
  history: HistoryState;
}

const getDefaultState = (): State => ({
  history: { index: 0, operations: [] },
});

interface ImageEditPanelStore extends State {
  redo: () => void;
  resetState: () => void;
  undo: () => void;
}

export const clearUndoneHistory = (history: HistoryState): HistoryState => {
  const { index, operations } = history;

  operations.length = index; // Clear all operations after the current index

  return { index, operations };
};

export const addItemToHistory = (history: HistoryState, item: HistoryOperation): HistoryState => {
  const { index, operations } = history;

  operations.length = index;
  operations.push(item);

  return { index: index + 1, operations };
};

export const useImageEditPanelStore = create<ImageEditPanelStore>(
  combine(getDefaultState(), (set) => ({
    redo: () =>
      set((state) => {
        const { history } = state;

        if (history.index >= history.operations.length) return state;

        const nextOperation = history.operations[history.index];
        const newHistory = { ...history, index: history.index + 1 };

        return match(nextOperation)
          .with({ mode: 'eraser' }, () => {
            return { history: newHistory };
          })
          .otherwise(() => state);
      }),
    resetState: () => set(getDefaultState()),
    undo: () =>
      set((state) => {
        const { history } = state;

        if (history.index === 0) return state;

        const lastOperation = history.operations[history.index - 1];
        const newHistory = { ...history, index: history.index - 1 };

        return match(lastOperation)
          .with({ mode: 'eraser' }, () => {
            return { history: newHistory };
          })
          .otherwise(() => state);
      }),
  })),
);
