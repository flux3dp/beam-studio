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

const mockDrawFullWorkarea = jest.fn((_url: string, callback: () => void) => callback());

jest.mock('@core/app/actions/beambox/preview-mode-background-drawer', () => ({
  drawFullWorkarea: (...args) => mockDrawFullWorkarea(...args),
}));

const mockGetWideAngleCameraData = jest.fn();

jest.mock('@core/app/actions/camera/preview-helper/getWideAngleCameraData', () => ({
  getWideAngleCameraData: (...args) => mockGetWideAngleCameraData(...args),
}));

const mockOpenMessage = jest.fn();

jest.mock('@core/app/actions/message-caller', () => ({
  __esModule: true,
  default: { openMessage: (...args) => mockOpenMessage(...args) },
  MessageLevel: { SUCCESS: 'success' },
}));

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
const mockConnectCamera = jest.fn();
const mockSetCamera = jest.fn();
const mockSetFisheyeParam = jest.fn();
const mockSetFisheyeObjectHeight = jest.fn();
const mockTakeOnePicture = jest.fn();
const mockDeviceMaster = { currentControlMode: '' as null | string };

jest.mock('@core/helpers/device-master', () => ({
  connectCamera: (...args) => mockConnectCamera(...args),
  get currentControlMode() {
    return mockDeviceMaster.currentControlMode;
  },
  disconnectCamera: (...args) => mockDisconnectCamera(...args),
  getDoorOpen: (...args) => mockGetDoorOpen(...args),
  setCamera: (...args) => mockSetCamera(...args),
  setFisheyeObjectHeight: (...args) => mockSetFisheyeObjectHeight(...args),
  setFisheyeParam: (...args) => mockSetFisheyeParam(...args),
  takeOnePicture: (...args) => mockTakeOnePicture(...args),
}));

jest.mock('@core/helpers/i18n', () => ({
  lang: {
    message: { auto_preview: { abort_to_continue: 'abort?', prefix: 'Auto: ' }, preview: { succeeded: 'done' } },
  },
}));

import autoFullAreaPreview, { pickPhoto, registerAutoFullAreaPreview } from './autoFullAreaPreview';

