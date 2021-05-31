import Store from 'electron-store';
import { IStorage } from 'interfaces/IStorage';

class ElectronStorage implements IStorage {
  private store: Store;

  constructor() {
    this.store = new Store();
  }

  get = (name: string): any => {
    let item: any = this.store.get(name || '');

    item = (item === null ? '' : item);

    try {
      const tempItem = JSON.parse(item);
      if (typeof tempItem === 'object') {
        item = tempItem;
      }
    } catch (ex) {
      // TODO: do something
    }

    return item;
  };

  set = (name: string, val: any): IStorage => {
    this.store.set(name || '', val);
    return this;
  };

  removeAt = (name: string): IStorage => {
    this.store.delete(name);
    return this;
  };

  clearAll = (): IStorage => {
    this.store.clear();
    return this;
  };

  clearAllExceptIP = (): IStorage => {
    const ip = this.get('poke-ip-addr');
    this.clearAll();
    this.set('poke-ip-addr', ip);
    return this;
  };

  isExisting = (key: string): boolean => this.store.has(key);

  getStore = () => this.store.store;
}

const storage = new ElectronStorage();

export default storage;
