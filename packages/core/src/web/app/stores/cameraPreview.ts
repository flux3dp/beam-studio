import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';

import { PreviewMode } from '@core/app/constants/cameraConstants';

type CameraPreviewState = {
  isClean: boolean;
  isDrawing: boolean;
  isLiveMode: boolean;
  isPreviewMode: boolean;
  isStarting: boolean;
  pendingPreviewMode?: PreviewMode;
  previewMode: PreviewMode;
  supportedPreviewModes: PreviewMode[];
};

export const useCameraPreviewStore = create(
  subscribeWithSelector<CameraPreviewState>(() => ({
    isClean: true,
    isDrawing: false,
    isLiveMode: false,
    isPreviewMode: false,
    isStarting: false,
    previewMode: PreviewMode.REGION,
    supportedPreviewModes: [PreviewMode.REGION],
  })),
);

useCameraPreviewStore.subscribe(
  (state) => state.supportedPreviewModes,
  () => {
    const { pendingPreviewMode, previewMode, supportedPreviewModes } = useCameraPreviewStore.getState();

    if (pendingPreviewMode && !supportedPreviewModes.includes(pendingPreviewMode)) {
      useCameraPreviewStore.setState({ pendingPreviewMode: undefined });
    } else if (pendingPreviewMode == null && !supportedPreviewModes.includes(previewMode)) {
      useCameraPreviewStore.setState({ previewMode: supportedPreviewModes[0] });
    }
  },
  { equalityFn: shallow },
);

/**
 * for updating the camera preview state outside React components
 * @param state Partial<CameraPreviewState>
 * @returns void
 */
export const setCameraPreviewState = (state: Partial<CameraPreviewState>) => {
  useCameraPreviewStore.setState(state);
};
