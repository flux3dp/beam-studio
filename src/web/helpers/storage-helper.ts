const Store = requireNode('electron-store');
let store = new Store();
function get(name: string): any {
    name = name || '';

    let item: any = store.get(name),
        temp_item: any;

    item = (null === item ? '' : item);

    try {
        temp_item = JSON.parse(item);

        if ('object' === typeof temp_item) {
            item = temp_item;
        }
    }
    catch (ex) {
        // TODO: do something
    }

    return item;
};

function set(name: string, val: any) {
    name = name || '';

    store.set(name, val);

    return this;
};

function removeAt(name: string) {
    store.delete(name);
    return this;
};

function clearAll() {
    store.clear();

    return this;
}

function clearAllExceptIP() {
    let ip = this.get('poke-ip-addr');
    this.clearAll();
    this.set('poke-ip-addr', ip);

    return this;
};

function isExisting(key: string): boolean {
    return store.has(key);
};

export default {
    get,
    set,
    removeAt,
    clearAll,
    clearAllExceptIP,
    isExisting
};
