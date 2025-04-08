import { useCallback, useReducer } from 'react';

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

  switch (type) {
    case 'PUSH':
      return { index: index + 1, items: items.slice(0, index + 1).concat(payload!) };
    case 'UNDO':
      return index > 0 ? { index: index - 1, items } : state;
    case 'REDO':
      return index < items.length - 1 ? { index: index + 1, items } : state;
    case 'SET':
      return { hasUndid: false, index: 0, items: [payload!] };
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
  const set = useCallback(
    (payload: HistoryItem) => {
      dispatch({ payload, type: 'SET' });
    },
    [dispatch],
  );

  return { history, push, redo, set, undo };
};
