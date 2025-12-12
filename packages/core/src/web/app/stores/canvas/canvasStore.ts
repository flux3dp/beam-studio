import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { CanvasMode } from '@core/app/constants/canvasMode';

export type CanvasMouseOperationMode =
  | 'auto-focus'
  | 'curve-engraving'
  | 'ellipse'
  | 'line'
  | 'path'
  | 'pathedit' // intermediate ?
  | 'polygon'
  | 'pre_preview'
  | 'preview'
  | 'preview_color'
  | 'rect'
  | 'select'
  | 'text'
  | 'textedit'; // intermediate ?

/**
 * Modes that represent ongoing operations, usually intermediate states
 * Usually set mode on mouse down, and revert to previous mode on mouse up
 */
export type CanvasMouseIntermediateMode =
  | 'drag-prespray-area'
  | 'drag-rotary-axis'
  | 'multiselect'
  | 'resize'
  | 'rotate';
export type CanvasMouseMode = CanvasMouseIntermediateMode | CanvasMouseOperationMode;

export type CanvasDrawerMode = 'ai-chat' | 'ai-generate' | 'none';

interface CanvasStore {
  drawerMode: CanvasDrawerMode;
  mode: CanvasMode;
  mouseMode: CanvasMouseMode;
  setDrawerMode: (mode: CanvasDrawerMode) => void;
  setMode: (mode: CanvasMode) => void;
  toggleDrawerMode: (mode: CanvasDrawerMode) => void;
  togglePathPreview: () => void;
}

export const useCanvasStore = create(
  subscribeWithSelector<CanvasStore>((set) => ({
    drawerMode: 'none',
    mode: CanvasMode.Draw,
    mouseMode: 'select',
    setDrawerMode: (mode: CanvasDrawerMode) => set({ drawerMode: mode }),
    setMode: (mode: CanvasMode) => set({ mode }),
    toggleDrawerMode: (mode: CanvasDrawerMode) =>
      set((state) => ({ drawerMode: state.drawerMode === mode ? 'none' : mode })),
    togglePathPreview: () =>
      set((state) => ({ mode: state.mode === CanvasMode.PathPreview ? CanvasMode.Draw : CanvasMode.PathPreview })),
  })),
);
