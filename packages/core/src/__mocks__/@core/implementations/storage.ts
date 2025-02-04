import type { IStorage, StorageKey } from '@core/interfaces/IStorage';

let storage: any = {};

const instance: IStorage = {
  clearAll: () => {
    storage = {};

    return instance;
  },
  clearAllExceptIP: () => {
    const ip = storage['poke-ip-addr'];

    storage = { 'poke-ip-addr': ip };

    return instance;
  },
  get: (key: StorageKey) => storage[key],
  getStore: () => storage,
  isExisting: (key: StorageKey) => key in storage,
  removeAt: (key: StorageKey) => {
    delete storage[key];

    return instance;
  },
  set: (key: StorageKey, value: any) => {
    storage[key] = value;

    return instance;
  },
};

export default instance;
