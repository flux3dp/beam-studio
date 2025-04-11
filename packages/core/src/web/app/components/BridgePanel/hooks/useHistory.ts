import { useCallback, useReducer } from 'react';

import { match } from 'ts-pattern';

interface HistoryItem {
  pathData: string[];
}

export interface HistoryState {
  hasUndid?: boolean;
  index: number;
  items: HistoryItem[];
}

interface HistoryAction {
  payload?: HistoryItem;
  type: 'PUSH' | 'REDO' | 'SET' | 'UNDO';
}

interface HistoryContext {
  history: HistoryState;
  push: (item: HistoryItem) => void;
  redo: () => HistoryItem;
  set: (item: HistoryItem) => void;
  undo: () => HistoryItem;
}

const historyReducer = (state: HistoryState, { payload, type }: HistoryAction) => {
  const { index, items } = state;

  return match(type)
    .with('PUSH', () => ({ index: index + 1, items: items.slice(0, index + 1).concat(payload!) }))
    .with('SET', () => ({ hasUndid: false, index: 0, items: [payload!] }))
    .with('UNDO', () => ({ index: index - Number(index > 0), items }))
    .with('REDO', () => ({ index: index + Number(index < items.length - 1), items }))
    .otherwise(() => state);
};

// History management
export const useHistory = (initialState: HistoryState): HistoryContext => {
  const [history, dispatch] = useReducer(historyReducer, initialState);
  const push = useCallback((payload: HistoryItem) => dispatch({ payload, type: 'PUSH' }), []);
  const set = useCallback((payload: HistoryItem) => dispatch({ payload, type: 'SET' }), [dispatch]);
  const undo = useCallback(() => {
    // return the initial state if there is no history to undo
    if (history.index === 0) return history.items[history.index];

    const lastItem = history.items[history.index - 1];

    dispatch({ type: 'UNDO' });

    return lastItem;
  }, [history]);
  const redo = useCallback(() => {
    // return the last state if there is no history to redo
    if (history.index === history.items.length - 1) return history.items[history.index];

    const nextItem = history.items[history.index + 1];

    dispatch({ type: 'REDO' });

    return nextItem;
  }, [history]);

  return { history, push, redo, set, undo };
};
