import Store from 'electron-store';

import { TabEvents } from '@core/app/constants/tabConstants';
import type { Storage, StorageManager } from '@core/interfaces/IStorage';

import communicator from './communicator';

class ElectronStorage implements StorageManager {
  private store: Store;

  private storeCache: any;

  constructor() {
    this.store = new Store();
    this.storeCache = this.store.store;
  }

  get = (name: string, useCache = false): any => {
    const store = useCache ? this.storeCache : this.store.store;
    let item: any = name ? store[name] : store;

    item = item === null ? '' : item;

    try {
      const tempItem = JSON.parse(item);

      if (typeof tempItem === 'object') {
        item = tempItem;
      }
    } catch (error) {
      // Non-JSON string values are expected for some settings, only log unexpected parsing errors
      if (typeof item === 'string' && item.startsWith('{')) {
        console.error(`Failed to parse JSON value for key '${name}':`, error);
      }
    }

    return item;
  };

  set = (name: string, val: any, shouldNotifyChanges = true): StorageManager => {
    this.store.set(name || '', val);
    this.storeCache[name] = val;

    if (shouldNotifyChanges) communicator.send(TabEvents.StorageValueChanged, name, val);

    return this;
  };

  removeAt = (name: string, shouldNotifyChanges = true): StorageManager => {
    this.store.delete(name);
    delete this.storeCache[name];

    if (shouldNotifyChanges) communicator.send(TabEvents.StorageValueChanged, name, undefined);

    return this;
  };

  clearAll = (): StorageManager => {
    this.store.clear();
    this.storeCache = {};

    return this;
  };

  clearAllExceptIP = (): StorageManager => {
    const ip = this.get('poke-ip-addr', false);

    this.clearAll();
    this.set('poke-ip-addr', ip);

    return this;
  };

  isExisting = (key: string, useCache = false): boolean => {
    if (useCache) {
      return this.storeCache[key] !== undefined;
    }

    return this.store.get(key) !== undefined;
  };

  getStore = () => this.store.store as unknown as Storage;
}

const storage = new ElectronStorage();

export default storage;