const fbm2 = { model: 'fbm2' } as IDeviceInfo;
const fhx2rf = { model: 'fhx2rf' } as IDeviceInfo;
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

    test('skips ticks while not current, in a sub-task or without a control socket', async () => {
      mockIsCurrent.mockReturnValue(false);
      await cycle(2000, 2000);
      mockIsCurrent.mockReturnValue(true);
      mockDeviceMaster.currentControlMode = 'raw';
      await wait(2000);
      mockDeviceMaster.currentControlMode = null;
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

    test('setup that failed with an error (already ended) only releases the camera', async () => {
      mockSetup.mockResolvedValue(false);
      await cycle(2000, 1500);
      expect(mockPreviewFullWorkarea).not.toHaveBeenCalled();
      expect(mockEnd).not.toHaveBeenCalled();
      expect(mockDisconnectCamera).toHaveBeenCalledTimes(1);
    });

    test('setup that stopped on an open door (still raw) ends the manager', async () => {
      mockSetup.mockImplementation(async () => {
        mockDeviceMaster.currentControlMode = 'raw';

        return false;
      });
      await cycle(2000, 1500);
      expect(mockPreviewFullWorkarea).not.toHaveBeenCalled();
      expect(mockEnd).toHaveBeenCalledTimes(1);
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

      // fbm2 does not poll the door during its capture: a poll beside the (queued) setup commands is useless
      const pollsBefore = mockGetDoorOpen.mock.calls.length;

      await wait(2000);
      expect(mockGetDoorOpen).toHaveBeenCalledTimes(pollsBefore);

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

  test('pickPhoto: newest settled photo, else the newest taken while open, else none', () => {
    const photos = [1000, 2000, 3000, 3500].map((finishedAt) => ({ finishedAt, url: `u${finishedAt}` }));

    expect(pickPhoto(photos, 4000, 3600)?.url).toBe('u2000');
    // nothing settled: newest that finished while the door still read open, not the ones in flight at the close
    expect(pickPhoto(photos, 2400, 2300)?.url).toBe('u2000');
    expect(pickPhoto(photos, 2000, 1500)?.url).toBe('u1000');
    expect(pickPhoto(photos, 1000, 500)).toBeUndefined();
    expect(pickPhoto([], 3000, 2500)).toBeUndefined();
  });

  describe('fbb2/fhx2rf open-lid loop', () => {
    let shots = 0;

    beforeEach(() => {
      shots = 0;
      global.URL.createObjectURL = jest.fn(() => `url${(shots += 1)}`);
      global.URL.revokeObjectURL = jest.fn();
      mockGetWideAngleCameraData.mockResolvedValue({ hasWideAngleCamera: true, parameters: { k: [], offset: [1, 2] } });
      mockSetCamera.mockResolvedValue(true);
      // each photo takes 500 ms
      mockTakeOnePicture.mockImplementation(() => sleepFake(500).then(() => ({ imgBlob: 'blob' })));
    });

    const sleepFake = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    test('fast close: the photo in flight at the close is never drawn', async () => {
      autoFullAreaPreview.start(fhx2rf);
      door(true);
      // tick 500: open, loop starts; photo 1 done ~1000; photo 2 starts ~1200
      await wait(1300);
      door(false);
      // tick 1500: closed; photo 2 finishes ~1700, after the last open poll
      await wait(1500);

      expect(mockDrawFullWorkarea).toHaveBeenCalledTimes(1);
      expect(mockDrawFullWorkarea.mock.calls[0][0]).toBe('url1');
    });

    test('shoots while open without raw mode, draws a settled photo at close', async () => {
      autoFullAreaPreview.start(fhx2rf);
      door(true);
      await wait(5000);
      expect(mockSetCamera).toHaveBeenCalledWith(1);
      expect(mockSetFisheyeParam).toHaveBeenCalledWith(expect.objectContaining({ offset: undefined }));
      expect(mockSetFisheyeObjectHeight).toHaveBeenCalledWith(0);
      expect(mockOpenMessage).not.toHaveBeenCalled();

      door(false);
      await wait(1500);

      const drawn = mockDrawFullWorkarea.mock.calls[0][0];
      const urls = (URL.createObjectURL as jest.Mock).mock.results.map(({ value }) => value);

      expect(mockDrawFullWorkarea).toHaveBeenCalledTimes(1);
      // not the newest: that one finished within SETTLE_MS of the close
      expect(drawn).not.toBe(urls.at(-1));
      expect(URL.revokeObjectURL).not.toHaveBeenCalledWith(drawn);
      expect(mockOpenMessage).toHaveBeenCalledWith(expect.objectContaining({ content: 'Auto: done' }));
      expect(mockDisconnectCamera).toHaveBeenCalled();
      expect(autoFullAreaPreview.isBusy()).toBe(false);
    });

    test('without wide-angle calibration it does nothing', async () => {
      mockGetWideAngleCameraData.mockResolvedValue({ hasWideAngleCamera: true });
      autoFullAreaPreview.start(fhx2rf);
      door(true);
      await wait(2000);
      door(false);
      await wait(1500);
      expect(mockConnectCamera).not.toHaveBeenCalled();
      expect(mockDrawFullWorkarea).not.toHaveBeenCalled();
    });

    test('abort while open draws nothing and revokes every photo', async () => {
      autoFullAreaPreview.start(fhx2rf);
      door(true);
      await wait(3000);
      expect(autoFullAreaPreview.isBusy()).toBe(true);

      const aborting = autoFullAreaPreview.abort();

      await wait(1000);
      await aborting;
      expect(mockDrawFullWorkarea).not.toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledTimes(shots);
    });
  });
});
