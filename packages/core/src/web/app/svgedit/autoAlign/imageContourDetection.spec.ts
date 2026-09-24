import { mockSubscribe, useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';

const mockGetCanvasCrop = jest.fn();
const mockDetectContours = jest.fn();
const mockOpenMessage = jest.fn();
const mockCloseMessage = jest.fn();

jest.mock('@core/app/actions/beambox/preview-mode-background-drawer', () => ({
  __esModule: true,
  default: { getCanvasCrop: (...args: unknown[]) => mockGetCanvasCrop(...args) },
}));
jest.mock('@core/helpers/contour/detectContours', () => ({
  detectContours: (...args: unknown[]) => mockDetectContours(...args),
}));
jest.mock('@core/app/actions/message-caller', () => ({
  __esModule: true,
  default: {
    closeMessage: (...args: unknown[]) => mockCloseMessage(...args),
    openMessage: (...args: unknown[]) => mockOpenMessage(...args),
  },
  MessageLevel: { INFO: 'info', LOADING: 'loading', SUCCESS: 'success', WARNING: 'warning' },
}));
jest.mock('@core/helpers/i18n', () => ({
  __esModule: true,
  default: {
    lang: {
      message: { detecting_objects: 'detecting', object_detection_failed: 'failed', objects_detected: 'detected' },
    },
  },
}));
jest.mock('@core/app/svgedit/workarea', () => ({
  __esModule: true,
  default: { modelHeight: 3000, width: 4000, zoomRatio: 1 },
}));

import { useCameraPreviewStore } from '@core/app/stores/cameraPreview';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

import { ImageContourDetector } from './imageContourDetection';

const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

/** a 100x100 part at (100, 200) in a half-scale (ratio 0.5) crop */
const part = {
  angle: 0,
  bbox: [50, 100, 50, 50],
  center: [75, 125],
  contour: [
    [50, 100],
    [100, 100],
    [100, 150],
    [50, 150],
  ],
};
/** spans 95% of the 4000 px workarea at ratio 0.5 */
const rail = {
  angle: 0,
  bbox: [0, 340, 1900, 40],
  center: [950, 360],
  contour: [
    [0, 340],
    [1900, 340],
    [1900, 380],
    [0, 380],
  ],
};

const endBatch = async () => {
  useCameraPreviewStore.setState({ isDrawing: true });
  useCameraPreviewStore.setState({ isDrawing: false });
  await flush();
  await flush();
};

describe('ImageContourDetector', () => {
  let detector: ImageContourDetector;

  beforeEach(() => {
    jest.clearAllMocks();
    canvasEventEmitter.removeAllListeners();
    useGlobalPreferenceStore.getState().set('snap_to_object_center', true);
    useCameraPreviewStore.setState({ isClean: false, isDrawing: false, isLiveMode: false });
    mockGetCanvasCrop.mockResolvedValue({ blob: new Blob(), ratio: 0.5, x: 0, y: 0 });
    mockDetectContours.mockResolvedValue([part]);
    detector = new ImageContourDetector();
    detector.init();
  });

  it('detects the whole canvas once a batch ends and maps results by the crop ratio', async () => {
    canvasEventEmitter.emit('preview-background-updated');
    canvasEventEmitter.emit('preview-background-updated');
    expect(mockDetectContours).not.toHaveBeenCalled();

    await endBatch();

    expect(mockGetCanvasCrop).toHaveBeenCalledWith(0, 0, 4000, 3000);
    expect(mockDetectContours).toHaveBeenCalledTimes(1);
    expect(detector.contours).toHaveLength(1);
    expect(detector.contours[0].bbox).toEqual([100, 200, 100, 100]);
    expect(detector.contours[0].center).toEqual([150, 250]);
    expect(detector.contours[0].rect.width).toBeCloseTo(100);
    expect(detector.contours[0].rect.rectangularity).toBeCloseTo(1);
    expect(mockOpenMessage.mock.calls.map(([{ level }]) => level)).toEqual(['loading', 'success']);
  });

  it('does not run while drawing or in live mode, and runs when live mode ends', async () => {
    canvasEventEmitter.emit('preview-background-updated');
    useCameraPreviewStore.setState({ isDrawing: true });
    useCameraPreviewStore.setState({ isLiveMode: true });
    useCameraPreviewStore.setState({ isDrawing: false });
    await flush();
    expect(mockDetectContours).not.toHaveBeenCalled();

    useCameraPreviewStore.setState({ isLiveMode: false });
    await flush();
    await flush();
    expect(mockDetectContours).toHaveBeenCalledTimes(1);
  });

  it('drains a batch that lands during a run without a second trigger', async () => {
    let finishFirst!: (value: unknown[]) => void;

    mockDetectContours.mockReturnValueOnce(new Promise((resolve) => (finishFirst = resolve)));
    canvasEventEmitter.emit('preview-background-updated');
    useCameraPreviewStore.setState({ isDrawing: true });
    useCameraPreviewStore.setState({ isDrawing: false });
    await flush();
    expect(mockDetectContours).toHaveBeenCalledTimes(1);

    canvasEventEmitter.emit('preview-background-updated'); // lands mid-run
    finishFirst([]);
    await flush();
    await flush();
    expect(mockDetectContours).toHaveBeenCalledTimes(2);
    expect(detector.contours).toHaveLength(1);
  });

  it('drops objects spanning 90% or more of the workarea', async () => {
    mockDetectContours.mockResolvedValue([part, rail]);
    canvasEventEmitter.emit('preview-background-updated');
    await endBatch();

    expect(detector.contours.map((c) => c.bbox[2])).toEqual([100]);
  });

  it('ignores previews while the preference is off and clears when it turns off', async () => {
    useGlobalPreferenceStore.getState().set('snap_to_object_center', false);
    canvasEventEmitter.emit('preview-background-updated');
    await endBatch();
    expect(mockDetectContours).not.toHaveBeenCalled();

    useGlobalPreferenceStore.getState().set('snap_to_object_center', true);
    canvasEventEmitter.emit('preview-background-updated');
    await endBatch();
    expect(detector.contours).toHaveLength(1);

    const prefListener = mockSubscribe.mock.calls.find(
      ([selector]) => selector({ snap_to_object_center: 'X' }) === 'X',
    )[1];

    prefListener(false);
    expect(detector.contours).toEqual([]);
    expect(mockCloseMessage).toHaveBeenCalledWith('snap-to-object-center');
  });

  it.each([
    ['isClean', () => useCameraPreviewStore.setState({ isClean: true })],
    ['model-changed', () => canvasEventEmitter.emit('model-changed')],
  ])('clears on %s', async (_, trigger) => {
    canvasEventEmitter.emit('preview-background-updated');
    await endBatch();
    expect(detector.contours).toHaveLength(1);

    trigger();
    expect(detector.contours).toEqual([]);
  });

  it('warns once on failure and recovers on the next batch', async () => {
    mockDetectContours.mockRejectedValueOnce(new Error('boom')).mockRejectedValueOnce(new Error('boom'));
    canvasEventEmitter.emit('preview-background-updated');
    await endBatch();
    canvasEventEmitter.emit('preview-background-updated');
    await endBatch();
    expect(mockOpenMessage.mock.calls.filter(([{ level }]) => level === 'warning')).toHaveLength(1);

    canvasEventEmitter.emit('preview-background-updated');
    await endBatch();
    expect(detector.contours).toHaveLength(1);
  });
});
