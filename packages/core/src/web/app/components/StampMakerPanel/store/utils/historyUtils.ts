import type { HistoryOperation, HistoryState } from '../types';

export const addItemToHistory = ({ index, operations }: HistoryState, item: HistoryOperation): HistoryState => {
  operations.length = index;
  operations.push(item);

  return { index: index + 1, operations };
};

export const getDefaultHistoryState = (): HistoryState => ({
  index: 0,
  operations: [],
});
