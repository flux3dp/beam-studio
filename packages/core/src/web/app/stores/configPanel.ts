import { create } from 'zustand';
import { combine, subscribeWithSelector } from 'zustand/middleware';

import { getDefaultConfig } from '@core/helpers/layer/layer-config-helper';
import type { ConfigKey, ILayerConfig } from '@core/interfaces/ILayerConfig';

interface State extends ILayerConfig {
  selectedLayer?: string;
}

const getDefaultState = (): State => {
  const defaultConfig = getDefaultConfig();
  const keys = Object.keys(defaultConfig);
  const initState: Partial<State> = {};

  keys.forEach((key) => {
    initState[key as ConfigKey] = { value: defaultConfig[key as ConfigKey] } as any;
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

export const useConfigPanelStore = create(
  subscribeWithSelector<ConfigPanelStore>(
    combine(getDefaultState(), (set, get) => ({
      change: (payload: { [key in keyof ILayerConfig]?: ILayerConfig[key]['value'] } & { selectedLayer?: string }) => {
        set((state) => {
          const newState = { ...state };

          Object.keys(payload).forEach((key) => {
            if (key !== 'selectedLayer') {
              newState[key as keyof State] = { value: payload[key as keyof ILayerConfig] } as any;
            } else {
              newState.selectedLayer = payload.selectedLayer;
            }
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

      update: (payload: Partial<ILayerConfig> & { selectedLayer?: string }) => {
        set((state) => ({ ...state, ...payload }));
      },
    })),
  ),
);
