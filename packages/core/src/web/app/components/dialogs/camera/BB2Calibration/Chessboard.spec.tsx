import React, { act } from 'react';
import { fireEvent, render } from '@testing-library/react';

import Chessboard from './Chessboard';

const mockPopUp = jest.fn();
const mockPopUpError = jest.fn();
jest.mock('app/actions/alert-caller', () => ({
  popUp: (...args) => mockPopUp(...args),
  popUpError: (...args) => mockPopUpError(...args),
}));

const mockOpenNonstopProgress = jest.fn();
const mockPopById = jest.fn();
jest.mock('app/actions/progress-caller', () => ({
  openNonstopProgress: (...args) => mockOpenNonstopProgress(...args),
  popById: (...args) => mockPopById(...args),
}));

const mockCalibrateChessboard = jest.fn();
jest.mock('helpers/camera-calibration-helper', () => ({
  calibrateChessboard: (...args) => mockCalibrateChessboard(...args),
}));

const mockUseCamera = jest.fn();
jest.mock(
  '../common/useCamera',
  () =>
    (...args) =>
      mockUseCamera(...args)
);

jest.mock('helpers/useI18n', () => () => ({
  calibration: {
    calibrating: 'calibrating',
    failed_to_calibrate_chessboard: 'failed_to_calibrate_chessboard',
    camera_calibration: 'camera_calibration',
    put_chessboard_1: 'put_chessboard_1',
    put_chessboard_2: 'put_chessboard_2',
    put_chessboard_3: 'put_chessboard_3',
    next: 'next',
    cancel: 'cancel',
    calibrate_chessboard_success_msg: 'calibrate_chessboard_success_msg %s %f',
    res_excellent: 'res_excellent',
    res_average: 'res_average',
    res_poor: 'res_poor',
  },
  monitor: {
    download: 'download',
  },
}));

const mockWriteFileDialog = jest.fn();
jest.mock('implementations/dialog', () => ({
  writeFileDialog: (...args) => mockWriteFileDialog(...args),
}));

jest.mock('../common/ExposureSlider', () => ({ exposureSetting, onChange }: any) => (
  <div>
    <h1>Mock ExposureSlider</h1>
    <p>min: {exposureSetting.min}</p>
    <p>max: {exposureSetting.max}</p>
    <p>step: {exposureSetting.step}</p>
    <input onChange={() => onChange()} value={exposureSetting.value} />
  </div>
));

jest.useFakeTimers();
jest.spyOn(global, 'setTimeout');
jest.spyOn(global, 'clearTimeout');

const mockHandleTakePicture = jest.fn();
const mockSetExposureSetting = jest.fn();
const mockCreateObjectURL = jest.fn();
let handleImg: (imgBlob: Blob) => boolean;
const mockConsoleError = jest.fn();

