import type { ColorConfig } from '@core/app/constants/color-constants';
import type { History } from '@core/app/contexts/ElementPanelContext';
import type { IRecord as AnnouncementRecord } from '@core/helpers/announcement-helper';
import type { DeviceStore } from '@core/helpers/device/deviceStore';
import type { MachineMaintenanceRecord } from '@core/helpers/maintenance/records';
import type { IRecord as RatingRecord } from '@core/helpers/rating-helper';

import type { AutoSaveConfig } from './AutoSaveConfig';
import type { IDefaultFont } from './IFont';
import type { Preset } from './ILayerConfig';
import type { BeamboxPreference } from './Preference';
import type { PromarkStore } from './Promark';

export interface Storage {
  'active-lang': string;
  'ador-backup-path': string;
  'alert-config': any;
  'announcement-record': AnnouncementRecord;
  'auto-save-config'?: AutoSaveConfig;
  auto_check_update: boolean;
  auto_connect: boolean;
  'beambox-preference': BeamboxPreference;
  'black-list': string;
  /** Array of hex color strings in uppercase */
  custom_colors?: string[];
  /** @deprecated Customized laser configurations for version <= 2.3.9 */
  customizedLaserConfigs: any;
  'default-font': IDefaultFont;
  'default-units': 'inches' | 'mm';
  /** @deprecated Customized laser configurations for version <= 2.3.9 */
  defaultLaserConfigsInUse: any;
  'device-store': Record<string, DeviceStore>;
  /** 1 for done */
  'did-gesture-tutorial': number;
  /** JSON string for dockview-react layout */
  dockviewLayout: string;
  'elements-history': History[];
  'enable-sentry': boolean | null;
  'flux-rsa-key': string;
  'font-history': string[];
  /** font name to display name */
  'font-name-map': Record<string, string>;
  guessing_poke: boolean;
  'keep-flux-id-login': boolean;
  'last-installed-version': string;
  'last-promark-serial': string;
  'last-record-activity': string;
  'layer-color-config': { array: ColorConfig[]; dict: Record<string, number> };
  'layer-panel-height': number;
  loop_compensation: number;
  /** Per-machine maintenance records, keyed by serial (fallback UUID). */
  'maintenance-records': Record<string, MachineMaintenanceRecord>;
  'new-user': boolean;
  notification: boolean;
  'poke-ip-addr': string;
  /** For version > 2.3.9, replace 'customizedLaserConfigs' & 'defaultLaserConfigsInUse' */
  presets: Preset[];
  'printer-is-ready': boolean;
  'promark-store': Record<string, PromarkStore>;
  'questionnaire-version': number;
  'rating-record': RatingRecord;
  recent_files: string[];
  /** array of registered machine serial */
  'registered-devices': string[];
  'selected-device'?: string;
  /** map with key: device uuid value: firmware version */
  'sentry-send-devices'?: Record<string, string>;
  /** machine serial list that should not ask for linking */
  skip_machine_linking?: string[];
  /** Record if a Yongli device default delay table has been written */
  'yongli-written-serials': string[];
}

export type StorageKey = keyof Storage;

export interface StorageManager {
  clearAll(): StorageManager;
  clearAllExceptIP(): StorageManager;
  get<K extends StorageKey>(name: K, useCache?: boolean): Storage[K];
  getStore(): Storage;
  isExisting(key: StorageKey, useCache?: boolean): boolean;
  removeAt(name: StorageKey): StorageManager;
  set<K extends StorageKey>(name: K, val: Storage[K], shouldNotifyOthers?: boolean): StorageManager;
}

export interface DerivedStates {
  isInch: boolean;
}

export type StorageStoreState = DerivedStates & Storage;
