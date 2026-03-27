import { create } from 'zustand';

import type { ModelAnnotation } from '@core/app/constants/workarea-constants';

type State = {
  modelAnnotation: ModelAnnotation;
};

type Action = {
  set: <K extends keyof State>(key: K, value: State[K]) => void;
};

export const useInitializeMachineStore = create<Action & State>((set) => ({
  modelAnnotation: {},
  set: (key, value) => set({ [key]: value }),
}));
