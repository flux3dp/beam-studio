import { create } from 'zustand';
import { combine, subscribeWithSelector } from 'zustand/middleware';

import { TabEvents } from '@core/app/constants/ipcEvents';
import communicator from '@core/implementations/communicator';
import storage from '@core/implementations/storage';
import type { Storage, StorageKey, StorageStoreState } from '@core/interfaces/IStorage';

const initStore = (): StorageStoreState => {
  const store = storage.getStore();

  return {
    ...store,
    'font-history': store['font-history'] || [],
    isInch: store['default-units'] === 'inches',
  };
};

export type StorageStore = StorageStoreState & {
  reload: () => void;
  set: <K extends keyof Storage>(key: K, value: Storage[K], shouldNotifyChanges?: boolean) => void;
};

export const useStorageStore = create(
  subscribeWithSelector<StorageStore>(
    combine(initStore(), (set) => ({
      reload: () => set(initStore()),
      set: (key, value, shouldNotifyChanges = true) => {
        storage.set(key, value, shouldNotifyChanges);

        const newState: Partial<StorageStoreState> = { [key]: value };

        if (key === 'default-units') newState.isInch = value === 'inches';

        set((state) => ({ ...state, ...newState }));
      },
    })),
  ),
);

// Syntactic sugar
export const getStorage = <K extends keyof StorageStoreState>(key: K) => useStorageStore.getState()[key];
export const setStorage = (key: StorageKey, value: StorageStoreState[StorageKey], shouldNotifyChanges = true) =>
  useStorageStore.getState().set(key, value, shouldNotifyChanges);
export const removeFromStorage = (key: StorageKey, shouldNotifyChanges = true) =>
  useStorageStore.getState().set(key, undefined, shouldNotifyChanges);

communicator.on(TabEvents.StorageValueChanged, <K extends StorageKey>(_: unknown, key: K, value: StorageStore[K]) => {
  const newState: Partial<StorageStoreState> = { [key]: value };

  if (key === 'default-units') newState.isInch = value === 'inches';

  // use setState to avoid writing to storage multiple times
  useStorageStore.setState({ ...newState });
});
