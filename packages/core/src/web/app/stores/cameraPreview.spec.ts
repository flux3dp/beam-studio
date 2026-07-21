import { PreviewMode } from '@core/app/constants/cameraConstants';

import { setCameraPreviewState, useCameraPreviewStore } from './cameraPreview';

describe('cameraPreview store', () => {
  it('should have the default state on init', () => {
    expect(useCameraPreviewStore.getState()).toEqual({
      bgOpacity: 1,
      isClean: true,
      isDrawing: false,
      isLiveMode: false,
      isPreviewMode: false,
      isStarting: false,
      previewMode: PreviewMode.REGION,
      supportedPreviewModes: [PreviewMode.REGION],
    });
  });

  it('should merge partial state via setCameraPreviewState', () => {
    setCameraPreviewState({ bgOpacity: 0.5, isDrawing: true });

    expect(useCameraPreviewStore.getState().bgOpacity).toBe(0.5);
    expect(useCameraPreviewStore.getState().isDrawing).toBe(true);
    expect(useCameraPreviewStore.getState().isClean).toBe(true);
  });

  describe('supportedPreviewModes subscription', () => {
    it('should clear pendingPreviewMode when it is no longer supported', () => {
      // widen first so the next change is a real (non-shallow-equal) transition
      setCameraPreviewState({
        pendingPreviewMode: PreviewMode.FULL_AREA,
        supportedPreviewModes: [PreviewMode.REGION, PreviewMode.FULL_AREA],
      });
      // FULL_AREA not in the new supported list -> pending should be cleared
      setCameraPreviewState({ supportedPreviewModes: [PreviewMode.REGION] });

      expect(useCameraPreviewStore.getState().pendingPreviewMode).toBeUndefined();
    });

    it('should keep pendingPreviewMode when it is still supported', () => {
      setCameraPreviewState({ pendingPreviewMode: PreviewMode.FULL_AREA });
      setCameraPreviewState({
        supportedPreviewModes: [PreviewMode.REGION, PreviewMode.FULL_AREA],
      });

      expect(useCameraPreviewStore.getState().pendingPreviewMode).toBe(PreviewMode.FULL_AREA);
    });

    it('should not reset previewMode while a supported pendingPreviewMode exists', () => {
      setCameraPreviewState({
        pendingPreviewMode: PreviewMode.FULL_AREA,
        previewMode: PreviewMode.PRECISE_REGION,
      });
      // previewMode (PRECISE_REGION) is NOT in the new supported list, but a supported mode
      // switch is pending — the reconciliation must defer to it instead of stomping
      // previewMode back to supportedPreviewModes[0] mid-switch (else-if, not two ifs)
      setCameraPreviewState({ supportedPreviewModes: [PreviewMode.FULL_AREA, PreviewMode.REGION] });

      expect(useCameraPreviewStore.getState().previewMode).toBe(PreviewMode.PRECISE_REGION);
      expect(useCameraPreviewStore.getState().pendingPreviewMode).toBe(PreviewMode.FULL_AREA);
    });

    it('should reset previewMode to the first supported mode when unsupported and no pending', () => {
      setCameraPreviewState({ previewMode: PreviewMode.FULL_AREA });
      setCameraPreviewState({
        supportedPreviewModes: [PreviewMode.PRECISE_REGION, PreviewMode.REGION],
      });

      expect(useCameraPreviewStore.getState().previewMode).toBe(PreviewMode.PRECISE_REGION);
    });

    it('should keep previewMode when it is still supported and no pending', () => {
      setCameraPreviewState({ previewMode: PreviewMode.REGION });
      setCameraPreviewState({
        supportedPreviewModes: [PreviewMode.REGION, PreviewMode.FULL_AREA],
      });

      expect(useCameraPreviewStore.getState().previewMode).toBe(PreviewMode.REGION);
    });

    it('should not run reset logic when supportedPreviewModes is shallow-equal', () => {
      setCameraPreviewState({ previewMode: PreviewMode.FULL_AREA });
      // current supported is the default [REGION]; setting an equal array must be treated as
      // no change by the shallow equalityFn, so the reset logic should not fire and previewMode
      // must stay FULL_AREA even though it is not in supportedPreviewModes.
      setCameraPreviewState({ supportedPreviewModes: [PreviewMode.REGION] });

      expect(useCameraPreviewStore.getState().previewMode).toBe(PreviewMode.FULL_AREA);
    });
  });
});
