import { create } from 'zustand';
import { combine } from 'zustand/middleware';

import { getDefaultConfig } from '@core/helpers/layer/layer-config-helper';
import type { ConfigKey, ILayerConfig } from '@core/interfaces/ILayerConfig';

interface State extends ILayerConfig {
  selectedLayer?: string;
}

const getDefaultState = (): State => {
  const defaultConfig = getDefaultConfig();
  const keys = Object.keys(defaultConfig);
  const initState: Partial<State> = {};

  keys.forEach((key: ConfigKey) => {
    initState[key] = { value: defaultConfig[key] } as ILayerConfig[ConfigKey];
  });

  return initState as State;
};

interface ConfigPanelStore extends State {
  change: (payload: { [key in keyof ILayerConfig]?: ILayerConfig[key]['value'] } & { selectedLayer?: string }) => void;
  getState: () => State;
  rename: (name: string) => void;
  reset: () => void;
  update: (payload: Partial<ILayerConfig> & { selectedLayer?: string }) => void;
}

export const useConfigPanelStore = create<ConfigPanelStore>(
  combine(getDefaultState(), (set, get) => ({
    change: (payload: { [key in keyof ILayerConfig]?: ILayerConfig[key]['value'] } & { selectedLayer?: string }) => {
      set((state) => {
        const newState = { ...state };

        Object.keys(payload).forEach((key) => {
          if (key !== 'selectedLayer') {
            newState[key as keyof State] = { value: payload[key as keyof ILayerConfig] };
          } else {
            newState.selectedLayer = payload.selectedLayer;
          }
        });

        return newState;
      });
    },
    getState: () => get(),

    rename: (name: string) => {
      set((state) => ({
        ...state,
        configName: { value: name },
      }));
    },

    reset: () => {
      set(getDefaultState());
    },

    update: (payload: Partial<ILayerConfig> & { selectedLayer?: string }) => {
      set((state) => ({
        ...state,
        ...payload,
      }));
    },
  })),
);
