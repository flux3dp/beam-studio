import { create } from 'zustand';

import currentFileManager from '@core/app/svgedit/currentFileManager';

export type VariableTextState = {
  advanceBy: number;
  autoAdvance: boolean;
  csvContent: string[][];
  current: number;
  end: number;
  start: number;
};

export const useVariableTextState = create<VariableTextState>(() => ({
  advanceBy: 1,
  autoAdvance: true,
  csvContent: [],
  current: 0,
  end: 999,
  start: 0,
}));

export const setVariableTextState = (state: Partial<VariableTextState>) => {
  useVariableTextState.setState(state);
  currentFileManager.setHasUnsavedChanges(true);
};
