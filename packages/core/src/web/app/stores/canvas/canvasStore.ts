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

interface CanvasStore {
  mode: CanvasMode;
  mouseMode: CanvasMouseMode;
  setMode: (mode: CanvasMode) => void;
  togglePathPreview: () => void;
}

export const useCanvasStore = create(
  subscribeWithSelector<CanvasStore>((set) => ({
    mode: CanvasMode.Draw,
    mouseMode: 'select',
    setMode: (mode: CanvasMode) => set({ mode }),
    togglePathPreview: () =>
      set((state) => ({
        mode: state.mode === CanvasMode.PathPreview ? CanvasMode.Draw : CanvasMode.PathPreview,
      })),
  })),
);
