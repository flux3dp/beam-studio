import { create } from 'zustand';

import currentFileManager from '@core/app/svgedit/currentFileManager';

import type { BBox, SheetSetupState } from './store';

/**
 * Configs to make print-and-cut repeatable:
 * Which can help user skip the PDF-generation steps and go straight to
 * camera alignment for the next printed sheet. It is saved on Finish, written
 * into the .beam file's miscData, restored on load, and cleared on a new file.
 */
export interface ResumeConfig extends SheetSetupState {
  /**
   * The full box the printed sheets were made with (the contour's extent),
   * in canvas units (px); a resumed run lays out from it without recomputing.
   * Non-null, unlike the dialog state's: Finish only saves once a layout exists.
   */
  fullBBox: BBox;
}

export const useResumeConfigStore = create<{ config: null | ResumeConfig }>(() => ({ config: null }));

export const setResumeConfig = (config: ResumeConfig): void => {
  useResumeConfigStore.setState({ config });
  currentFileManager.setHasUnsavedChanges(true);
};

export const clearResumeConfig = (): void => useResumeConfigStore.setState({ config: null });