describe('test Chessboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCamera.mockImplementation((fn) => {
      handleImg = fn;
      return {
        exposureSetting: { min: 250, max: 650, step: 1, value: 300 },
        setExposureSetting: mockSetExposureSetting,
        handleTakePicture: mockHandleTakePicture,
      };
    });
    global.URL.createObjectURL = mockCreateObjectURL;
    console.error = mockConsoleError;
  });

  it('should render correctly', () => {
    const { baseElement } = render(
      <Chessboard
        chessboard={[7, 7]}
        updateParam={jest.fn()}
        onNext={jest.fn()}
        onClose={jest.fn()}
      />
    );
    expect(baseElement).toMatchSnapshot();
    expect(mockUseCamera).toBeCalledTimes(1);
    mockCreateObjectURL.mockReturnValue('mock-url');
    const mockBlob = new Blob();
    act(() => handleImg(mockBlob));
    expect(mockCreateObjectURL).toBeCalledTimes(1);
    expect(baseElement).toMatchSnapshot();
  });

  test('camera live', async () => {
    render(
      <Chessboard
        chessboard={[7, 7]}
        updateParam={jest.fn()}
        onNext={jest.fn()}
        onClose={jest.fn()}
      />
    );
    expect(setTimeout).toBeCalled();
    expect(mockHandleTakePicture).not.toBeCalled();
    await act(async () => {
      jest.runAllTimers();
    });
    expect(mockHandleTakePicture).toBeCalled();
  });

  test('handleCalibrate success and go next', async () => {
    const mockUpdateParam = jest.fn();
    const mockOnNext = jest.fn();
    const { baseElement } = render(
      <Chessboard
        chessboard={[7, 7]}
        updateParam={mockUpdateParam}
        onNext={mockOnNext}
        onClose={jest.fn()}
      />
    );
    const mockBlob = new Blob();
    act(() => handleImg(mockBlob));
    const mockRes = {
      success: true,
      data: { ret: 1, k: 'k', d: 'd', rvec: 'rvec', tvec: 'tvec' },
    };
    mockCalibrateChessboard.mockResolvedValue(mockRes);
    await act(() => fireEvent.click(baseElement.querySelector('button.ant-btn-primary')));
    expect(mockOpenNonstopProgress).toBeCalled();
    expect(mockOpenNonstopProgress).toBeCalledWith({
      id: 'calibrate-chessboard',
      message: 'calibrating',
    });
    expect(clearTimeout).toBeCalled();
    expect(mockCalibrateChessboard).toBeCalledTimes(1);
    expect(mockCalibrateChessboard).toBeCalledWith(mockBlob, 0, [7, 7]);
    expect(mockPopUp).toBeCalledTimes(1);
    expect(mockPopUp).toBeCalledWith({
      message: 'calibrate_chessboard_success_msg res_excellent 1',
      buttons: [
        {
          label: 'next',
          onClick: expect.any(Function),
          className: 'primary',
        },
        {
          label: 'cancel',
          onClick: expect.any(Function),
        },
      ],
    });
    const { buttons } = mockPopUp.mock.calls[0][0];
    await act(() => buttons[0].onClick());
    expect(mockUpdateParam).toBeCalled();
    expect(mockUpdateParam).toBeCalledWith(mockRes.data);
    expect(mockOnNext).toBeCalled();
    expect(mockHandleTakePicture).not.toBeCalled();
    expect(mockPopUpError).not.toBeCalled();
    expect(mockPopById).toBeCalledTimes(1);
    expect(mockPopById).toBeCalledWith('calibrate-chessboard');
  });

  test('handleCalibrate success and cancel', async () => {
    const mockUpdateParam = jest.fn();
    const mockOnNext = jest.fn();
    const { baseElement } = render(
      <Chessboard
        chessboard={[7, 7]}
        updateParam={mockUpdateParam}
        onNext={mockOnNext}
        onClose={jest.fn()}
      />
    );
    const mockBlob = new Blob();
    act(() => handleImg(mockBlob));
    const mockRes = {
      success: true,
      data: { ret: 5, k: 'k', d: 'd', rvec: 'rvec', tvec: 'tvec' },
    };
    mockCalibrateChessboard.mockResolvedValue(mockRes);
    await act(() => fireEvent.click(baseElement.querySelector('button.ant-btn-primary')));
    expect(mockOpenNonstopProgress).toBeCalled();
    expect(mockOpenNonstopProgress).toBeCalledWith({
      id: 'calibrate-chessboard',
      message: 'calibrating',
    });
    expect(clearTimeout).toBeCalled();
    expect(mockCalibrateChessboard).toBeCalledTimes(1);
    expect(mockCalibrateChessboard).toBeCalledWith(mockBlob, 0, [7, 7]);
    expect(mockPopUp).toBeCalledTimes(1);
    expect(mockPopUp).toBeCalledWith({
      message: 'calibrate_chessboard_success_msg res_poor 5',
      buttons: [
        {
          label: 'next',
          onClick: expect.any(Function),
          className: 'primary',
        },
        {
          label: 'cancel',
          onClick: expect.any(Function),
        },
      ],
    });
    const { buttons } = mockPopUp.mock.calls[0][0];
    await act(() => buttons[1].onClick());
    expect(mockUpdateParam).not.toBeCalled();
    expect(mockOnNext).not.toBeCalled();
    expect(mockPopById).toBeCalledTimes(1);
    expect(mockPopById).toBeCalledWith('calibrate-chessboard');
  });

  test('download chessboard img', async () => {
    const mockUpdateParam = jest.fn();
    const mockOnNext = jest.fn();
    const { baseElement } = render(
      <Chessboard
        chessboard={[7, 7]}
        updateParam={mockUpdateParam}
        onNext={mockOnNext}
        onClose={jest.fn()}
      />
    );
    const mockBlob = new Blob();
    act(() => handleImg(mockBlob));
    fireEvent.click(baseElement.querySelector('#download'));
    expect(mockWriteFileDialog).toBeCalledTimes(1);
  });

  test('calibration failed', async () => {
    const mockUpdateParam = jest.fn();
    const mockOnNext = jest.fn();
    const { baseElement } = render(
      <Chessboard
        chessboard={[7, 7]}
        updateParam={mockUpdateParam}
        onNext={mockOnNext}
        onClose={jest.fn()}
      />
    );
    const mockBlob = new Blob();
    act(() => handleImg(mockBlob));
    const mockRes = {
      success: false,
      data: { reason: 'reason' },
    };
    mockCalibrateChessboard.mockResolvedValue(mockRes);
    await act(() => fireEvent.click(baseElement.querySelector('button.ant-btn-primary')));
    expect(mockOpenNonstopProgress).toBeCalled();
    expect(mockOpenNonstopProgress).toBeCalledWith({
      id: 'calibrate-chessboard',
      message: 'calibrating',
    });
    expect(mockPopById).toBeCalledTimes(1);
    expect(mockPopById).toBeCalledWith('calibrate-chessboard');
    expect(mockUpdateParam).not.toBeCalled();
    expect(mockOnNext).not.toBeCalled();
    expect(mockPopUpError).toBeCalledTimes(1);
    expect(mockPopUpError).toBeCalledWith({
      message: 'failed_to_calibrate_chessboard reason',
    });
    expect(mockHandleTakePicture).toBeCalledTimes(1);
  });
});
