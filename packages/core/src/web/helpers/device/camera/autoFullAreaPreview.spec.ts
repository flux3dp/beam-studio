import { CanvasMode } from '@core/app/constants/canvasMode';
import type { BackgroundContext } from '@core/helpers/device/background/types';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

const mockSetup = jest.fn();
const mockPreviewFullWorkarea = jest.fn();
const mockEnd = jest.fn();
const mockCancel = jest.fn();

jest.mock('@core/app/actions/camera/preview-helper/Beamo2PreviewManager', () =>
  jest.fn().mockImplementation(() => ({
    cancel: (...args) => mockCancel(...args),
    end: (...args) => mockEnd(...args),
    previewFullWorkarea: (...args) => mockPreviewFullWorkarea(...args),
    setup: (...args) => mockSetup(...args),
  })),
);

const mockGlobalPreference = { 'auto-full-area-preview': true };
const mockDocument = { 'enable-job-origin': false };
const mockCanvas = { mouseMode: 'select' };

jest.mock('@core/app/stores/globalPreferenceStore', () => ({
  useGlobalPreferenceStore: { getState: () => mockGlobalPreference, subscribe: jest.fn() },
}));
jest.mock('@core/app/stores/documentStore', () => ({
  useDocumentStore: { getState: () => mockDocument, subscribe: jest.fn() },
}));
jest.mock('@core/app/stores/canvas/canvasStore', () => ({
  useCanvasStore: { getState: () => mockCanvas },
}));

const mockIsCurrent = jest.fn();
const mockRegister = jest.fn();

jest.mock('@core/helpers/device/background', () => ({
  isCurrent: (...args) => mockIsCurrent(...args),
  refresh: jest.fn(),
  register: (...args) => mockRegister(...args),
}));

const mockCanTouchMachine = jest.fn();

jest.mock(
  '@core/helpers/device/background/canTouchMachine',
  () =>
    (...args) =>
      mockCanTouchMachine(...args),
);

const mockGetDoorOpen = jest.fn();
const mockDisconnectCamera = jest.fn();
const mockDeviceMaster = { currentControlMode: '' as null | string };

jest.mock('@core/helpers/device-master', () => ({
  get currentControlMode() {
    return mockDeviceMaster.currentControlMode;
  },
  disconnectCamera: (...args) => mockDisconnectCamera(...args),
  getDoorOpen: (...args) => mockGetDoorOpen(...args),
}));

jest.mock('@core/helpers/i18n', () => ({
  lang: { message: { auto_preview: { abort_to_continue: 'abort?', prefix: 'Auto: ' } } },
}));

import autoFullAreaPreview, { registerAutoFullAreaPreview } from './autoFullAreaPreview';

const fbm2 = { model: 'fbm2' } as IDeviceInfo;
const door = (isOpen: boolean) => mockGetDoorOpen.mockResolvedValue({ value: isOpen ? '1' : '0' });
const wait = (ms: number) => jest.advanceTimersByTimeAsync(ms);

