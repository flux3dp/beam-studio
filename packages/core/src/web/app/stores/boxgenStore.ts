import { create } from 'zustand';
import { combine } from 'zustand/middleware';

import { DEFAULT_CONTROLLER_INCH, DEFAULT_CONTROLLER_MM } from '@core/app/constants/boxgen-constants';
import type { IController } from '@core/interfaces/IBoxgen';

import { useStorageStore } from './storageStore';

function getInitialBoxData(): IController {
  const { isInch } = useStorageStore.getState();

  return isInch ? DEFAULT_CONTROLLER_INCH : DEFAULT_CONTROLLER_MM;
}

export const useBoxgenStore = create(
  combine({ boxData: getInitialBoxData() }, (set) => ({
    reset: () => set({ boxData: getInitialBoxData() }),
    setBoxData: (data: ((prev: IController) => IController) | IController) =>
      set((state) => ({
        boxData: typeof data === 'function' ? data(state.boxData) : data,
      })),
    updateBoxData: (partial: Partial<IController>) => set((state) => ({ boxData: { ...state.boxData, ...partial } })),
  })),
);
