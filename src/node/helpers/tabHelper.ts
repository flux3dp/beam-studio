/**
 * @file tabHelper.ts
 * @description Helper functions for tab management, extracted from tab-manager.ts to avoid circular dependency
 */
// eslint-disable-next-line import/no-extraneous-dependencies
import { WebContentsView } from 'electron';

import TabManager from 'node/tab-manager';

let currentTabManager: TabManager | null = null;

export const getTabManager = (): TabManager | null => currentTabManager;

export const setTabManager = (tabManager: TabManager): void => {
  currentTabManager = tabManager;
};

export const getFocusedView = (): WebContentsView | null =>
  currentTabManager?.getFocusedView() ?? null;

export default {
  setTabManager,
  getTabManager,
  getFocusedView,
};
