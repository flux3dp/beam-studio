const mockOn = jest.fn();
const mockEmit = jest.fn();
const mockRemoveListener = jest.fn();
const mockRemoveAllListeners = jest.fn();

jest.mock('@core/helpers/eventEmitterFactory', () => ({
  createEventEmitter: () => ({
    emit: mockEmit,
    on: mockOn,
    removeAllListeners: mockRemoveAllListeners,
    removeListener: mockRemoveListener,
  }),
}));

import beamboxStore from './beambox-store';

describe('test beambox-store', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('test onCropperShown', () => {
    const callback = jest.fn();

    beamboxStore.onCropperShown(callback);
    expect(mockOn).toHaveBeenCalledTimes(1);
    expect(mockOn).toHaveBeenNthCalledWith(1, 'SHOW_CROPPER', callback);
  });

  test('test onDrawGuideLines', () => {
    const callback = jest.fn();

    beamboxStore.onDrawGuideLines(callback);
    expect(mockOn).toHaveBeenCalledTimes(1);
    expect(mockOn).toHaveBeenNthCalledWith(1, 'DRAW_GUIDE_LINES', callback);
  });

  test('test removeCropperShownListener', () => {
    const callback = jest.fn();

    beamboxStore.removeCropperShownListener(callback);
    expect(mockRemoveListener).toHaveBeenCalledTimes(1);
    expect(mockRemoveListener).toHaveBeenNthCalledWith(1, 'SHOW_CROPPER', callback);
  });

  test('test emitShowCropper', () => {
    beamboxStore.emitShowCropper();
    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenNthCalledWith(1, 'SHOW_CROPPER');
  });

  test('test emitDrawGuideLines', () => {
    beamboxStore.emitDrawGuideLines();
    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenNthCalledWith(1, 'DRAW_GUIDE_LINES');
  });
});
