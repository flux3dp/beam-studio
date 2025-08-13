import Store from 'electron-store';

import type { IStorage, Storage } from '@core/interfaces/IStorage';

class ElectronStorage implements IStorage {
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
    } catch {
      // console.error(error);
    }

    return item;
  };

  set = (name: string, val: any): IStorage => {
    this.store.set(name || '', val);
    this.storeCache[name] = val;

    return this;
  };

  removeAt = (name: string): IStorage => {
    this.store.delete(name);
    delete this.storeCache[name];

    return this;
  };

  clearAll = (): IStorage => {
    this.store.clear();
    this.storeCache = {};

    return this;
  };

  clearAllExceptIP = (): IStorage => {
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
