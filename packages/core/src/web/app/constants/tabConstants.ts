export enum TabEvents {
  AddNewTab = 'add-new-tab',
  CloseTab = 'close-tab',
  FocusTab = 'focus-tab',
  GetAllTabs = 'get-all-tabs',
  GetTabId = 'get-tab-id',
  GlobalPreferenceChanged = 'global-preference-changed',
  ImportFileInTab = 'import-file-in-tab',
  MoveTab = 'move-tab',
  PokeIP = 'poke-ip',
  ReloadSettings = 'reload-settings',
  SetTabIsPreviewMode = 'set-tab-is-preview-mode',
  SetTabMode = 'set-tab-mode',
  SetTabTitle = 'set-tab-title',
  StorageValueChanged = 'storage-value-changed',
  TabBlurred = 'tab-blurred',
  TabFocused = 'tab-focused',
  TabUpdated = 'tab-updated',
  UpdateDevices = 'tab-update-devices',
  UpdateRecentFiles = 'update-recent-files',
  UpdateUser = 'update-user',
}

export default {
  // zero or undefined means no limit
  maxTab: 7,
};
