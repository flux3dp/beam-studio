export type StorageKey =
  | 'active-lang'
  | 'ador-backup-path'
  | 'alert-config'
  | 'announcement-record'
  | 'auto-save-config'
  | 'auto_check_update'
  | 'auto_connect'
  | 'beambox-preference'
  | 'black-list'
  | 'customizedLaserConfigs' // For version <= 2.3.9, maybe we can remove this in the future
  | 'default-font'
  | 'default-printer'
  | 'default-units'
  | 'defaultLaserConfigsInUse' // For version <= 2.3.9, maybe we can remove this in the future
  | 'did-gesture-tutorial'
  | 'elements-history'
  | 'enable-sentry'
  | 'firmware-update-ignore-list'
  | 'flux-rsa-key'
  | 'font-name-map'
  | 'guessing_poke'
  | 'guessing_poke'
  | 'host'
  | 'keep-flux-id-login'
  | 'laser-defaults'
  | 'last-installed-version'
  | 'last-promark-serial'
  | 'last-record-activity'
  | 'layer-color-config'
  | 'layer-panel-height'
  | 'loop_compensation'
  | 'new-user'
  | 'notification'
  | 'notification'
  | 'poke-ip-addr'
  | 'presets'
  | 'printer-is-ready'
  | 'printers'
  | 'promark-store'
  | 'questionnaire-version'
  | 'rating-record'
  | 'recent_files'
  | 'selected-device'
  | 'sentry-send-devices'
  | 'setting-printer'
  | 'setting-wifi';

export interface IStorage {
  clearAll(): IStorage;
  clearAllExceptIP(): IStorage;
  get(name: StorageKey): any;
  getStore(): any;
  isExisting(key: StorageKey): boolean;
  removeAt(name: StorageKey): IStorage;
  set(name: StorageKey, val: any): IStorage;
}
