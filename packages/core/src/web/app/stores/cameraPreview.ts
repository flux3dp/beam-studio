import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';

import initState from '@core/app/components/beambox/RightPanel/ConfigPanel/initState';
import { PreviewMode } from '@core/app/constants/cameraConstants';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import type { BatchCommand } from '@core/app/svgedit/history/history';
import history from '@core/app/svgedit/history/history';
import { handleHistoryActionOptions } from '@core/app/svgedit/history/utils/handleHistoryActionOptions';
import { revertBackupOpacity, setTemporaryOpacity, updateLayerOpacity } from '@core/helpers/layer/opacity';
import { getLayersByModule } from '@core/helpers/layer-module/layer-module-helper';

type CameraPreviewState = {
  bgOpacity: number;
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
    bgOpacity: 1,
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

useCameraPreviewStore.subscribe(
  (state) => state.isClean,
  (isClean) => {
    const guideLayers = getLayersByModule([LayerModule.GUIDE]);
    let parentCmd: BatchCommand;

    if (guideLayers.length === 0) return;

    if (isClean) {
      parentCmd = new history.BatchCommand('Revert Guide Layer after preview');
      guideLayers.forEach((layer) => {
        revertBackupOpacity(layer, { parentCmd });
        updateLayerOpacity(layer, { parentCmd });
      });
    } else {
      parentCmd = new history.BatchCommand('Set Guide Layer before preview');
      guideLayers.forEach((layer) => {
        setTemporaryOpacity(layer, '0', { parentCmd });
        updateLayerOpacity(layer, { parentCmd });
      });
    }

    initState();
    parentCmd.onAfter = initState;
    handleHistoryActionOptions(parentCmd);
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
