import TopBarController from '@core/app/views/beambox/TopBar/contexts/TopBarController';
import storage from '@core/implementations/storage';

export const fhx2rfWatts = [30, 60, 80] as const;
export type Hexa2RfWatt = (typeof fhx2rfWatts)[number];

/**
 * Currently only used by hexa rf
 * Add other device models if needed in the future
 * e.g. | { model: 'new-model'; ... }
 */
export interface DeviceStore {
  model: 'fhx2rf';
  watt: Hexa2RfWatt;
}

export const get = (uuid: string): DeviceStore | undefined => {
  const store: Record<string, DeviceStore> = storage.get('device-store') || {};

  return store[uuid];
};

export const set = (uuid: string, data: Partial<DeviceStore>): void => {
  const store: Record<string, DeviceStore> = storage.get('device-store') || {};
  const currentData = store[uuid] || {};

  store[uuid] = { ...currentData, ...data };
  storage.set('device-store', store);
};

export const addDevice = (uuid: string, model: DeviceStore['model']): void => {
  const store: Record<string, DeviceStore> = storage.get('device-store') || {};

  if (store[uuid]) return;

  set(uuid, { model });
};

/**
 * Syntactic sugar for getting hexa rf watt
 */
export const getHexa2RfWatt = (uuid: string): Hexa2RfWatt => {
  const deviceStore = get(uuid);

  if (deviceStore?.model === 'fhx2rf') {
    return deviceStore.watt;
  }

  return 30; // default watt
};

export const setHexa2RfWatt = (uuid: string | undefined, watt: Hexa2RfWatt): void => {
  if (!uuid) {
    const { model, uuid: selectedDeviceUuid } = TopBarController.getSelectedDevice() ?? {};

    if (model !== 'fhx2rf' || !selectedDeviceUuid) return;

    uuid = selectedDeviceUuid;
  }

  addDevice(uuid, 'fhx2rf');
  set(uuid, { watt });
};
