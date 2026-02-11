import React, { act } from 'react';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import Calibration from './Calibration';
import i18n from '@mocks/@core/helpers/i18n';

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

const mockUseLiveFeed = jest.fn();

jest.mock(
  './useLiveFeed',
  () =>
    (...args) =>
      mockUseLiveFeed(...args),
);

const mockWriteFileDialog = jest.fn();

jest.mock('@core/implementations/dialog', () => ({
  writeFileDialog: (...args) => mockWriteFileDialog(...args),
}));

jest.mock('./ExposureSlider', () => ({ exposureSetting, onChange }: any) => (
  <div>
    <h1>Mock ExposureSlider</h1>
    <p>min: {exposureSetting.min}</p>
    <p>max: {exposureSetting.max}</p>
    <p>step: {exposureSetting.step}</p>
    <input onChange={() => onChange()} value={exposureSetting.value} />
  </div>
));

const mockCalibrateChessboard = jest.fn();
const mockDetectChAruCo = jest.fn();
const mockCalibrateCamera = jest.fn();

jest.mock('@core/helpers/api/camera-calibration', () => ({
  cameraCalibrationApi: {
    calibrateCamera: (...args) => mockCalibrateCamera(...args),
    calibrateChessboard: (...args) => mockCalibrateChessboard(...args),
    detectChAruCo: (...args) => mockDetectChAruCo(...args),
  },
}));

const mockHandleCalibrationResult = jest.fn();

jest.mock(
  './handleCalibrationResult',
  () =>
    (...args) =>
      mockHandleCalibrationResult(...args),
);

jest.useFakeTimers();
jest.spyOn(global, 'setTimeout');
jest.spyOn(global, 'clearTimeout');

const mockHandleTakePicture = jest.fn();
const mockSetExposureSetting = jest.fn();
const mockConsoleError = jest.fn();
const mockPauseLive = jest.fn();
const mockRestartLive = jest.fn();
const mockBlob = new Blob();

const tCali = i18n.lang.calibration;

