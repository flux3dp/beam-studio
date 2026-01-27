import { create } from 'zustand';
import { combine, subscribeWithSelector } from 'zustand/middleware';

import { getDefaultConfig } from '@core/helpers/layer/layer-config-helper';
import type { ConfigKey, ILayerConfig } from '@core/interfaces/ILayerConfig';

const getDefaultState = (): ILayerConfig => {
  const defaultConfig = getDefaultConfig();
  const keys = Object.keys(defaultConfig);
  const initState: Partial<ILayerConfig> = {};

  keys.forEach((key) => {
    initState[key as ConfigKey] = { value: defaultConfig[key as ConfigKey] } as any;
  });

  return initState as ILayerConfig;
};

interface ConfigPanelStore extends ILayerConfig {
  change: (payload: { [key in keyof ILayerConfig]?: ILayerConfig[key]['value'] }) => void;
  getState: () => ILayerConfig;
  rename: (name: string) => void;
  reset: () => void;
  update: (payload: Partial<ILayerConfig>) => void;
}

export const useConfigPanelStore = create(
  subscribeWithSelector<ConfigPanelStore>(
    combine(getDefaultState(), (set, get) => ({
      change: (payload: { [key in keyof ILayerConfig]?: ILayerConfig[key]['value'] }) => {
        set((state) => {
          const newState = { ...state };

          Object.keys(payload).forEach((key) => {
            newState[key as keyof ILayerConfig] = { value: payload[key as keyof ILayerConfig] } as any;
          });

          return newState;
        });
      },

      getState: () => {
        const {
          change: _change,
          getState: _getState,
          rename: _rename,
          reset: _reset,
          update: _update,
          ...states
        } = get() as ConfigPanelStore;

        return states;
      },

      rename: (name: string) => {
        set((state) => ({ ...state, configName: { value: name } }));
      },

      reset: () => {
        set(getDefaultState());
      },

      update: (payload: Partial<ILayerConfig>) => {
        set((state) => ({ ...state, ...payload }));
      },
    })),
  ),
);
