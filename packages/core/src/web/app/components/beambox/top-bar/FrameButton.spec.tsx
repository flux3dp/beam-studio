import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { CanvasMode } from '@core/app/constants/canvasMode';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';

import FrameButton from './FrameButton';

const mockShowFramingModal = jest.fn();

jest.mock('@core/app/components/dialogs/FramingModal', () => ({
  showFramingModal: (...args) => mockShowFramingModal(...args),
}));

const mockGetSelectedDevice = jest.fn();

jest.mock('@core/app/views/beambox/TopBar/contexts/TopBarController', () => ({
  getSelectedDevice: () => mockGetSelectedDevice(),
}));

const mockOn = jest.fn();

jest.mock('@core/helpers/shortcuts', () => ({
  on: (...args) => mockOn(...args),
}));

describe('test FrameButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCanvasStore.getState().setMode(CanvasMode.Draw);
  });

  test('should render correctly', async () => {
    const { container } = render(<FrameButton />);

    expect(container).toMatchSnapshot();
    fireEvent.click(container.querySelector('div[class*="button"]'));
    expect(mockShowFramingModal).toBeCalledTimes(1);
  });

  test('should render correctly with previewing mode', () => {
    useCanvasStore.getState().setMode(CanvasMode.Preview);

    const { container } = render(<FrameButton />);

    expect(container).toMatchSnapshot();
  });

  test('shortcut should work', () => {
    render(<FrameButton />);
    expect(mockOn).toBeCalledTimes(1);
    expect(mockOn).toBeCalledWith(['F1'], expect.any(Function));

    const handler = mockOn.mock.calls[0][1];

    expect(mockShowFramingModal).not.toBeCalled();
    mockGetSelectedDevice.mockReturnValue({ model: 'fpm1' });
    handler();
    expect(mockShowFramingModal).toBeCalledTimes(1);
  });

  // TODO: move this to helpers/device/framing.ts
  // test('no element', async () => {
  //   mockGetDevice.mockResolvedValue({ device: { model: 'ado1', version: '4.1.7' } });
  //   mockGetWidth.mockReturnValue(4300);
  //   mockGetHeight.mockReturnValue(3000);
  //   mockGetExpansion.mockReturnValue([0, 0]);
  //   mockGetVisibleElementsAndBBoxes.mockReturnValue([]);
  //   const { container } = render(<FrameButton />);
  //   await act(async () => fireEvent.click(container.querySelector('div[class*="button"]')));
  //   await act(async () => jest.runAllTimers());
  //   expect(mockOpenMessage).toBeCalledTimes(1);
  //   expect(mockOpenMessage).toBeCalledWith({
  //     key: 'no-element-to-frame',
  //     level: 'info',
  //     content: 'Please add objects first',
  //     duration: 3,
  //   });
  // });

  // test('ador low laser', async () => {
  //   const { container } = render(<FrameButton />);
  //   mockGetWidth.mockReturnValue(4300);
  //   mockGetHeight.mockReturnValue(3000);
  //   mockGetExpansion.mockReturnValue([0, 0]);
  //   mockGetDevice.mockResolvedValue({ device: { model: 'ado1', version: '4.1.7' } });
  //   mockGetDeviceDetailInfo.mockResolvedValue({ head_type: 1 });
  //   mockRead.mockReturnValueOnce(null).mockReturnValueOnce(3).mockReturnValueOnce(0);
  //   mockGetDoorOpen.mockResolvedValue({ value: '1', cmd: 'play get_door_open', status: 'ok' });
  //   await act(async () => fireEvent.click(container.querySelector('div[class*="button"]')));
  //   await act(async () => jest.runAllTimers());
  //   expect(mockPopById).toBeCalledTimes(1);
  //   expect(mockGetAllLayers).toBeCalledTimes(1);
  //   expect(mockGetDevice).toBeCalledTimes(1);
  //   expect(mockCheckDeviceStatus).toBeCalledTimes(1);
  //   expect(mockOpenNonstopProgress).toBeCalledTimes(1);
  //   expect(mockGetDeviceDetailInfo).toBeCalledTimes(1);
  //   expect(mockRead).toBeCalledTimes(4);
  //   expect(mockRead).toHaveBeenNthCalledWith(1, 'module-offsets');
  //   expect(mockRead).toHaveBeenNthCalledWith(2, 'low_power');
  //   expect(mockRead).toHaveBeenNthCalledWith(3, 'rotary_mode');
  //   expect(mockRead).toHaveBeenNthCalledWith(4, 'enable-job-origin');
  //   expect(mockGetDoorOpen).toBeCalledTimes(1);
  //   expect(mockOpenMessage).toBeCalledTimes(1);
  //   expect(mockOpenMessage).toBeCalledWith({
  //     key: 'low-laser-warning',
  //     level: 'info',
  //     content: 'Please close the door cover to enable low laser for running frame.',
  //   });
  //   expect(mockUpdate).toBeCalledTimes(6);
  //   expect(mockEnterRawMode).toBeCalledTimes(1);
  //   expect(mockRawSetRotary).toBeCalledTimes(1);
  //   expect(mockRawHomeZ).not.toBeCalled();
  //   expect(mockRawHome).toBeCalledTimes(1);
  //   expect(mockRawStartLineCheckMode).toBeCalledTimes(1);
  //   expect(mockRawSetFan).toBeCalledTimes(1);
  //   expect(mockRawSetAirPump).toBeCalledTimes(1);
  //   expect(mockRawMoveZRelToLastHome).not.toBeCalled();
  //   expect(mockRawMove).toBeCalledTimes(5);
  //   expect(mockRawMove).toHaveBeenNthCalledWith(1, { x: 0, y: 1, f: 6000 });
  //   expect(mockRawMove).toHaveBeenNthCalledWith(2, { x: 2, y: 1, f: 6000 });
  //   expect(mockRawMove).toHaveBeenNthCalledWith(3, { x: 2, y: 4, f: 6000 });
  //   expect(mockRawMove).toHaveBeenNthCalledWith(4, { x: 0, y: 4, f: 6000 });
  //   expect(mockRawMove).toHaveBeenNthCalledWith(5, { x: 0, y: 1, f: 6000 });
  //   expect(mockRawEndLineCheckMode).toBeCalledTimes(1);
  //   expect(mockRawSetLaser).toBeCalledTimes(2);
  //   expect(mockRawSetLaser).toHaveBeenNthCalledWith(1, { on: true, s: 30 });
  //   expect(mockRawSetLaser).toHaveBeenNthCalledWith(2, { on: false, s: 0 });
  //   expect(mockRawSet24V).toBeCalledTimes(2);
  //   expect(mockRawSet24V).toHaveBeenNthCalledWith(1, true);
  //   expect(mockRawSet24V).toHaveBeenNthCalledWith(2, false);
  //   expect(mockRawLooseMotor).toBeCalledTimes(1);
  //   expect(mockEndRawMode).toBeCalledTimes(1);
  //   expect(mockKick).toBeCalledTimes(1);
  //   expect(mockRawSetWaterPump).not.toBeCalled();
  // });

  // test('ador low laser with rotary and mirror', async () => {
  //   const { container } = render(<FrameButton />);
  //   mockGetWidth.mockReturnValue(4300);
  //   mockGetHeight.mockReturnValue(3000);
  //   mockGetExpansion.mockReturnValue([0, 0]);
  //   mockGetDevice.mockResolvedValue({ device: { model: 'ado1', version: '4.1.7' } });
  //   mockGetDeviceDetailInfo.mockResolvedValue({ head_type: 1 });
  //   mockRead.mockReturnValueOnce(null).mockReturnValueOnce(3).mockReturnValueOnce(1);
  //   mockGetDoorOpen.mockResolvedValue({ value: '1', cmd: 'play get_door_open', status: 'ok' });
  //   mockGetPosition.mockReturnValue(10);
  //   await act(async () => fireEvent.click(container.querySelector('div[class*="button"]')));
  //   await act(async () => jest.runAllTimers());
  //   expect(mockPopById).toBeCalledTimes(1);
  //   expect(mockGetAllLayers).toBeCalledTimes(1);
  //   expect(mockGetDevice).toBeCalledTimes(1);
  //   expect(mockCheckDeviceStatus).toBeCalledTimes(1);
  //   expect(mockOpenNonstopProgress).toBeCalledTimes(1);
  //   expect(mockGetDeviceDetailInfo).toBeCalledTimes(1);
  //   expect(mockRead).toBeCalledTimes(5);
  //   expect(mockRead).toHaveBeenNthCalledWith(1, 'module-offsets');
  //   expect(mockRead).toHaveBeenNthCalledWith(2, 'low_power');
  //   expect(mockRead).toHaveBeenNthCalledWith(3, 'rotary_mode');
  //   expect(mockRead).toHaveBeenNthCalledWith(4, 'rotary-mirror');
  //   expect(mockRead).toHaveBeenNthCalledWith(5, 'enable-job-origin');
  //   expect(mockGetDoorOpen).toBeCalledTimes(1);
  //   expect(mockOpenMessage).toBeCalledTimes(1);
  //   expect(mockOpenMessage).toBeCalledWith({
  //     key: 'low-laser-warning',
  //     level: 'info',
  //     content: 'Please close the door cover to enable low laser for running frame.',
  //   });
  //   expect(mockUpdate).toBeCalledTimes(6);
  //   expect(mockEnterRawMode).toBeCalledTimes(1);
  //   expect(mockRawHomeZ).toBeCalledTimes(1);
  //   expect(mockRawSetRotary).toBeCalledTimes(3);
  //   expect(mockRawSetRotary).toHaveBeenNthCalledWith(1, false);
  //   expect(mockRawSetRotary).toHaveBeenNthCalledWith(2, true);
  //   expect(mockRawSetRotary).toHaveBeenNthCalledWith(3, false);
  //   expect(mockRawHome).toBeCalledTimes(1);
  //   expect(mockRawStartLineCheckMode).toBeCalledTimes(1);
  //   expect(mockRawSetFan).toBeCalledTimes(1);
  //   expect(mockRawSetAirPump).toBeCalledTimes(1);
  //   expect(mockRawMoveZRelToLastHome).toBeCalledTimes(1);
  //   expect(mockRawMoveZRelToLastHome).toHaveBeenNthCalledWith(1, 0);
  //   expect(mockRawMove).toBeCalledTimes(8);
  //   expect(mockRawMove).toHaveBeenNthCalledWith(1, { x: 0, f: 6000 });
  //   expect(mockRawMove).toHaveBeenNthCalledWith(2, { y: 10, f: 6000 });
  //   expect(mockRawMove).toHaveBeenNthCalledWith(3, { x: 0, a: 19, f: 6000 });
  //   expect(mockRawMove).toHaveBeenNthCalledWith(4, { x: 2, a: 19, f: 6000 });
  //   expect(mockRawMove).toHaveBeenNthCalledWith(5, { x: 2, a: 16, f: 6000 });
  //   expect(mockRawMove).toHaveBeenNthCalledWith(6, { x: 0, a: 16, f: 6000 });
  //   expect(mockRawMove).toHaveBeenNthCalledWith(7, { x: 0, a: 19, f: 6000 });
  //   expect(mockRawMove).toHaveBeenNthCalledWith(8, { a: 10, f: 6000 });
  //   expect(mockRawEndLineCheckMode).toBeCalledTimes(1);
  //   expect(mockRawSetLaser).toBeCalledTimes(3);
  //   expect(mockRawSetLaser).toHaveBeenNthCalledWith(1, { on: true, s: 30 });
  //   expect(mockRawSetLaser).toHaveBeenNthCalledWith(2, { on: false, s: 0 });
  //   expect(mockRawSetLaser).toHaveBeenNthCalledWith(3, { on: false, s: 0 });
  //   expect(mockRawSet24V).toBeCalledTimes(2);
  //   expect(mockRawSet24V).toHaveBeenNthCalledWith(1, true);
  //   expect(mockRawSet24V).toHaveBeenNthCalledWith(2, false);
  //   expect(mockRawLooseMotor).toBeCalledTimes(1);
  //   expect(mockEndRawMode).toBeCalledTimes(1);
  //   expect(mockKick).toBeCalledTimes(1);
  //   expect(mockRawSetWaterPump).not.toBeCalled();
  // });

  // test('ador with job origin', async () => {
  //   const { container } = render(<FrameButton />);
  //   mockGetWidth.mockReturnValue(4300);
  //   mockGetHeight.mockReturnValue(3000);
  //   mockGetExpansion.mockReturnValue([0, 0]);
  //   mockGetDevice.mockResolvedValue({ device: { model: 'ado1', version: '5.3.5' } });
  //   mockGetDeviceDetailInfo.mockResolvedValue({ head_type: 1 });
  //   mockRead.mockImplementation((key) => {
  //     if (key === 'low_power') return 3;
  //     if (key === 'rotary_mode') return 0;
  //     if (key === 'enable-job-origin') return 1;
  //     return null;
  //   });
  //   mockGetDoorOpen.mockResolvedValue({ value: '1', cmd: 'play get_door_open', status: 'ok' });
  //   mockGetPosition.mockReturnValue(10);
  //   mockGetJobOrigin.mockReturnValue({ x: 100, y: 100 });
  //   await act(async () => fireEvent.click(container.querySelector('div[class*="button"]')));
  //   await act(async () => jest.runAllTimers());
  //   expect(mockPopById).toBeCalledTimes(1);
  //   expect(mockGetAllLayers).toBeCalledTimes(1);
  //   expect(mockGetDevice).toBeCalledTimes(1);
  //   expect(mockCheckDeviceStatus).toBeCalledTimes(1);
  //   expect(mockOpenNonstopProgress).toBeCalledTimes(1);
  //   expect(mockGetDeviceDetailInfo).toBeCalledTimes(1);
  //   expect(mockRead).toBeCalledTimes(4);
  //   expect(mockRead).toHaveBeenNthCalledWith(1, 'module-offsets');
  //   expect(mockRead).toHaveBeenNthCalledWith(2, 'low_power');
  //   expect(mockRead).toHaveBeenNthCalledWith(3, 'rotary_mode');
  //   expect(mockRead).toHaveBeenNthCalledWith(4, 'enable-job-origin');
  //   expect(mockGetDoorOpen).toBeCalledTimes(1);
  //   expect(mockOpenMessage).toBeCalledTimes(1);
  //   expect(mockOpenMessage).toBeCalledWith({
  //     key: 'low-laser-warning',
  //     level: 'info',
  //     content: 'Please close the door cover to enable low laser for running frame.',
  //   });
  //   expect(mockUpdate).toBeCalledTimes(6);
  //   expect(mockEnterRawMode).toBeCalledTimes(1);
  //   expect(mockRawHomeZ).not.toBeCalled();
  //   expect(mockRawSetRotary).toBeCalledTimes(1);
  //   expect(mockRawSetRotary).toHaveBeenNthCalledWith(1, false);
  //   expect(mockRawHome).not.toBeCalled();
  //   expect(mockRawUnlock).toBeCalledTimes(1);
  //   expect(mockRawSetOrigin).toBeCalledTimes(1);
  //   expect(mockRawStartLineCheckMode).toBeCalledTimes(1);
  //   expect(mockRawSetFan).toBeCalledTimes(1);
  //   expect(mockRawSetAirPump).toBeCalledTimes(1);
  //   expect(mockRawMoveZRelToLastHome).not.toBeCalled();
  //   expect(mockRawMove).toBeCalledTimes(6);
  //   expect(mockRawMove).toHaveBeenNthCalledWith(1, { x: -100, y: -99, f: 6000 });
  //   expect(mockRawMove).toHaveBeenNthCalledWith(2, { x: -98, y: -99, f: 6000 });
  //   expect(mockRawMove).toHaveBeenNthCalledWith(3, { x: -98, y: -96, f: 6000 });
  //   expect(mockRawMove).toHaveBeenNthCalledWith(4, { x: -100, y: -96, f: 6000 });
  //   expect(mockRawMove).toHaveBeenNthCalledWith(5, { x: -100, y: -99, f: 6000 });
  //   expect(mockRawMove).toHaveBeenNthCalledWith(6, { x: 0, y: 0, f: 6000 });
  //   expect(mockRawEndLineCheckMode).toBeCalledTimes(1);
  //   expect(mockRawSetLaser).toBeCalledTimes(2);
  //   expect(mockRawSetLaser).toHaveBeenNthCalledWith(1, { on: true, s: 30 });
  //   expect(mockRawSetLaser).toHaveBeenNthCalledWith(2, { on: false, s: 0 });
  //   expect(mockRawSet24V).toBeCalledTimes(2);
  //   expect(mockRawSet24V).toHaveBeenNthCalledWith(1, true);
  //   expect(mockRawSet24V).toHaveBeenNthCalledWith(2, false);
  //   expect(mockRawLooseMotor).toBeCalledTimes(1);
  //   expect(mockEndRawMode).toBeCalledTimes(1);
  //   expect(mockKick).toBeCalledTimes(1);
  //   expect(mockRawSetWaterPump).not.toBeCalled();
  // });

  // test('framing with promark & swiftray', async () => {
  //   const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
  //   const { container } = render(<FrameButton />);
  //   mockGetDevice.mockResolvedValue({ device: { model: 'fpm1', version: '12.34.56' } });
  //   await act(async () => fireEvent.click(container.querySelector('div[class*="button"]')));
  //   expect(mockGetDevice).toBeCalledTimes(1);
  //   expect(mockCheckDeviceStatus).toBeCalledTimes(1);
  //   expect(mockFetchFraming).toBeCalledTimes(1);
  //   expect(mockStartFraming).toBeCalledTimes(1)
  //   expect(mockStopFraming).not.toBeCalled();
  //   expect(mockConsoleLog).toBeCalledTimes(2);
  //   expect(mockConsoleLog).toHaveBeenNthCalledWith(1, 'start framing upload');
  //   expect(mockConsoleLog).toHaveBeenNthCalledWith(2, 'start framing');
  //   await act(async () => fireEvent.click(container.querySelector('div[class*="button"]')));
  //   expect(mockStopFraming).toBeCalledTimes(1);
  //   expect(mockStartFraming).toBeCalledTimes(1);
  //   // make sure original framing is not called
  //   expect(mockRead).not.toBeCalled();
  //   expect(mockRawHome).not.toBeCalled();
  // });
});
