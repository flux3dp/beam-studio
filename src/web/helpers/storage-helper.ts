const Store = requireNode('electron-store');
const store = new Store();

function get(name: string): any {
  let item: any = store.get(name || '');

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
}

function set(name: string, val: any) {
  store.set(name || '', val);
  return this;
}

function removeAt(name: string) {
  store.delete(name);
  return this;
}

function clearAll() {
  store.clear();
  return this;
}

function clearAllExceptIP() {
  const ip = this.get('poke-ip-addr');
  this.clearAll();
  this.set('poke-ip-addr', ip);

  return this;
}

function isExisting(key: string): boolean {
  return store.has(key);
}

export default {
  get,
  set,
  removeAt,
  clearAll,
  clearAllExceptIP,
  isExisting,
};
