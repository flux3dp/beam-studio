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
  | 'default-units'
  | 'defaultLaserConfigsInUse' // For version <= 2.3.9, maybe we can remove this in the future
  | 'did-gesture-tutorial'
  | 'elements-history'
  | 'enable-sentry'
  | 'flux-rsa-key'
  | 'font-history'
  | 'font-name-map'
  | 'guessing_poke'
  | 'keep-flux-id-login'
  | 'last-installed-version'
  | 'last-promark-serial'
  | 'last-record-activity'
  | 'layer-color-config'
  | 'layer-panel-height'
  | 'loop_compensation'
  | 'new-user'
  | 'notification'
  | 'poke-ip-addr'
  | 'presets' // For version > 2.3.9, replace 'customizedLaserConfigs' & 'defaultLaserConfigsInUse'
  | 'printer-is-ready'
  | 'promark-store'
  | 'questionnaire-version'
  | 'rating-record'
  | 'recent_files'
  | 'registered-devices'
  | 'selected-device'
  | 'sentry-send-devices';

export interface IStorage {
  clearAll(): IStorage;
  clearAllExceptIP(): IStorage;
  get(name: StorageKey, useCache?: boolean): any;
  getStore(): any;
  isExisting(key: StorageKey, useCache?: boolean): boolean;
  removeAt(name: StorageKey): IStorage;
  set(name: StorageKey, val: any): IStorage;
}