describe('test Calibration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLiveFeed.mockImplementation(() => {
      return {
        exposureSetting: { max: 650, min: 250, step: 1, value: 300 },
        handleTakePicture: mockHandleTakePicture,
        img: { blob: mockBlob, url: 'mock-url' },
        pauseLive: mockPauseLive,
        restartLive: mockRestartLive,
        setExposureSetting: mockSetExposureSetting,
      };
    });
    console.error = mockConsoleError;
  });

  it('should render correctly', () => {
    const { baseElement } = render(
      <Calibration
        chessboard={[7, 7]}
        description={['step1', 'step2', 'step3']}
        onClose={jest.fn()}
        onNext={jest.fn()}
        updateParam={jest.fn()}
      />,
    );

    expect(baseElement).toMatchSnapshot();
    expect(mockUseLiveFeed).toHaveBeenCalledTimes(1);
    expect(baseElement).toMatchSnapshot();
  });

  test('handleCalibrate success and go next', async () => {
    const mockUpdateParam = jest.fn();
    const mockOnNext = jest.fn();
    const { baseElement } = render(
      <Calibration chessboard={[7, 7]} onClose={jest.fn()} onNext={mockOnNext} updateParam={mockUpdateParam} />,
    );

    const mockRes = {
      data: { d: 'd', k: 'k', ret: 1, rvec: 'rvec', tvec: 'tvec' },
      success: true,
    };

    mockCalibrateChessboard.mockResolvedValue(mockRes);
    mockHandleCalibrationResult.mockResolvedValue(true);
    await act(() => fireEvent.click(baseElement.querySelector('button.ant-btn-primary')));
    expect(mockOpenNonstopProgress).toHaveBeenCalled();
    expect(mockOpenNonstopProgress).toHaveBeenCalledWith({
      id: 'calibrate-chessboard',
      message: tCali.calibrating,
    });
    expect(mockPauseLive).toHaveBeenCalled();
    expect(mockCalibrateChessboard).toHaveBeenCalledTimes(1);
    expect(mockCalibrateChessboard).toHaveBeenCalledWith(mockBlob, 0, [7, 7]);
    expect(mockHandleCalibrationResult).toHaveBeenCalledTimes(1);
    expect(mockHandleCalibrationResult).toHaveBeenLastCalledWith(1);
    expect(mockUpdateParam).toHaveBeenCalled();
    expect(mockUpdateParam).toHaveBeenCalledWith(mockRes.data);
    expect(mockOnNext).toHaveBeenCalled();
    expect(mockHandleTakePicture).not.toHaveBeenCalled();
    expect(mockPopUpError).not.toHaveBeenCalled();
    expect(mockPopById).toHaveBeenCalledTimes(1);
    expect(mockPopById).toHaveBeenCalledWith('calibrate-chessboard');
  });

  test('Calibrate with ChArUco', async () => {
    const mockUpdateParam = jest.fn();
    const mockOnNext = jest.fn();
    const { baseElement } = render(
      <Calibration
        charuco={[15, 10]}
        chessboard={[7, 7]}
        onClose={jest.fn()}
        onNext={mockOnNext}
        updateParam={mockUpdateParam}
      />,
    );

    const mockRes = { data: { reason: 'reason' }, success: false };

    mockCalibrateChessboard.mockResolvedValue(mockRes);
    mockDetectChAruCo.mockResolvedValue({ imgp: 'imgp', objp: 'objp', success: true });
    mockCalibrateCamera.mockResolvedValue({ d: 'd', k: 'k', ret: 1, rvec: 'rvec', success: true, tvec: 'tvec' });
    mockHandleCalibrationResult.mockResolvedValue(true);
    await act(() => fireEvent.click(baseElement.querySelector('button.ant-btn-primary')));
    expect(mockOpenNonstopProgress).toHaveBeenCalled();
    expect(mockOpenNonstopProgress).toHaveBeenCalledWith({ id: 'calibrate-chessboard', message: tCali.calibrating });
    expect(mockPauseLive).toHaveBeenCalled();
    expect(mockCalibrateChessboard).toHaveBeenCalledTimes(1);
    expect(mockCalibrateChessboard).toHaveBeenCalledWith(mockBlob, 0, [7, 7]);
    expect(mockDetectChAruCo).toHaveBeenCalledTimes(1);
    expect(mockDetectChAruCo).toHaveBeenCalledWith(mockBlob, 15, 10);
    expect(mockCalibrateCamera).toHaveBeenCalledTimes(1);
    expect(mockCalibrateCamera).toHaveBeenCalledWith(['objp'], ['imgp'], [expect.any(Number), expect.any(Number)]);
    expect(mockHandleCalibrationResult).toHaveBeenCalledTimes(1);
    expect(mockHandleCalibrationResult).toHaveBeenLastCalledWith(1);
    expect(mockUpdateParam).toHaveBeenCalled();
    expect(mockUpdateParam).toHaveBeenCalledWith({ d: 'd', k: 'k', ret: 1, rvec: 'rvec', tvec: 'tvec' });
    expect(mockOnNext).toHaveBeenCalled();
    expect(mockHandleTakePicture).not.toHaveBeenCalled();
    expect(mockPopUpError).not.toHaveBeenCalled();
    expect(mockPopById).toHaveBeenCalledTimes(1);
    expect(mockPopById).toHaveBeenCalledWith('calibrate-chessboard');
  });

  test('handleCalibrate success and cancel', async () => {
    const mockUpdateParam = jest.fn();
    const mockOnNext = jest.fn();
    const { baseElement } = render(
      <Calibration chessboard={[7, 7]} onClose={jest.fn()} onNext={mockOnNext} updateParam={mockUpdateParam} />,
    );

    const mockRes = {
      data: { d: 'd', k: 'k', ret: 5, rvec: 'rvec', tvec: 'tvec' },
      success: true,
    };

    mockCalibrateChessboard.mockResolvedValue(mockRes);
    mockHandleCalibrationResult.mockResolvedValue(false);
    await act(() => fireEvent.click(baseElement.querySelector('button.ant-btn-primary')));
    expect(mockOpenNonstopProgress).toHaveBeenCalled();
    expect(mockOpenNonstopProgress).toHaveBeenCalledWith({
      id: 'calibrate-chessboard',
      message: tCali.calibrating,
    });
    expect(mockPauseLive).toHaveBeenCalled();
    expect(mockCalibrateChessboard).toHaveBeenCalledTimes(1);
    expect(mockCalibrateChessboard).toHaveBeenCalledWith(mockBlob, 0, [7, 7]);
    expect(mockHandleCalibrationResult).toHaveBeenCalledTimes(1);
    expect(mockHandleCalibrationResult).toHaveBeenLastCalledWith(5);
    expect(mockUpdateParam).not.toHaveBeenCalled();
    expect(mockOnNext).not.toHaveBeenCalled();
    expect(mockPopById).toHaveBeenCalledTimes(1);
    expect(mockPopById).toHaveBeenCalledWith('calibrate-chessboard');
  });

  test('download chessboard img', async () => {
    const mockUpdateParam = jest.fn();
    const mockOnNext = jest.fn();
    const { baseElement } = render(
      <Calibration chessboard={[7, 7]} onClose={jest.fn()} onNext={mockOnNext} updateParam={mockUpdateParam} />,
    );

    const img = baseElement.querySelector('img[alt="Chessboard"]');

    fireEvent.contextMenu(img);
    await waitFor(() => {
      expect(screen.getByText(i18n.lang.monitor.download)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(i18n.lang.monitor.download));
    expect(mockWriteFileDialog).toHaveBeenCalledTimes(1);
  });

  test('calibration failed', async () => {
    const mockUpdateParam = jest.fn();
    const mockOnNext = jest.fn();
    const { baseElement } = render(
      <Calibration chessboard={[7, 7]} onClose={jest.fn()} onNext={mockOnNext} updateParam={mockUpdateParam} />,
    );

    const mockRes = { data: { reason: 'reason' }, success: false };

    mockCalibrateChessboard.mockResolvedValue(mockRes);
    await act(() => fireEvent.click(baseElement.querySelector('button.ant-btn-primary')));
    expect(mockOpenNonstopProgress).toHaveBeenCalled();
    expect(mockOpenNonstopProgress).toHaveBeenCalledWith({
      id: 'calibrate-chessboard',
      message: tCali.calibrating,
    });
    expect(mockPopById).toHaveBeenCalledTimes(1);
    expect(mockPopById).toHaveBeenCalledWith('calibrate-chessboard');
    expect(mockUpdateParam).not.toHaveBeenCalled();
    expect(mockOnNext).not.toHaveBeenCalled();
    expect(mockPopUpError).toHaveBeenCalledTimes(1);
    expect(mockPopUpError).toHaveBeenCalledWith({
      message: tCali.failed_to_calibrate_chessboard,
    });
    expect(mockRestartLive).toHaveBeenCalledTimes(1);
  });
});
