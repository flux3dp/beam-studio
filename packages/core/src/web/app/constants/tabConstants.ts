export enum TabEvents {
  AddNewTab = 'add-new-tab',
  CloseTab = 'close-tab',
  FocusTab = 'focus-tab',
  GetAllTabs = 'get-all-tabs',
  GetTabId = 'get-tab-id',
  ImportFileInTab = 'import-file-in-tab',
  MoveTab = 'move-tab',
  SetTabMode = 'set-tab-mode',
  SetTabTitle = 'set-tab-title',
  TabBlurred = 'tab-blurred',
  TabFocused = 'tab-focused',
  TabUpdated = 'tab-updated',
  UpdateRecentFiles = 'update-recent-files',
  UpdateUser = 'update-user',
}

export default {
  // zero or undefined means no limit
  maxTab: 7,
};
