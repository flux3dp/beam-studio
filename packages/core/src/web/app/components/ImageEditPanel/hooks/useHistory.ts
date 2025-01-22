import { useCallback, useReducer } from 'react';

import type { Filter } from 'konva/lib/Node';

interface LineItem {
  points: number[];
  strokeWidth: number;
}

interface HistoryItem {
  filters: Filter[];
  lines: LineItem[];
}

export interface HistoryState {
  hasUndid?: boolean;
  index: number;
  items: HistoryItem[];
}

interface HistoryAction {
  payload?: HistoryItem;
  type: 'PUSH' | 'REDO' | 'UNDO';
}

interface HistoryContext {
  history: HistoryState;
  push: (item: HistoryItem) => void;
  redo: () => HistoryItem;
  undo: () => HistoryItem;
}

const historyReducer = (state: HistoryState, { payload, type }: HistoryAction) => {
  const { index, items } = state;

  switch (type) {
    case 'PUSH':
      return { index: index + 1, items: items.slice(0, index + 1).concat(payload) };
    case 'UNDO':
      return index > 0 ? { index: index - 1, items } : state;
    case 'REDO':
      return index < items.length - 1 ? { index: index + 1, items } : state;
    default:
      return state;
  }
};

// History management
export const useHistory = (initialState: HistoryState): HistoryContext => {
  const [history, dispatch] = useReducer(historyReducer, initialState);

  const push = useCallback((payload: HistoryItem) => dispatch({ payload, type: 'PUSH' }), []);
  const undo = useCallback(() => {
    // return the initial state if there is no history to undo
    if (history.index === 0) {
      return history.items[history.index];
    }

    const lastItem = history.items[history.index - 1];

    dispatch({ type: 'UNDO' });

    return lastItem;
  }, [history]);
  const redo = useCallback(() => {
    // return the last state if there is no history to redo
    if (history.index === history.items.length - 1) {
      return history.items[history.index];
    }

    const nextItem = history.items[history.index + 1];

    dispatch({ type: 'REDO' });

    return nextItem;
  }, [history]);

  return { history, push, redo, undo };
};
