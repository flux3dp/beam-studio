/* eslint-disable no-unused-vars */
export enum TabEvents {
  AddNewTab = 'add-new-tab',
  CloseTab = 'close-tab',
  FocusTab = 'focus-tab',
  GetAllTabs = 'get-all-tabs',
  GetTabId = 'get-tab-id',
  MoveTab = 'move-tab',
  SetTabMode = 'set-tab-mode',
  SetTabTitle = 'set-tab-title',
  TabBlurred = 'tab-blurred',
  TabFocused = 'tab-focused',
  TabUpdated = 'tab-updated',
}

export default {
  // zero or undefined means no limit
  maxTab: 6,
};
