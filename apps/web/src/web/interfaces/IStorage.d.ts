export type StorageKey =
  | 'font-name-map'
  | 'default-units'
  | 'default-font'
  | 'beambox-preference'
  | 'default-printer'
  | 'printer-is-ready'
  | 'laser-defaults'
  | 'recent_files'
  | 'notification'
  | 'auto_check_update'
  | 'guessing_poke'
  | 'alert-config'
  | 'poke-ip-addr'
  | 'notification'
  | 'guessing_poke'
  | 'auto_connect'
  | 'enable-sentry'
  | 'loop_compensation'
  | 'firmware-update-ignore-list'
  | 'new-user'
  | 'last-installed-version'
  | 'questionnaire-version'
  | 'layer-color-config'
  | 'rating-record'
  | 'setting-printer'
  | 'printers'
  | 'setting-wifi'
  | 'customizedLaserConfigs' // For version <= 2.3.9, maybe we can remove this in the future
  | 'defaultLaserConfigsInUse' // For version <= 2.3.9, maybe we can remove this in the future
  | 'presets'
  | 'keep-flux-id-login'
  | 'noun-project-history'
  | 'auto-save-config'
  | 'active-lang'
  | 'flux-rsa-key'
  | 'sentry-send-devices'
  | 'black-list'
  | 'host'
  | 'did-gesture-tutorial'
  | 'last-record-activity'
  | 'selected-device'
  | 'announcement-record'
  | 'ador-backup-path'
  | 'layer-panel-height'
  | 'promark-store'
  | 'last-promark-serial';

export interface IStorage {
  get(name: StorageKey): any;
  set(name: StorageKey, val: any): IStorage;
  removeAt(name: StorageKey): IStorage;
  clearAll(): IStorage;
  clearAllExceptIP(): IStorage;
  isExisting(key: StorageKey): boolean;
  getStore(): any;
}
