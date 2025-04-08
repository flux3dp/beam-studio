import { create } from 'zustand';

type CameraPreviewState = {
  hasWideAngleCamera?: boolean;
  isClean: boolean;
  isDrawing: boolean;
  isLiveMode: boolean;
  isPreviewMode: boolean;
  isWideAngleCameraCalibrated?: boolean;
};

export const useCameraPreviewStore = create<CameraPreviewState>(() => ({
  hasWideAngleCamera: false,
  isClean: true,
  isDrawing: false,
  isLiveMode: false,
  isPreviewMode: false,
  isWideAngleCameraCalibrated: false,
}));

/**
 * for updating the camera preview state outside React components
 * @param state Partial<CameraPreviewState>
 * @returns void
 */
export const setCameraPreviewState = (state: Partial<CameraPreviewState>) => {
  useCameraPreviewStore.setState(state);
};
