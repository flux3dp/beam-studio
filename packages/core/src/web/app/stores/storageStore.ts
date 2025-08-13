import { create } from 'zustand';
import { combine, subscribeWithSelector } from 'zustand/middleware';

import communicator from '@core/implementations/communicator';
import storage from '@core/implementations/storage';
import type { Storage, StorageKey } from '@core/interfaces/IStorage';

import { TabEvents } from '../constants/tabConstants';

const initStore = (): Storage => {
  return storage.getStore();
};

export type StorageStore = Storage & {
  reload: () => void;
  set: <K extends keyof Storage>(key: K, value: Storage[K], shouldNotifyChanges?: boolean) => void;
};

export const useStorageStore = create(
  subscribeWithSelector<StorageStore>(
    combine(initStore(), (set) => ({
      reload: () => set(initStore()),
      set: (key, value, shouldNotifyChanges = true) => {
        storage.set(key, value, shouldNotifyChanges);
        set((state) => ({ ...state, [key]: value }));
      },
    })),
  ),
);

// syntax sugar
export const getStorage = <K extends StorageKey>(key: K) => useStorageStore.getState()[key];
export const setStorage = (key: StorageKey, value: StorageStore[StorageKey], shouldNotifyChanges = true) => {
  useStorageStore.getState().set(key, value, shouldNotifyChanges);
};

communicator.on(TabEvents.StorageValueChanged, <K extends StorageKey>(_: unknown, key: K, value: StorageStore[K]) => {
  // use setState to avoid writing to storage multiple times
  useStorageStore.setState({ [key]: value });
});
