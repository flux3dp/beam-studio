import type { Dispatch } from 'react';
import { createContext } from 'react';

import { getDefaultConfig } from '@core/helpers/layer/layer-config-helper';
import type { ConfigKey, ILayerConfig } from '@core/interfaces/ILayerConfig';

interface State extends ILayerConfig {
  selectedLayer?: string;
}

export const getDefaultState = (): State => {
  const defaultConfig = getDefaultConfig();
  const keys = Object.keys(defaultConfig);
  const initState = {};

  keys.forEach((key: ConfigKey) => {
    initState[key] = { value: defaultConfig[key] } as ILayerConfig[ConfigKey];
  });

  return initState as State;
};

export type Action =
  | {
      payload: string;
      type: 'rename';
    }
  | {
      payload: {
        [key in ConfigKey]?: ILayerConfig[key];
      } & {
        selectedLayer?: string;
      };
      type: 'update';
    }
  | {
      payload: {
        [key in keyof ILayerConfig]?: ILayerConfig[key]['value'];
      } & {
        selectedLayer?: string;
      };
      type: 'change';
    };

export const reducer = (state: State, action: Action): State => {
  if (action.type === 'update') {
    return { ...state, ...action.payload };
  }

  if (action.type === 'change') {
    const { payload } = action;
    const newState = { ...state };

    Object.keys(payload).forEach((key) => {
      if (key !== 'selectedLayer') {
        newState[key] = { value: payload[key] };
      } else {
        newState[key] = payload[key];
      }
    });

    return newState;
  }

  if (action.type === 'rename') {
    const { payload } = action;
    const newState = { ...state };

    newState.configName = { value: payload };

    return newState;
  }

  return state;
};

interface Context {
  dispatch: Dispatch<Action>;
  initState: (layers?: string[]) => void;
  selectedLayers: string[];
  simpleMode?: boolean;
  state: State;
}

export default createContext<Context>({} as Context);
