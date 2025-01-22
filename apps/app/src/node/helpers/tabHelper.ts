/**
 * @file tabHelper.ts
 * @description Helper functions for tab management, extracted from tab-manager.ts to avoid circular dependency
 */

import type { WebContentsView } from 'electron';

import type TabManager from '../tabManager';

let currentTabManager: null | TabManager = null;

export const getTabManager = (): null | TabManager => currentTabManager;

export const setTabManager = (tabManager: TabManager): void => {
  currentTabManager = tabManager;
};

export const getFocusedView = (): null | WebContentsView => currentTabManager?.getFocusedView() ?? null;

export default {
  getFocusedView,
  getTabManager,
  setTabManager,
};
