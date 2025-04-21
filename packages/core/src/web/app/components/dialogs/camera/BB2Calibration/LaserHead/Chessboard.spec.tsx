import React, { act } from 'react';

import { fireEvent, render } from '@testing-library/react';

import Chessboard from './Chessboard';

const mockPopUp = jest.fn();
const mockPopUpError = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUp: (...args) => mockPopUp(...args),
  popUpError: (...args) => mockPopUpError(...args),
}));

const mockOpenNonstopProgress = jest.fn();
const mockPopById = jest.fn();

jest.mock('@core/app/actions/progress-caller', () => ({
  openNonstopProgress: (...args) => mockOpenNonstopProgress(...args),
  popById: (...args) => mockPopById(...args),
}));

const mockCalibrateChessboard = jest.fn();

jest.mock('@core/helpers/camera-calibration-helper', () => ({
  calibrateChessboard: (...args) => mockCalibrateChessboard(...args),
}));

const mockUseCamera = jest.fn();

jest.mock(
  '../common/useCamera',
  () =>
    (...args) =>
      mockUseCamera(...args),
);

jest.mock('@core/helpers/useI18n', () => () => ({
  calibration: {
    calibrate_chessboard_success_msg: 'calibrate_chessboard_success_msg %s %f',
    calibrating: 'calibrating',
    camera_calibration: 'camera_calibration',
    cancel: 'cancel',
    failed_to_calibrate_chessboard: 'failed_to_calibrate_chessboard',
    next: 'next',
    put_chessboard_1: 'put_chessboard_1',
    put_chessboard_2: 'put_chessboard_2',
    put_chessboard_3: 'put_chessboard_3',
    res_average: 'res_average',
    res_excellent: 'res_excellent',
    res_poor: 'res_poor',
  },
  monitor: {
    download: 'download',
  },
}));

const mockWriteFileDialog = jest.fn();

jest.mock('@core/implementations/dialog', () => ({
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
        exposureSetting: { max: 650, min: 250, step: 1, value: 300 },
        handleTakePicture: mockHandleTakePicture,
        setExposureSetting: mockSetExposureSetting,
      };
    });
    global.URL.createObjectURL = mockCreateObjectURL;
    console.error = mockConsoleError;
  });

  it('should render correctly', () => {
    const { baseElement } = render(
      <Chessboard chessboard={[7, 7]} onClose={jest.fn()} onNext={jest.fn()} updateParam={jest.fn()} />,
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
    render(<Chessboard chessboard={[7, 7]} onClose={jest.fn()} onNext={jest.fn()} updateParam={jest.fn()} />);
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
      <Chessboard chessboard={[7, 7]} onClose={jest.fn()} onNext={mockOnNext} updateParam={mockUpdateParam} />,
    );
    const mockBlob = new Blob();

    act(() => handleImg(mockBlob));

    const mockRes = {
      data: { d: 'd', k: 'k', ret: 1, rvec: 'rvec', tvec: 'tvec' },
      success: true,
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
      buttons: [
        {
          className: 'primary',
          label: 'next',
          onClick: expect.any(Function),
        },
        {
          label: 'cancel',
          onClick: expect.any(Function),
        },
      ],
      message: 'calibrate_chessboard_success_msg res_excellent 1',
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
      <Chessboard chessboard={[7, 7]} onClose={jest.fn()} onNext={mockOnNext} updateParam={mockUpdateParam} />,
    );
    const mockBlob = new Blob();

    act(() => handleImg(mockBlob));

    const mockRes = {
      data: { d: 'd', k: 'k', ret: 5, rvec: 'rvec', tvec: 'tvec' },
      success: true,
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
      buttons: [
        {
          className: 'primary',
          label: 'next',
          onClick: expect.any(Function),
        },
        {
          label: 'cancel',
          onClick: expect.any(Function),
        },
      ],
      message: 'calibrate_chessboard_success_msg res_poor 5',
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
      <Chessboard chessboard={[7, 7]} onClose={jest.fn()} onNext={mockOnNext} updateParam={mockUpdateParam} />,
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
      <Chessboard chessboard={[7, 7]} onClose={jest.fn()} onNext={mockOnNext} updateParam={mockUpdateParam} />,
    );
    const mockBlob = new Blob();

    act(() => handleImg(mockBlob));

    const mockRes = {
      data: { reason: 'reason' },
      success: false,
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
