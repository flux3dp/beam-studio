import { match, P } from 'ts-pattern';
import { create } from 'zustand';
import { combine } from 'zustand/middleware';

import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import { setStorage } from '@core/app/stores/storageStore';
import storage from '@core/implementations/storage';
import type { StorageKey } from '@core/interfaces/IStorage';
import type { GlobalPreference, GlobalPreferenceKey } from '@core/interfaces/Preference';

export type State = {
  beamboxPreferenceChanges: Partial<GlobalPreference>;
  configChanges: Partial<Record<StorageKey, any>>;
};

export type Action = {
  getConfig: (key: StorageKey) => any;
  getPreference: <Key extends GlobalPreferenceKey>(key: Key) => GlobalPreference[Key];
  resetChanges: () => void;
  setConfig: (key: StorageKey, value: any) => void;
  setPreference: <Key extends GlobalPreferenceKey>(key: Key, value: GlobalPreference[Key]) => void;
  updateToStorage: () => void;
};

export const DEFAULT_CONFIG = {
  auto_check_update: true,
  auto_connect: true,
  'default-units': 'mm',
  'enable-sentry': false,
  guessing_poke: true,
  loop_compensation: 0,
  notification: false,
  'poke-ip-addr': '192.168.1.1',
};

export type DefaultConfig = {
  auto_check_update: boolean;
  auto_connect: boolean;
  'default-units': 'inches' | 'mm';
  'enable-sentry': boolean;
  guessing_poke: boolean;
  loop_compensation: number;
  notification: boolean;
  'poke-ip-addr': string;
};

const configMigrateList = [
  'enable-sentry',
  'notification',
  'auto_check_update',
  'guessing_poke',
  'auto_connect',
] as const;

export const useSettingStore = create<Action & State>(
  combine(
    { beamboxPreferenceChanges: {} as State['beamboxPreferenceChanges'], configChanges: {} as State['configChanges'] },
    (set, get) => ({
      getConfig: (key) => {
        const { configChanges } = get();

        if (key in configChanges) return configChanges[key];

        const value = storage.get(key) as any;

        return (
          match<any>({ key, value })
            .with({ key: P.string, value: P.nullish }, ({ key }) => {
              const defaultValue = (DEFAULT_CONFIG as any)[key];

              setStorage(key as StorageKey, defaultValue);

              return defaultValue;
            })
            // migrate old config
            .with(
              { key: P.union(...configMigrateList), value: P.union(P.number, P.nullish) },
              ({ value }) => value === 1,
            )
            .with({ value: P.union('true', 'TRUE') }, () => true)
            .with({ value: P.union('false', 'FALSE') }, () => false)
            .otherwise(({ value }) => value)
        );
      },
      getPreference: (key) => {
        const { beamboxPreferenceChanges } = get();

        return key in beamboxPreferenceChanges
          ? beamboxPreferenceChanges[key]!
          : (useGlobalPreferenceStore.getState() as GlobalPreference)[key];
      },
      resetChanges: () => set({ beamboxPreferenceChanges: {}, configChanges: {} }),
      setConfig: (key, value) => set(() => ({ configChanges: { ...get().configChanges, [key]: value } })),
      setPreference: (key, value) =>
        set(() => ({ beamboxPreferenceChanges: { ...get().beamboxPreferenceChanges, [key]: value } })),
      updateToStorage: () =>
        set(() => {
          const { beamboxPreferenceChanges, configChanges } = get();

          useGlobalPreferenceStore.getState().update(beamboxPreferenceChanges);

          for (const key in configChanges) {
            setStorage(key as StorageKey, configChanges[key as StorageKey]);
          }

          return { beamboxPreferenceChanges, configChanges };
        }),
    }),
  ),
);
