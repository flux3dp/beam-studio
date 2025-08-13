import { getStorageKeys } from '@core/app/constants/storageConstants';
import type { Storage, StorageKey, StorageManager } from '@core/interfaces/IStorage';

class LocalStorage implements StorageManager {
  getStore(): Storage {
    const storage = {} as Storage;
    const keys = getStorageKeys();

    keys.forEach(<K extends StorageKey>(key: K) => {
      storage[key] = this.get(key);
    });

    return storage;
  }
  get<K extends StorageKey>(name: K): Storage[K] {
    let item = window.localStorage.getItem(name || null);

    item = item || null;

    if (!item) {
      return null as Storage[K];
    }

    try {
      const parsedItem = JSON.parse(item);

      return parsedItem as Storage[K];
    } catch {
      console.warn(`Unable to parse ${item} of key: ${name}`);
    }

    return item as Storage[K];
  }

  set(name: StorageKey, val: any): StorageManager {
    window.localStorage.setItem(name, JSON.stringify(val));

    return this;
  }

  removeAt(name: StorageKey): StorageManager {
    window.localStorage.removeItem(name);

    return this;
  }

  clearAll(): StorageManager {
    window.localStorage.clear();

    return this;
  }

  clearAllExceptIP(): StorageManager {
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
