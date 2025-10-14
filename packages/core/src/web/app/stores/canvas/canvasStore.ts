import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { CanvasMode } from '@core/app/constants/canvasMode';

interface CanvasStore {
  mode: CanvasMode;
  setMode: (mode: CanvasMode) => void;
}

export const useCanvasStore = create(
  subscribeWithSelector<CanvasStore>((set) => ({
    mode: CanvasMode.Draw,
    setMode: (mode: CanvasMode) => set({ mode }),
  })),
);
