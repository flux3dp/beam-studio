const mockSetHasUnsavedChanges = jest.fn();

jest.mock('@core/app/svgedit/currentFileManager', () => ({
  __esModule: true,
  default: {
    setHasUnsavedChanges: (...args: any[]) => mockSetHasUnsavedChanges(...args),
  },
}));

import { setVariableTextState, useVariableTextState } from './variableText';

describe('variableText store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have the default state on init', () => {
    expect(useVariableTextState.getState()).toEqual({
      advanceBy: 1,
      autoAdvance: true,
      csvContent: [],
      csvFileName: '',
      current: 0,
      end: 999,
      start: 0,
    });
  });

  it('should merge partial state and mark unsaved changes', () => {
    setVariableTextState({ current: 5, start: 2 });

    expect(useVariableTextState.getState().current).toBe(5);
    expect(useVariableTextState.getState().start).toBe(2);
    expect(useVariableTextState.getState().end).toBe(999);
    expect(mockSetHasUnsavedChanges).toHaveBeenCalledTimes(1);
    expect(mockSetHasUnsavedChanges).toHaveBeenCalledWith(true);
  });

  it('should replace csvContent wholesale when a new CSV is loaded', () => {
    setVariableTextState({
      csvContent: [
        ['old-a', 'old-b'],
        ['old-c', 'old-d'],
      ],
      csvFileName: 'old.csv',
    });

    setVariableTextState({ autoAdvance: false, csvContent: [['a', 'b']], csvFileName: 'data.csv' });

    // no rows from the previous file may survive a re-import (replacement, not concat/deep-merge)
    expect(useVariableTextState.getState().csvContent).toEqual([['a', 'b']]);
    expect(useVariableTextState.getState().csvFileName).toBe('data.csv');
    expect(useVariableTextState.getState().autoAdvance).toBe(false);
  });

  it('should mark unsaved changes on every call', () => {
    setVariableTextState({ advanceBy: 2 });
    setVariableTextState({ end: 10 });
    expect(mockSetHasUnsavedChanges).toHaveBeenCalledTimes(2);
  });
});
