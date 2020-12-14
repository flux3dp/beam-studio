export interface IStorage {
    get(name: string): any,
    set(name: string, val: any): IStorage,
    removeAt(name: string): IStorage,
    clearAll(): IStorage,
    clearAllExceptIP(): IStorage,
    isExisting(key: string): boolean,
}
