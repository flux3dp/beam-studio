import type { StorageKey, StorageStoreState } from '@core/interfaces/IStorage';

const state: StorageStoreState = {
  'active-lang': 'en',
  'ador-backup-path': '~/Downloads',
  'alert-config': {
    isIgnored: [],
    showed: {},
    skip: false,
    times: 0,
  },
  'announcement-record': {
    isIgnored: [],
    showed: {},
    skip: false,
    times: 0,
  },
  'auto-save-config': {
    directory: 'directory',
    enabled: true,
    fileNumber: 5,
    timeInterval: 10,
  },
  auto_check_update: false,
  auto_connect: false,
  'beambox-preference': {} as any,
  'black-list': '',
  /** @deprecated Customized laser configurations for version <= 2.3.9 */
  customizedLaserConfigs: null,
  'default-font': {
    family: 'defaultFontFamily',
    postscriptName: 'defaultFontPostscriptName',
    style: 'defaultFontStyle',
  },
  'default-units': 'mm',
  /** @deprecated Customized laser configurations for version <= 2.3.9 */
  defaultLaserConfigsInUse: null,
  'device-store': {},
  /** 1 for done */
  'did-gesture-tutorial': 1,
  'elements-history': [],
  'enable-sentry': null,
  'flux-rsa-key': 'fluxRsaKey',
  'font-history': [],
  /** font name to display name */
  'font-name-map': {},
  guessing_poke: false,
  isInch: false,
  'keep-flux-id-login': false,
  'last-installed-version': '0.0.0',
  'last-promark-serial': 'lastPromarkSerial',
  'last-record-activity': 'lastRecordActivity',
  'layer-color-config': { array: [], dict: {} },
  'layer-panel-height': 100,
  loop_compensation: 0,
  'new-user': false,
  notification: false,
  'poke-ip-addr': '127.0.0.1',
  /** For version > 2.3.9, replace 'customizedLaserConfigs' & 'defaultLaserConfigsInUse' */
  presets: [],
  'printer-is-ready': false,
  'promark-store': {},
  'questionnaire-version': 0,
  'rating-record': {
    isIgnored: false,
    isVoted: false,
    score: 0,
    times: 0,
    user: undefined,
    version: '0.0.0',
  },
  recent_files: [],
  /** array of registered machine serial */
  'registered-devices': [],
  'selected-device': undefined,
  /** map with key: device uuid value: firmware version */
  'sentry-send-devices': {},
};

const set = <K extends StorageKey>(key: K, value: StorageStoreState[K]) => {
  state[key] = value;

  if (key === 'default-units') state.isInch = value === 'inches';
};

const update = (payload: Partial<StorageStoreState>) => {
  Object.assign(state, payload);
};

export const useStorageStore = (selector?: (state: StorageStoreState) => Partial<StorageStoreState>) => {
  const allStates = { ...state, set, update };

  return selector ? selector(allStates) : allStates;
};

export const getStorage = <K extends StorageKey>(key: K) => state[key];
export const setStorage = set;

useStorageStore.getState = () => ({ ...state, set, update });
useStorageStore.subscribe = (_listener: (state: Storage) => void) => {
  // Implementation of subscription logic
  // Return unsubscribe function
  return () => {};
};
