import { PreviewSpeedLevel } from '@core/app/actions/beambox/constant';
import alertConstants from '@core/app/constants/alert-constants';
import lang from '@core/app/lang/en';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import BasePreviewManager from './BasePreviewManager';

const mockGetState = jest.fn();

jest.mock('@core/app/stores/documentStore', () => ({
  useDocumentStore: {
    getState: () => mockGetState(),
  },
}));

jest.mock('@core/app/svgedit/workarea', () => ({
  model: 'fbm1',
}));

const mockGetGlobalPreferenceStore = jest.fn();

jest.mock('@core/app/stores/globalPreferenceStore', () => ({
  useGlobalPreferenceStore: {
    getState: () => mockGetGlobalPreferenceStore(),
  },
}));

const mockAlertConfigRead = jest.fn();

jest.mock('@core/helpers/api/alert-config', () => ({
  read: (...args) => mockAlertConfigRead(...args),
}));

const mockSelect = jest.fn();
const mockDisconnectCamera = jest.fn();
const mockKick = jest.fn();
const mockTakeOnePicture = jest.fn();
const mockGetControl = jest.fn();
const mockRawMove = jest.fn();
const mockEnterRawMode = jest.fn();

jest.mock('@core/helpers/device-master', () => ({
  disconnectCamera: (...args) => mockDisconnectCamera(...args),
  enterRawMode: (...args) => mockEnterRawMode(...args),
  getControl: (...args) => mockGetControl(...args),
  kick: (...args) => mockKick(...args),
  rawMove: (...args) => mockRawMove(...args),
  select: (...args) => mockSelect(...args),
  takeOnePicture: (...args) => mockTakeOnePicture(...args),
}));

const mockGetAddOnInfo = jest.fn();

jest.mock('@core/app/constants/addOn', () => ({
  getAddOnInfo: (...args) => mockGetAddOnInfo(...args),
}));

const mockGetWorkarea = jest.fn();

jest.mock('@core/app/constants/workarea-constants', () => ({
  getWorkarea: (...args) => mockGetWorkarea(...args),
}));

const mockPopUp = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUp: (...args) => mockPopUp(...args),
}));

const mockCreateObjectURL = jest.fn();
const mockDeviceInfo = { model: 'fbm1' } as IDeviceInfo;

