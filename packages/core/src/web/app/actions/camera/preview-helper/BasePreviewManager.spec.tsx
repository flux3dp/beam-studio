import alertConstants from 'app/constants/alert-constants';
import lang from 'app/lang/en';
import { IDeviceInfo } from 'interfaces/IDevice';
import { PreviewSpeedLevel } from 'app/actions/beambox/constant';

import BasePreviewManager from './BasePreviewManager';

const mockRead = jest.fn();
jest.mock('app/actions/beambox/beambox-preference', () => ({
  read: (...args) => mockRead(...args),
}));

const mockAlertConfigRead = jest.fn();
jest.mock('helpers/api/alert-config', () => ({
  read: (...args) => mockAlertConfigRead(...args),
}));

const mockSelect = jest.fn();
const mockDisconnectCamera = jest.fn();
const mockKick = jest.fn();
const mockTakeOnePicture = jest.fn();
const mockGetControl = jest.fn();
const mockRawMove = jest.fn();
const mockEnterRawMode = jest.fn();
jest.mock('helpers/device-master', () => ({
  select: (...args) => mockSelect(...args),
  disconnectCamera: (...args) => mockDisconnectCamera(...args),
  kick: (...args) => mockKick(...args),
  takeOnePicture: (...args) => mockTakeOnePicture(...args),
  getControl: (...args) => mockGetControl(...args),
  rawMove: (...args) => mockRawMove(...args),
  enterRawMode: (...args) => mockEnterRawMode(...args),
}));

const mockGetSupportInfo = jest.fn();
jest.mock('app/constants/add-on', () => ({
  getSupportInfo: (...args) => mockGetSupportInfo(...args),
}));

const mockGetWorkarea = jest.fn();
jest.mock('app/constants/workarea-constants', () => ({
  getWorkarea: (...args) => mockGetWorkarea(...args),
}));

const mockPopUp = jest.fn();
jest.mock('app/actions/alert-caller', () => ({
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
    expect(basePreviewManager.previewRegion(0, 100, 0, 100)).rejects.toThrow(
      'Method not implemented.'
    );
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
    mockGetWorkarea.mockReturnValue({ pxWidth: 100, pxHeight: 100 });
    const basePreviewManager = new BasePreviewManager(mockDeviceInfo);
    expect(mockGetWorkarea).toBeCalledTimes(1);
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
      expect(mockPopUp).not.toBeCalled();
      expect(mockCreateObjectURL).toBeCalledTimes(1);
      expect(mockCreateObjectURL).toBeCalledWith('mock-blob');
    });

    test('getPhotoFromMachine no blob', async () => {
      const basePreviewManager = new BasePreviewManager(mockDeviceInfo);
      mockTakeOnePicture.mockResolvedValue(undefined);
      await expect(basePreviewManager.getPhotoFromMachine()).rejects.toThrow(
        lang.message.camera.ws_closed_unexpectly
      );
    });

    test('getPhotoFromMachine with alert continue', async () => {
      const basePreviewManager = new BasePreviewManager(mockDeviceInfo);
      mockTakeOnePicture.mockResolvedValue({ imgBlob: 'mock-blob', needCameraCableAlert: true });
      mockCreateObjectURL.mockReturnValue('mock-url');
      const p = basePreviewManager.getPhotoFromMachine();
      await new Promise((r) => setTimeout(r));
      expect(mockPopUp).toBeCalledTimes(1);
      expect(mockPopUp).toBeCalledWith({
        id: 'camera_cable_alert',
        type: alertConstants.SHOW_POPUP_WARNING,
        message: lang.message.camera.camera_cable_unstable,
        checkbox: {
          text: lang.beambox.popup.dont_show_again,
          callbacks: expect.any(Function),
        },
        buttonLabels: [lang.message.camera.abort_preview, lang.message.camera.continue_preview],
        callbacks: [expect.any(Function), expect.any(Function)],
        primaryButtonIndex: 1,
      });
      mockPopUp.mock.calls[0][0].callbacks[1]();
      const res = await p;
      expect(res).toEqual('mock-url');
      expect(mockCreateObjectURL).toBeCalledTimes(1);
      expect(mockCreateObjectURL).toBeCalledWith('mock-blob');
    });

    test('getPhotoFromMachine with alert abort', async () => {
      const basePreviewManager = new BasePreviewManager(mockDeviceInfo);
      const mockEnd = jest.spyOn(basePreviewManager, 'end');
      mockTakeOnePicture.mockResolvedValue({ imgBlob: 'mock-blob', needCameraCableAlert: true });
      mockCreateObjectURL.mockReturnValue('mock-url');
      const p = basePreviewManager.getPhotoFromMachine();
      await new Promise((r) => setTimeout(r));
      expect(mockPopUp).toBeCalledTimes(1);
      expect(mockPopUp).toBeCalledWith({
        id: 'camera_cable_alert',
        type: alertConstants.SHOW_POPUP_WARNING,
        message: lang.message.camera.camera_cable_unstable,
        checkbox: {
          text: lang.beambox.popup.dont_show_again,
          callbacks: expect.any(Function),
        },
        buttonLabels: [lang.message.camera.abort_preview, lang.message.camera.continue_preview],
        callbacks: [expect.any(Function), expect.any(Function)],
        primaryButtonIndex: 1,
      });
      mockPopUp.mock.calls[0][0].callbacks[0]();
      const res = await p;
      expect(res).toBeNull();
      expect(mockCreateObjectURL).not.toBeCalled();
      expect(mockEnd).toBeCalledTimes(1);
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
    expect(mockMoveTo).toBeCalledTimes(1);
    expect(mockMoveTo).toBeCalledWith(50, 50);
    expect(mockGetPhotoFromMachine).toBeCalledTimes(1);
  });

  describe('test move to & preview move speed', () => {
    const testSets = [
      { label: 'fast', value: PreviewSpeedLevel.FAST, expected: 18000 },
      { label: 'medium', value: PreviewSpeedLevel.MEDIUM, expected: 14400 },
      { label: 'slow', value: PreviewSpeedLevel.SLOW, expected: 10800 },
    ];

    testSets.forEach(({ label, value, expected }) => {
      test(`moveTo ${label}`, async () => {
        mockRead.mockImplementation((key) => {
          if (key === 'enable-diode') return false;
          if (key === 'workarea') return 'fbm1';
          return value;
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
        expect(mockSelect).toBeCalledTimes(1);
        expect(mockGetControl).toBeCalledTimes(1);
        expect(mockEnterRawMode).toBeCalledTimes(1);
        expect(mockRawMove).toBeCalledTimes(1);
        expect(mockRawMove).toBeCalledWith({ f: expected, x: 50, y: 50 });
      });
    });

    test('moveTo with diode', async () => {
      mockRead.mockImplementation((key) => {
        if (key === 'enable-diode') return true;
        if (key === 'workarea') return 'fbm1';
        return PreviewSpeedLevel.FAST;
      });
      mockGetSupportInfo.mockReturnValue({ hybridLaser: true });
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
      expect(mockSelect).toBeCalledTimes(1);
      expect(mockGetControl).toBeCalledTimes(1);
      expect(mockEnterRawMode).toBeCalledTimes(1);
      expect(mockRawMove).toBeCalledTimes(1);
      expect(mockRawMove).toBeCalledWith({ f: 3600, x: 50, y: 50 });
    });
  });
});
