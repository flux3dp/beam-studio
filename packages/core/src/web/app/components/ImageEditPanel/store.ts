import type { Filter } from 'konva/lib/Node';
import { match } from 'ts-pattern';
import { create } from 'zustand';
import { combine } from 'zustand/middleware';

interface LineItem {
  points: number[];
  strokeWidth: number;
}

type MagicWandOperation = {
  filter: Filter;
  mode: 'magicWand';
};

type EraserOperation = {
  line: LineItem;
  mode: 'eraser';
};

type CornerRadiusOperation = {
  mode: 'cornerRadius';
  newValue: number;
  oldValue: number;
};

type HistoryOperation = CornerRadiusOperation | EraserOperation | MagicWandOperation;

interface HistoryState {
  index: number;
  operations: HistoryOperation[];
}

interface State {
  brushSize: number;
  /**
   * cornerRadius for displaying
   */
  cornerRadius: number;
  /**
   * cornerRadius for history operations, would not update until the operation is completed
   * (e.g. release slider)
   */
  currentCornerRadius: number;
  currentLine: LineItem | null;
  filters: Filter[];
  history: HistoryState;
  lines: LineItem[];
  tolerance: number;
}

const getDefaultState = (): State => ({
  brushSize: 20,
  cornerRadius: 0,
  currentCornerRadius: 0,
  currentLine: null,
  filters: [],
  history: { index: 0, operations: [] },
  lines: [],
  tolerance: 40,
});

interface ImageEditPanelStore extends State {
  addFilter: (filter: Filter) => void;
  addLine: (line: LineItem) => void;
  lineFinish: () => void;
  lineMove: (x: number, y: number) => void;
  lineStart: (line: LineItem) => void;
  redo: () => void;
  resetState: () => void;
  setBrushSize: (value: number) => void;
  setCornerRadius: (value: number, addToHistory?: boolean) => void;
  setTolerance: (value: number) => void;
  undo: () => void;
}

const clearUndoneHistory = (history: HistoryState): HistoryState => {
  const { index, operations } = history;

  operations.length = index; // Clear all operations after the current index

  return { index, operations };
};

const addItemToHistory = (history: HistoryState, item: HistoryOperation): HistoryState => {
  const { index, operations } = history;

  operations.length = index;
  operations.push(item);

  return { index: index + 1, operations };
};

export const useImageEditPanelStore = create<ImageEditPanelStore>(
  combine(getDefaultState(), (set) => ({
    addFilter: (filter: Filter) =>
      set((state) => {
        const { filters, history } = state;
        const operation: HistoryOperation = { filter, mode: 'magicWand' };
        const newHistory = addItemToHistory(history, operation);

        return { filters: [...filters, filter], history: newHistory };
      }),
    addLine: (line: LineItem) =>
      set((state) => {
        const { history, lines } = state;
        const operation: HistoryOperation = { line, mode: 'eraser' };
        const newHistory = addItemToHistory(history, operation);

        return { history: newHistory, lines: [...lines, line] };
      }),
    lineFinish: () =>
      set((state) => {
        const { currentLine, history, lines } = state;

        if (!currentLine) return state;

        const operation: HistoryOperation = {
          line: currentLine,
          mode: 'eraser',
        };
        const newHistory = addItemToHistory(history, operation);
        const newLines = [...lines, currentLine];

        return { currentLine: null, history: newHistory, lines: newLines };
      }),
    lineMove: (x: number, y: number) =>
      set((state) => {
        const { currentLine } = state;

        if (!currentLine) return state;

        if (
          currentLine.points[currentLine.points.length - 2] === x &&
          currentLine.points[currentLine.points.length - 1] === y
        ) {
          return state;
        }

        currentLine.points = currentLine.points.concat([x, y]);

        return { currentLine: { ...currentLine } };
      }),
    lineStart: (line: LineItem) =>
      set((state) => {
        const newHistory = clearUndoneHistory(state.history);

        return { currentLine: line, history: newHistory };
      }),
    redo: () =>
      set((state) => {
        const { currentLine, filters, history, lines } = state;

        if (history.index >= history.operations.length || currentLine) return state;

        const nextOperation = history.operations[history.index];
        const newHistory = { ...history, index: history.index + 1 };

        return match(nextOperation)
          .with({ mode: 'magicWand' }, () => {
            filters.push((nextOperation as MagicWandOperation).filter);

            return { filters: [...filters], history: newHistory };
          })
          .with({ mode: 'eraser' }, () => {
            lines.push((nextOperation as EraserOperation).line);

            return { history: newHistory, lines };
          })
          .with({ mode: 'cornerRadius' }, () => {
            const { newValue: newVal } = nextOperation as CornerRadiusOperation;

            return {
              cornerRadius: newVal,
              currentCornerRadius: newVal,
              history: newHistory,
            };
          })
          .otherwise(() => state);
      }),
    resetState: () => set(getDefaultState()),
    setBrushSize: (value: number) => set({ brushSize: value }),
    setCornerRadius: (value: number, addToHistory = true) =>
      set((state) => {
        const { currentCornerRadius, history } = state;

        if (!addToHistory) return { cornerRadius: value };

        if (currentCornerRadius === value) return state;

        const operation: HistoryOperation = {
          mode: 'cornerRadius',
          newValue: value,
          oldValue: currentCornerRadius,
        };
        const newHistory = addItemToHistory(history, operation);

        return { cornerRadius: value, currentCornerRadius: value, history: newHistory };
      }),
    setTolerance: (value: number) => set({ tolerance: value }),
    undo: () =>
      set((state) => {
        const { currentLine, filters, history, lines } = state;

        if (history.index === 0 || currentLine) return state;

        const lastOperation = history.operations[history.index - 1];
        const newHistory = { ...history, index: history.index - 1 };

        return match(lastOperation)
          .with({ mode: 'magicWand' }, () => {
            filters.pop();

            return { filters: [...filters], history: newHistory };
          })
          .with({ mode: 'eraser' }, () => {
            lines.pop();

            return { history: newHistory, lines };
          })
          .with({ mode: 'cornerRadius' }, () => {
            const { oldValue } = lastOperation as CornerRadiusOperation;

            return {
              cornerRadius: oldValue,
              currentCornerRadius: oldValue,
              history: newHistory,
            };
          })
          .otherwise(() => state);
      }),
  })),
);