describe('autoFullAreaPreview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockGlobalPreference['auto-full-area-preview'] = true;
    mockDocument['enable-job-origin'] = false;
    mockCanvas.mouseMode = 'select';
    mockDeviceMaster.currentControlMode = '';
    mockIsCurrent.mockReturnValue(true);
    mockCanTouchMachine.mockResolvedValue(true);
    mockSetup.mockResolvedValue(true);
    mockPreviewFullWorkarea.mockResolvedValue(true);
  });

  afterEach(() => {
    autoFullAreaPreview.stop();
    jest.useRealTimers();
  });

  test('registerAutoFullAreaPreview registers the task', () => {
    registerAutoFullAreaPreview();
    expect(mockRegister).toHaveBeenCalledWith(autoFullAreaPreview);
  });

  describe('isEnabled', () => {
    const ctx: BackgroundContext = { device: fbm2, mode: CanvasMode.Draw, tabFocused: true, workarea: 'fbm2' };

    test('on in Draw mode with a matching workarea', () => {
      expect(autoFullAreaPreview.isEnabled(ctx)).toBe(true);
    });

    test('off for each failing requirement', () => {
      expect(autoFullAreaPreview.isEnabled({ ...ctx, mode: CanvasMode.Preview })).toBe(false);
      expect(autoFullAreaPreview.isEnabled({ ...ctx, workarea: 'fbb2' })).toBe(false);
      mockDocument['enable-job-origin'] = true;
      expect(autoFullAreaPreview.isEnabled(ctx)).toBe(false);
      mockDocument['enable-job-origin'] = false;
      mockGlobalPreference['auto-full-area-preview'] = false;
      expect(autoFullAreaPreview.isEnabled(ctx)).toBe(false);
    });
  });

  describe('fbm2 door cycle', () => {
    // Ticks every 500 ms: open seen from t = 500, close seen at t = 500 + openMs + 500, capture 1000 ms later
    const cycle = async (openMs: number, afterMs: number) => {
      autoFullAreaPreview.start(fbm2);
      door(true);
      await wait(500 + openMs);
      door(false);
      await wait(afterMs);
    };

    test('captures 1 s after a close that followed a 2 s open', async () => {
      await cycle(2000, 500);
      expect(mockSetup).not.toHaveBeenCalled();
      await wait(1000);
      expect(mockSetup).toHaveBeenCalledWith({ messagePrefix: 'Auto: ', silent: true });
      expect(mockPreviewFullWorkarea).toHaveBeenCalledTimes(1);
      expect(mockEnd).toHaveBeenCalledTimes(1);
      expect(autoFullAreaPreview.isBusy()).toBe(false);
    });

    test('ignores a short open', async () => {
      await cycle(1000, 3000);
      expect(mockSetup).not.toHaveBeenCalled();
    });

    test('reopening during the close delay disarms', async () => {
      await cycle(2000, 500);
      door(true);
      await wait(500);
      door(false);
      await wait(3000);
      expect(mockSetup).not.toHaveBeenCalled();
    });

    test('skips ticks while not current or in a sub-task', async () => {
      mockIsCurrent.mockReturnValue(false);
      await cycle(2000, 2000);
      mockIsCurrent.mockReturnValue(true);
      mockDeviceMaster.currentControlMode = 'raw';
      await wait(2000);
      expect(mockGetDoorOpen).not.toHaveBeenCalled();
    });

    test('skips the capture when the machine is not free', async () => {
      mockCanTouchMachine.mockResolvedValue(false);
      await cycle(2000, 1500);
      expect(mockCanTouchMachine).toHaveBeenCalledTimes(1);
      expect(mockSetup).not.toHaveBeenCalled();
    });

    test('skips the capture in preview mouse mode', async () => {
      mockCanvas.mouseMode = 'pre_preview';
      await cycle(2000, 1500);
      expect(mockSetup).not.toHaveBeenCalled();
    });

    test('failed setup does not end again', async () => {
      mockSetup.mockResolvedValue(false);
      await cycle(2000, 1500);
      expect(mockPreviewFullWorkarea).not.toHaveBeenCalled();
      expect(mockEnd).not.toHaveBeenCalled();
    });

    test('kicked mid-capture: no end(), camera disconnected', async () => {
      mockPreviewFullWorkarea.mockImplementation(async () => {
        mockDeviceMaster.currentControlMode = null;
        throw new Error('KICKED');
      });
      await cycle(2000, 1500);
      expect(mockEnd).not.toHaveBeenCalled();
      expect(mockDisconnectCamera).toHaveBeenCalledTimes(1);
    });

    test('abort during setup skips the photo and ends', async () => {
      let finishSetup: (ok: boolean) => void = () => {};

      mockSetup.mockReturnValue(new Promise((resolve) => (finishSetup = resolve)));
      await cycle(2000, 1500);
      expect(autoFullAreaPreview.isBusy()).toBe(true);

      const aborting = autoFullAreaPreview.abort();

      finishSetup(true);
      await aborting;
      expect(mockPreviewFullWorkarea).not.toHaveBeenCalled();
      expect(mockEnd).toHaveBeenCalledTimes(1);
      expect(autoFullAreaPreview.isBusy()).toBe(false);
    });

    test('abort during the photo cancels the manager, then ends', async () => {
      let finishPhoto: (ok: boolean) => void = () => {};

      mockPreviewFullWorkarea.mockReturnValue(new Promise((resolve) => (finishPhoto = resolve)));
      await cycle(2000, 1500);

      const aborting = autoFullAreaPreview.abort();

      expect(mockCancel).toHaveBeenCalledTimes(1);
      expect(mockEnd).not.toHaveBeenCalled();
      finishPhoto(false);
      await aborting;
      expect(mockEnd).toHaveBeenCalledTimes(1);
      expect(autoFullAreaPreview.isBusy()).toBe(false);
    });
  });
});
