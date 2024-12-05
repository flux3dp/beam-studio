// eslint-disable-next-line import/no-extraneous-dependencies
import { WebContentsView } from 'electron';

import TabManager from 'node/tab-manager';

let currentTabManager: TabManager | null = null;

const setTabManager = (tabManager: TabManager): void => {
  currentTabManager = tabManager;
};

export const getFocusedView = (): WebContentsView | null =>currentTabManager?.getFocusedView() ?? null;

export default {
  setTabManager,
  getFocusedView,
};
