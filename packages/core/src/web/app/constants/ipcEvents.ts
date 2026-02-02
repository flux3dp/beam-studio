/**
 * IPC Events Constants
 *
 * All IPC event names for communication between main process and renderer.
 * Uses `as const` pattern with kebab-case values for type safety.
 *
 * Usage:
 *   import { IpcEvents } from '@core/app/constants/ipcEvents';
 *   communicator.send(IpcEvents.FrontendReady);
 *   ipcMain.on(IpcEvents.FrontendReady, handler);
 */

// Tab-related events (for multi-tab synchronization)
export const TabEvents = {
  AddNewTab: 'add-new-tab',
  CloseTab: 'close-tab',
  FocusTab: 'focus-tab',
  GetAllTabs: 'get-all-tabs',
  GetTabId: 'get-tab-id',
  GlobalPreferenceChanged: 'global-preference-changed',
  ImportFileInTab: 'import-file-in-tab',
  MoveTab: 'move-tab',
  PokeIP: 'poke-ip',
  ReloadSettings: 'reload-settings',
  SetTabIsPreviewMode: 'set-tab-is-preview-mode',
  SetTabMode: 'set-tab-mode',
  SetTabTitle: 'set-tab-title',
  StorageValueChanged: 'storage-value-changed',
  TabBlurred: 'tab-blurred',
  TabFocused: 'tab-focused',
  TabUpdated: 'tab-updated',
  UpdateDevices: 'tab-update-devices',
  UpdateRecentFiles: 'update-recent-files',
  UpdateUser: 'update-user',
} as const;

// Backend status events
export const BackendEvents = {
  BackendDown: 'backend-down',
  BackendUp: 'backend-up',
  CheckBackendStatus: 'check-backend-status',
  CheckSwiftray: 'check-swiftray',
  NotifyBackendStatus: 'notify-backend-status',
} as const;

// Update manager events
export const UpdateEvents = {
  CheckForUpdate: 'check-for-update',
  DownloadProgress: 'download-progress',
  DownloadUpdate: 'download-update',
  QuitAndInstall: 'quit-and-install',
  UpdateAvailable: 'update-available',
  UpdateDownloaded: 'update-downloaded',
} as const;

// Network events
export const NetworkEvents = {
  CheckIpExist: 'check-ip-exist',
  CheckIpExistResult: 'check-ip-exist-result',
  TestNetwork: 'test-network',
  TestNetworkProgress: 'test-network-progress',
  TestNetworkResult: 'test-network-result',
} as const;

// Font events
export const FontEvents = {
  FindFont: 'find-font',
  FindFonts: 'find-fonts',
  GetAvailableFonts: 'get-available-fonts',
  SubstituteFont: 'substitute-font',
} as const;

// Menu events
export const MenuEvents = {
  MenuClick: 'menu-click',
  NewAppMenu: 'new-app-menu',
  OpenRecentFiles: 'open-recent-files',
  PopupMenu: 'popup-menu-item',
  SetAsDefault: 'set-as-default',
  UpdateCustomTitlebar: 'update-custom-titlebar',
  UpdateMenu: 'update-menu',
  UpdateRecentFilesMenu: 'update-recent-files-menu',
} as const;

// SVG processing events
export const SvgEvents = {
  SvgUrlToImgUrl: 'svg-url-to-img-url',
  SvgUrlToImgUrlDone: 'svg-url-to-img-url-done',
} as const;

// Auth events
export const AuthEvents = {
  FbAuthToken: 'fb-auth-token',
  GoogleAuth: 'google-auth',
  UpdateAccount: 'update-account',
} as const;

// Misc events
export const MiscEvents = {
  AskForPermission: 'ask-for-permission',
  CloseReply: 'close-reply',
  DebugInspect: 'debug-inspect',
  DeviceStatus: 'device-status',
  DeviceUpdated: 'device-updated',
  FrontendReady: 'frontend-ready',
  NotifyLanguage: 'notify-language',
  NotifyMachineStatus: 'notify-machine-status',
  OpenFile: 'open-file',
  SaveDialogPopped: 'save-dialog-popped',
  SetDevMode: 'set-dev-mode',
  SetEditingStandardInput: 'set-editing-standard-input',
  WindowClose: 'window-close',
  WindowFocus: 'window-focus',
  WindowFullscreen: 'window-fullscreen',
  WindowMaximize: 'window-maximize',
} as const;

// Combined IpcEvents for convenience
export const IpcEvents = {
  ...TabEvents,
  ...BackendEvents,
  ...UpdateEvents,
  ...NetworkEvents,
  ...FontEvents,
  ...MenuEvents,
  ...SvgEvents,
  ...AuthEvents,
  ...MiscEvents,
} as const;

// Type exports for type-safe event handling
export type TabEventType = (typeof TabEvents)[keyof typeof TabEvents];
export type BackendEventType = (typeof BackendEvents)[keyof typeof BackendEvents];
export type UpdateEventType = (typeof UpdateEvents)[keyof typeof UpdateEvents];
export type NetworkEventType = (typeof NetworkEvents)[keyof typeof NetworkEvents];
export type FontEventType = (typeof FontEvents)[keyof typeof FontEvents];
export type MenuEventType = (typeof MenuEvents)[keyof typeof MenuEvents];
export type SvgEventType = (typeof SvgEvents)[keyof typeof SvgEvents];
export type AuthEventType = (typeof AuthEvents)[keyof typeof AuthEvents];
export type MiscEventType = (typeof MiscEvents)[keyof typeof MiscEvents];
export type IpcEventType = (typeof IpcEvents)[keyof typeof IpcEvents];

// Tab constants (non-event configuration)
export const TabConstants = {
  // zero or undefined means no limit
  maxTab: 7,
} as const;
