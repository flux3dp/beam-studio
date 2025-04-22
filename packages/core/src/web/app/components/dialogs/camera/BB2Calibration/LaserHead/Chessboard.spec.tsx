import React, { act } from 'react';

import { fireEvent, render } from '@testing-library/react';

import Chessboard from './Chessboard';
import i18n from '@mocks/@core/helpers/i18n';
import { sprintf } from 'sprintf-js';

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

const mockUseLiveFeed = jest.fn();

jest.mock(
  '../../common/useLiveFeed',
  () =>
    (...args) =>
      mockUseLiveFeed(...args),
);

const mockWriteFileDialog = jest.fn();

jest.mock('@core/implementations/dialog', () => ({
  writeFileDialog: (...args) => mockWriteFileDialog(...args),
}));

jest.mock('../../common/ExposureSlider', () => ({ exposureSetting, onChange }: any) => (
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
const mockConsoleError = jest.fn();
const mockPauseLive = jest.fn();
const mockRestartLive = jest.fn();
const mockBlob = new Blob();

const tCali = i18n.lang.calibration;

describe('test Chessboard', () => {
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
      <Chessboard chessboard={[7, 7]} onClose={jest.fn()} onNext={jest.fn()} updateParam={jest.fn()} />,
    );

    expect(baseElement).toMatchSnapshot();
    expect(mockUseLiveFeed).toHaveBeenCalledTimes(1);
    expect(baseElement).toMatchSnapshot();
  });

  test('handleCalibrate success and go next', async () => {
    const mockUpdateParam = jest.fn();
    const mockOnNext = jest.fn();
    const { baseElement } = render(
      <Chessboard chessboard={[7, 7]} onClose={jest.fn()} onNext={mockOnNext} updateParam={mockUpdateParam} />,
    );

    const mockRes = {
      data: { d: 'd', k: 'k', ret: 1, rvec: 'rvec', tvec: 'tvec' },
      success: true,
    };

    mockCalibrateChessboard.mockResolvedValue(mockRes);
    await act(() => fireEvent.click(baseElement.querySelector('button.ant-btn-primary')));
    expect(mockOpenNonstopProgress).toHaveBeenCalled();
    expect(mockOpenNonstopProgress).toHaveBeenCalledWith({
      id: 'calibrate-chessboard',
      message: tCali.calibrating,
    });
    expect(mockPauseLive).toHaveBeenCalled();
    expect(mockCalibrateChessboard).toHaveBeenCalledTimes(1);
    expect(mockCalibrateChessboard).toHaveBeenCalledWith(mockBlob, 0, [7, 7]);
    expect(mockPopUp).toHaveBeenCalledTimes(1);
    expect(mockPopUp).toHaveBeenCalledWith({
      buttons: [
        {
          className: 'primary',
          label: tCali.next,
          onClick: expect.any(Function),
        },
        {
          label: tCali.cancel,
          onClick: expect.any(Function),
        },
      ],
      message: sprintf(tCali.calibrate_chessboard_success_msg, tCali.res_excellent, 1),
    });

    const { buttons } = mockPopUp.mock.calls[0][0];

    await act(() => buttons[0].onClick());
    expect(mockUpdateParam).toHaveBeenCalled();
    expect(mockUpdateParam).toHaveBeenCalledWith(mockRes.data);
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
      <Chessboard chessboard={[7, 7]} onClose={jest.fn()} onNext={mockOnNext} updateParam={mockUpdateParam} />,
    );

    const mockRes = {
      data: { d: 'd', k: 'k', ret: 5, rvec: 'rvec', tvec: 'tvec' },
      success: true,
    };

    mockCalibrateChessboard.mockResolvedValue(mockRes);
    await act(() => fireEvent.click(baseElement.querySelector('button.ant-btn-primary')));
    expect(mockOpenNonstopProgress).toHaveBeenCalled();
    expect(mockOpenNonstopProgress).toHaveBeenCalledWith({
      id: 'calibrate-chessboard',
      message: tCali.calibrating,
    });
    expect(mockPauseLive).toHaveBeenCalled();
    expect(mockCalibrateChessboard).toHaveBeenCalledTimes(1);
    expect(mockCalibrateChessboard).toHaveBeenCalledWith(mockBlob, 0, [7, 7]);
    expect(mockPopUp).toHaveBeenCalledTimes(1);
    expect(mockPopUp).toHaveBeenCalledWith({
      buttons: [
        {
          className: 'primary',
          label: tCali.next,
          onClick: expect.any(Function),
        },
        {
          label: tCali.cancel,
          onClick: expect.any(Function),
        },
      ],
      message: sprintf(tCali.calibrate_chessboard_success_msg, tCali.res_poor, 5),
    });

    const { buttons } = mockPopUp.mock.calls[0][0];

    await act(() => buttons[1].onClick());
    expect(mockUpdateParam).not.toHaveBeenCalled();
    expect(mockOnNext).not.toHaveBeenCalled();
    expect(mockPopById).toHaveBeenCalledTimes(1);
    expect(mockPopById).toHaveBeenCalledWith('calibrate-chessboard');
  });

  test('download chessboard img', async () => {
    const mockUpdateParam = jest.fn();
    const mockOnNext = jest.fn();
    const { baseElement } = render(
      <Chessboard chessboard={[7, 7]} onClose={jest.fn()} onNext={mockOnNext} updateParam={mockUpdateParam} />,
    );

    fireEvent.click(baseElement.querySelector('#download'));
    expect(mockWriteFileDialog).toHaveBeenCalledTimes(1);
  });

  test('calibration failed', async () => {
    const mockUpdateParam = jest.fn();
    const mockOnNext = jest.fn();
    const { baseElement } = render(
      <Chessboard chessboard={[7, 7]} onClose={jest.fn()} onNext={mockOnNext} updateParam={mockUpdateParam} />,
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
      message: `${tCali.failed_to_calibrate_chessboard} reason`,
    });
    expect(mockRestartLive).toHaveBeenCalledTimes(1);
  });
});
