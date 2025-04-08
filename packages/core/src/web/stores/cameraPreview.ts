import { create } from 'zustand';

type CameraPreviewState = {
  isClean: boolean;
  isDrawing: boolean;
  isLiveMode: boolean;
  isPreviewMode: boolean;
  setIsClean: (isClean: boolean) => void;
  setIsDrawing: (isDrawing: boolean) => void;
  setIsLiveMode: (isLiveMode: boolean) => void;
  setIsPreviewMode: (isPreviewMode: boolean) => void;
};

export const useCameraPreviewStore = create<CameraPreviewState>((set) => ({
  isClean: true,
  isDrawing: false,
  isLiveMode: false,
  isPreviewMode: false,
  setIsClean: (isClean: boolean) => set({ isClean }),
  setIsDrawing: (isDrawing: boolean) => set({ isDrawing }),
  setIsLiveMode: (isLiveMode: boolean) => set({ isLiveMode }),
  setIsPreviewMode: (isPreviewMode: boolean) => set({ isPreviewMode }),
}));