describe('test BasePreviewManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.URL.createObjectURL = mockCreateObjectURL;
  });

  test('unimplemented methods', () => {
    const basePreviewManager = new BasePreviewManager(mockDeviceInfo);

    expect(basePreviewManager.setup()).rejects.toThrow('Method not implemented.');
    expect(basePreviewManager.preview(0, 0)).rejects.toThrow('Method not implemented.');
    expect(basePreviewManager.previewRegion(0, 100, 0, 100)).rejects.toThrow('Method not implemented.');
  });

  test('end', async () => {
    const basePreviewManager = new BasePreviewManager(mockDeviceInfo);

    mockSelect.mockResolvedValue({ success: true });
    await basePreviewManager.end();
    expect(mockSelect).toHaveBeenCalledTimes(1);
    expect(mockDisconnectCamera).toHaveBeenCalledTimes(1);
    expect(mockKick).toHaveBeenCalledTimes(1);
  });

  test('constrainPreviewXY', () => {
    mockGetWorkarea.mockReturnValue({ pxHeight: 100, pxWidth: 100 });

    const basePreviewManager = new BasePreviewManager(mockDeviceInfo);

    expect(mockGetWorkarea).toHaveBeenCalledTimes(1);
    expect(basePreviewManager.constrainPreviewXY(50, 50)).toEqual({ x: 50, y: 50 });
    expect(basePreviewManager.constrainPreviewXY(150, 150)).toEqual({ x: 100, y: 100 });
    expect(basePreviewManager.constrainPreviewXY(-50, -50)).toEqual({ x: 0, y: 0 });
  });

  describe('getPhotoFromMachine', () => {
    test('getPhotoFromMachine no alert', async () => {
      const basePreviewManager = new BasePreviewManager(mockDeviceInfo);

      mockTakeOnePicture.mockResolvedValue({ imgBlob: 'mock-blob' });
      mockCreateObjectURL.mockReturnValue('mock-url');

      const res = await basePreviewManager.getPhotoFromMachine();

      expect(res).toEqual('mock-url');
      expect(mockPopUp).not.toHaveBeenCalled();
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      expect(mockCreateObjectURL).toHaveBeenCalledWith('mock-blob');
    });

    test('getPhotoFromMachine no blob', async () => {
      const basePreviewManager = new BasePreviewManager(mockDeviceInfo);

      mockTakeOnePicture.mockResolvedValue(undefined);
      await expect(basePreviewManager.getPhotoFromMachine()).rejects.toThrow(lang.message.camera.ws_closed_unexpectly);
    });

    test('getPhotoFromMachine with alert continue', async () => {
      const basePreviewManager = new BasePreviewManager(mockDeviceInfo);

      mockTakeOnePicture.mockResolvedValue({ imgBlob: 'mock-blob', needCameraCableAlert: true });
      mockCreateObjectURL.mockReturnValue('mock-url');

      const p = basePreviewManager.getPhotoFromMachine();

      await new Promise((r) => setTimeout(r));
      expect(mockPopUp).toHaveBeenCalledTimes(1);
      expect(mockPopUp).toHaveBeenCalledWith({
        buttonLabels: [lang.message.camera.abort_preview, lang.message.camera.continue_preview],
        callbacks: [expect.any(Function), expect.any(Function)],
        checkbox: {
          callbacks: expect.any(Function),
          text: lang.alert.dont_show_again,
        },
        id: 'camera_cable_alert',
        message: lang.message.camera.camera_cable_unstable,
        primaryButtonIndex: 1,
        type: alertConstants.SHOW_POPUP_WARNING,
      });
      mockPopUp.mock.calls[0][0].callbacks[1]();

      const res = await p;

      expect(res).toEqual('mock-url');
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      expect(mockCreateObjectURL).toHaveBeenCalledWith('mock-blob');
    });

    test('getPhotoFromMachine with alert abort', async () => {
      const basePreviewManager = new BasePreviewManager(mockDeviceInfo);
      const mockEnd = jest.spyOn(basePreviewManager, 'end');

      mockTakeOnePicture.mockResolvedValue({ imgBlob: 'mock-blob', needCameraCableAlert: true });
      mockCreateObjectURL.mockReturnValue('mock-url');

      const p = basePreviewManager.getPhotoFromMachine();

      await new Promise((r) => setTimeout(r));
      expect(mockPopUp).toHaveBeenCalledTimes(1);
      expect(mockPopUp).toHaveBeenCalledWith({
        buttonLabels: [lang.message.camera.abort_preview, lang.message.camera.continue_preview],
        callbacks: [expect.any(Function), expect.any(Function)],
        checkbox: {
          callbacks: expect.any(Function),
          text: lang.alert.dont_show_again,
        },
        id: 'camera_cable_alert',
        message: lang.message.camera.camera_cable_unstable,
        primaryButtonIndex: 1,
        type: alertConstants.SHOW_POPUP_WARNING,
      });
      mockPopUp.mock.calls[0][0].callbacks[0]();

      const res = await p;

      expect(res).toBeNull();
      expect(mockCreateObjectURL).not.toHaveBeenCalled();
      expect(mockEnd).toHaveBeenCalledTimes(1);
    });
  });

  test('getPhotoAfterMoveTo', async () => {
    const basePreviewManager = new BasePreviewManager(mockDeviceInfo);
    const mockGetPhotoFromMachine = jest.spyOn(basePreviewManager, 'getPhotoFromMachine');
    const mockMoveTo = jest.spyOn(basePreviewManager, 'moveTo');

    mockMoveTo.mockResolvedValue(true);
    mockGetPhotoFromMachine.mockResolvedValue('mock-url');

    const res = await basePreviewManager.getPhotoAfterMoveTo(50, 50);

    expect(res).toEqual('mock-url');
    expect(mockMoveTo).toHaveBeenCalledTimes(1);
    expect(mockMoveTo).toHaveBeenCalledWith(50, 50);
    expect(mockGetPhotoFromMachine).toHaveBeenCalledTimes(1);
  });

  describe('test move to & preview move speed', () => {
    const testSets = [
      { expected: 18000, label: 'fast', value: PreviewSpeedLevel.FAST },
      { expected: 14400, label: 'medium', value: PreviewSpeedLevel.MEDIUM },
      { expected: 10800, label: 'slow', value: PreviewSpeedLevel.SLOW },
    ];

    testSets.forEach(({ expected, label, value }) => {
      test(`moveTo ${label}`, async () => {
        mockGetState.mockReturnValue({ 'enable-diode': false });
        mockGetGlobalPreferenceStore.mockReturnValue({
          preview_movement_speed_level: value,
        });

        const basePreviewManager = new BasePreviewManager(mockDeviceInfo);

        mockSelect.mockResolvedValue({ success: true });
        mockGetControl.mockResolvedValue({ getMode: () => '' });
        jest.useFakeTimers();

        const mockSetTimeout = jest.spyOn(global, 'setTimeout');

        mockSetTimeout.mockImplementation((cb) => {
          cb();

          return 0 as unknown as NodeJS.Timeout;
        });

        const p = basePreviewManager.moveTo(50, 50);

        jest.runAllTimers();
        await p;
        expect(mockSelect).toHaveBeenCalledTimes(1);
        expect(mockGetControl).toHaveBeenCalledTimes(1);
        expect(mockEnterRawMode).toHaveBeenCalledTimes(1);
        expect(mockRawMove).toHaveBeenCalledTimes(1);
        expect(mockRawMove).toHaveBeenCalledWith({ f: expected, x: 50, y: 50 });
      });
    });

    test('moveTo with diode', async () => {
      mockGetState.mockReturnValue({ 'enable-diode': true });
      mockGetGlobalPreferenceStore.mockReturnValue({
        preview_movement_speed_level: PreviewSpeedLevel.FAST,
      });
      mockGetAddOnInfo.mockReturnValue({ hybridLaser: true });

      const basePreviewManager = new BasePreviewManager(mockDeviceInfo);

      mockSelect.mockResolvedValue({ success: true });
      mockGetControl.mockResolvedValue({ getMode: () => '' });
      jest.useFakeTimers();

      const mockSetTimeout = jest.spyOn(global, 'setTimeout');

      mockSetTimeout.mockImplementation((cb) => {
        cb();

        return 0 as unknown as NodeJS.Timeout;
      });

      const p = basePreviewManager.moveTo(50, 50);

      jest.runAllTimers();
      await p;
      expect(mockSelect).toHaveBeenCalledTimes(1);
      expect(mockGetControl).toHaveBeenCalledTimes(1);
      expect(mockEnterRawMode).toHaveBeenCalledTimes(1);
      expect(mockRawMove).toHaveBeenCalledTimes(1);
      expect(mockRawMove).toHaveBeenCalledWith({ f: 3600, x: 50, y: 50 });
    });
  });
});
