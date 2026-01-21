import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { PreviewMode } from '@core/app/constants/cameraConstants';

type CameraPreviewState = {
  isClean: boolean;
  isDrawing: boolean;
  isLiveMode: boolean;
  isPreviewMode: boolean;
  isStarting: boolean;
  isSwitchable?: boolean;
  previewMode: PreviewMode;
};

export const useCameraPreviewStore = create(
  subscribeWithSelector<CameraPreviewState>(() => ({
    isClean: true,
    isDrawing: false,
    isLiveMode: false,
    isPreviewMode: false,
    isStarting: false,
    isSwitchable: false,
    previewMode: PreviewMode.REGION,
  })),
);

/**
 * for updating the camera preview state outside React components
 * @param state Partial<CameraPreviewState>
 * @returns void
 */
export const setCameraPreviewState = (state: Partial<CameraPreviewState>) => {
  useCameraPreviewStore.setState(state);
};
