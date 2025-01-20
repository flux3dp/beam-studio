import type { IStorage, StorageKey } from '@core/interfaces/IStorage';

class LocalStorage implements IStorage {
  getStore() {
    throw new Error('Method not implemented.');
  }
  get(name: StorageKey): any {
    let item = window.localStorage.getItem(name || '');

    item = item || '';

    if (!item) {
      return '';
    }

    try {
      const parsedItem = JSON.parse(item);

      return parsedItem;
    } catch {
      console.warn(`Unable to parse ${item} of key: ${name}`);
    }

    return item;
  }

  set(name: StorageKey, val: any): IStorage {
    window.localStorage.setItem(name, JSON.stringify(val));

    return this;
  }

  removeAt(name: StorageKey): IStorage {
    window.localStorage.removeItem(name);

    return this;
  }

  clearAll(): IStorage {
    window.localStorage.clear();

    return this;
  }

  clearAllExceptIP(): IStorage {
    const ip = this.get('poke-ip-addr');

    this.clearAll();
    this.set('poke-ip-addr', ip);

    return this;
  }

  isExisting(key: StorageKey): boolean {
    return window.localStorage.getItem(key) !== null;
  }
}

const storage = new LocalStorage();

export default storage;
