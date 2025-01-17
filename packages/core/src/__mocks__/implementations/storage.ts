import { IStorage, StorageKey } from 'interfaces/IStorage';

let storage: any = {};

const instance: IStorage = {
  get: (key: StorageKey) => storage[key],
  set: (key: StorageKey, value) => {
    storage[key] = value;
    return instance;
  },
  removeAt: (key: StorageKey) => {
    delete storage[key];
    return instance;
  },
  clearAll: () => {
    storage = {};
    return instance;
  },
  clearAllExceptIP: () => {
    const ip = storage['poke-ip-addr'];
    storage = { 'poke-ip-addr': ip };
    return instance;
  },
  isExisting: (key: StorageKey) => key in storage,
  getStore: () => storage,
};

export default instance;

