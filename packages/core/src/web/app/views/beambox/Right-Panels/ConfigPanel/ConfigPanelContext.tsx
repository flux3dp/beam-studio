import { createContext, Dispatch } from 'react';

import { getDefaultConfig } from 'helpers/layer/layer-config-helper';
import { ConfigKey, ILayerConfig } from 'interfaces/ILayerConfig';

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

export type Action = {
  type: 'update';
  payload: {
    selectedLayer?: string;
  } & {
    [key in ConfigKey]?: ILayerConfig[key];
  };
} | {
  type: 'change';
  payload: {
    selectedLayer?: string;
  } & {
    [key in keyof ILayerConfig]?: ILayerConfig[key]['value'];
  };
} | {
  type: 'rename';
  payload: string;
};

export const reducer = (state: State, action: Action): State => {
  if (action.type === 'update') return { ...state, ...action.payload };
  if (action.type === 'change') {
    const { payload } = action;
    const newState = { ...state };
    Object.keys(payload).forEach((key) => {
      if (key !== 'selectedLayer') newState[key] = { value: payload[key] };
      else newState[key] = payload[key];
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
  state: State;
  selectedLayers: string[];
  dispatch: Dispatch<Action>;
  simpleMode?: boolean;
  initState: (layers?: string[]) => void;
}

export default createContext<Context>({} as Context);
