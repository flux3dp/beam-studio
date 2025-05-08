import { create } from 'zustand';

import { CameraType } from '@core/app/constants/cameraConstants';

type CameraPreviewState = {
  cameraType: CameraType;
  hasWideAngleCamera?: boolean;
  isClean: boolean;
  isDrawing: boolean;
  isLiveMode: boolean;
  isPreviewMode: boolean;
  isWideAngleCameraCalibrated?: boolean;
};

export const useCameraPreviewStore = create<CameraPreviewState>(() => ({
  cameraType: CameraType.LASER_HEAD,
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
