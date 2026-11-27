import React, { useEffect } from 'react';

import { act, fireEvent, render, waitFor } from '@testing-library/react';

import progressCaller from '@core/app/actions/progress-caller';
import { adorPnPPoints } from '@core/app/constants/fisheyeCameraConstants';
import i18n from '@core/helpers/i18n';

const mockPopUp = jest.fn();
const mockPopUpError = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUp: (...args: any[]) => mockPopUp(...args),
  popUpError: (...args: any[]) => mockPopUpError(...args),
}));

jest.mock('@core/app/actions/progress-caller', () => ({
  openNonstopProgress: jest.fn(),
  popById: jest.fn(),
  update: jest.fn(),
}));

const mockSolvePnPCalculate = jest.fn();
const mockUpdateData = jest.fn();
const mockExtrinsicRegression = jest.fn();

jest.mock('@core/helpers/api/camera-calibration', () => ({
  cameraCalibrationApi: {
    extrinsicRegression: (...args: any[]) => mockExtrinsicRegression(...args),
    solvePnPCalculate: (...args: any[]) => mockSolvePnPCalculate(...args),
    updateData: (...args: any[]) => mockUpdateData(...args),
  },
}));

const mockSetFisheyeConfig = jest.fn();

jest.mock('@core/helpers/camera-calibration-helper', () => ({
  setFisheyeConfig: (...args: any[]) => mockSetFisheyeConfig(...args),
}));

const mockCheckDeviceStatus = jest.fn();

jest.mock(
  '@core/helpers/check-device-status',
  () =>
    (...args: any[]) =>
      mockCheckDeviceStatus(...args),
);

const mockDoAdorCalibrationV2 = jest.fn();

jest.mock('@core/helpers/device-master', () => ({
  currentDevice: { info: { model: 'ado1' } },
  doAdorCalibrationV2: (...args: any[]) => mockDoAdorCalibrationV2(...args),
}));

const mockAutoLocateMarks = jest.fn();

jest.mock(
  '../common/autoLocateMarks',
  () =>
    (...args: any[]) =>
      mockAutoLocateMarks(...args),
);

const mockShowHighResidualAlert = jest.fn();

jest.mock(
  '../common/showHighResidualAlert',
  () =>
    (...args: any[]) =>
      mockShowHighResidualAlert(...args),
);

const mockShowNotEnoughMarksAlert = jest.fn();

jest.mock(
  '../common/showNotEnoughMarksAlert',
  () =>
    (...args: any[]) =>
      mockShowNotEnoughMarksAlert(...args),
);

jest.mock('../common/checkpointData', () => ({ applyCheckpointData: jest.fn() }));
jest.mock('../common/downloadCalibrationFile', () => ({ downloadCalibrationFile: jest.fn() }));
jest.mock('../common/ChArUco', () => () => <div data-testid="charuco" />);
jest.mock('./CalibrateChessBoard', () => () => <div data-testid="chessboard" />);
jest.mock('../common/SolvePnP', () => ({ dh, initialPoints, onNext }: any) => (
  <div data-testid="solve-pnp">
    dh:{dh} initial:{JSON.stringify(initialPoints ?? null)}
    <button onClick={() => onNext([[7]], [[8]])} type="button">
      solve-next
    </button>
  </div>
));
jest.mock('./StepElevate', () => ({ onBack, onNext }: any) => (
  <div data-testid="elevate">
    <button onClick={onBack} type="button">
      elevate-back
    </button>
    <button onClick={onNext} type="button">
      elevate-next
    </button>
  </div>
));
jest.mock('../common/Instruction', () => ({ buttons, title }: any) => (
  <div data-testid="instruction">
    <div data-testid="title">{title}</div>
    {buttons.map(({ label, onClick }: any) => (
      <button key={label} onClick={onClick} type="button">
        {label}
      </button>
    ))}
  </div>
));
// the real dialog runs process again when its parent re-renders; once is what the steps rely on
jest.mock('../common/ProcessingDialog', () => ({ process }: any) => {
  useEffect(() => {
    process();
    // eslint-disable-next-line hooks/exhaustive-deps
  }, []);

  return <div data-testid="processing" />;
});

const mockGetMaterialHeight = jest.fn();
const mockPrepareToTakePicture = jest.fn();
const mockSaveCheckPoint = jest.fn();

jest.mock('./utils', () => ({
  getMaterialHeight: (...args: any[]) => mockGetMaterialHeight(...args),
  prepareToTakePicture: (...args: any[]) => mockPrepareToTakePicture(...args),
  saveCheckPoint: (...args: any[]) => mockSaveCheckPoint(...args),
}));

import AdorCalibration from './AdorCalibration';

const t = i18n.lang.calibration;
const points = Array.from({ length: 8 }, (_, i) => [i, i * 10] as [number, number]);
const located = { highResidual: false, points, rms: 0.05, success: true };
const mockOnClose = jest.fn();
const mockOnSwitchToAdvanced = jest.fn();

const renderDialog = () =>
  render(
    <AdorCalibration
      currentData={{ d: [[0]], k: [[1]], levelingData: { A: 0 }, refHeight: 3, source: 'device' }}
      onClose={mockOnClose}
      onSwitchToAdvanced={mockOnSwitchToAdvanced}
    />,
  );

/** click a button that leads into an automatic step and wait until that step has finished */
const runAutoStep = async (utils: ReturnType<typeof render>, button: string, calls: number, isLast = false) => {
  await act(async () => {
    fireEvent.click(utils.getByText(button));
  });
  await waitFor(() => expect(mockAutoLocateMarks).toHaveBeenCalledTimes(calls));

  // after the save the dialog is closed by its owner; here onClose is a mock and the step stays mounted
  if (isLast) await waitFor(() => expect(mockOnClose).toHaveBeenCalledWith(true));
  else await waitFor(() => expect(utils.queryByTestId('processing')).not.toBeInTheDocument());
};

describe('AdorCalibration automatic solve steps', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    mockCheckDeviceStatus.mockResolvedValue(true);
    // material at 10 for the first height, 25 once it is raised; refHeight 3 -> dh 7 and 22
    mockGetMaterialHeight.mockResolvedValueOnce(10).mockResolvedValue(25);
    mockAutoLocateMarks.mockResolvedValue(located);
    mockSolvePnPCalculate
      .mockResolvedValueOnce({ data: { rvec: [[1]], tvec: [[2]] }, success: true })
      .mockResolvedValue({ data: { rvec: [[3]], tvec: [[4]] }, success: true });
    mockExtrinsicRegression.mockResolvedValue({
      data: { rvec_polyfit: [[5]], tvec_polyfit: [[6]] },
      success: true,
    });
    mockSetFisheyeConfig.mockResolvedValue({ status: 'ok' });
  });

  afterEach(() => jest.restoreAllMocks());

  test('finds the marks at both heights and saves, with no drag screen', async () => {
    const utils = renderDialog();

    await runAutoStep(utils, t.start_engrave, 1);

    const [options] = mockAutoLocateMarks.mock.calls[0];

    expect(options.refPoints).toBe(adorPnPPoints);
    expect(options.rMax).toBe(0.2);
    expect(options.exposureRounds).toEqual([[250], [125, 450]]);
    expect(options.cameraIndex).toBeUndefined();
    expect(mockSolvePnPCalculate).toHaveBeenLastCalledWith(7, points, adorPnPPoints);
    expect(mockSaveCheckPoint).toHaveBeenCalledTimes(1);
    expect(mockUpdateData).toHaveBeenCalledWith(expect.objectContaining({ heights: [7], rvecs: [[[1]]] }));
    expect(utils.getByTestId('elevate')).toBeInTheDocument();

    await runAutoStep(utils, 'elevate-next', 2, true);

    expect(mockDoAdorCalibrationV2).toHaveBeenCalledTimes(2);
    expect(mockPrepareToTakePicture).toHaveBeenCalledTimes(2);
    expect(mockSolvePnPCalculate).toHaveBeenLastCalledWith(22, points, adorPnPPoints);
    expect(mockExtrinsicRegression).toHaveBeenCalledWith([[[1]], [[3]]], [[[2]], [[4]]], [7, 22]);
    await waitFor(() => expect(mockOnClose).toHaveBeenCalledWith(true));
    expect(mockSetFisheyeConfig).toHaveBeenCalledWith(
      expect.objectContaining({ refHeight: 3, rvec_polyfit: [[5]], tvec_polyfit: [[6]], v: 2 }),
    );
    expect(utils.queryByTestId('solve-pnp')).not.toBeInTheDocument();
    expect(mockPopUpError).not.toHaveBeenCalled();
  });

  test('closing the dialog during the second capture stops it and saves nothing', async () => {
    let finish: (value: unknown) => void = () => {};

    mockAutoLocateMarks.mockResolvedValueOnce(located).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );

    const utils = renderDialog();

    await runAutoStep(utils, t.start_engrave, 1);
    await act(async () => {
      fireEvent.click(utils.getByText('elevate-next'));
    });
    await waitFor(() => expect(mockAutoLocateMarks).toHaveBeenCalledTimes(2));

    const [{ isCancelled }] = mockAutoLocateMarks.mock.calls[1];

    expect(isCancelled()).toBe(false);
    utils.unmount();
    expect(isCancelled()).toBe(true);

    await act(async () => finish(located));

    expect(mockExtrinsicRegression).not.toHaveBeenCalled();
    expect(mockSetFisheyeConfig).not.toHaveBeenCalled();
    expect(mockPopUpError).not.toHaveBeenCalled();
  });

  test('Continue Anyway after the dialog was closed saves nothing', async () => {
    mockAutoLocateMarks.mockResolvedValue({ ...located, highResidual: true, rms: 0.4 });

    const utils = renderDialog();

    await runAutoStep(utils, t.start_engrave, 1);

    const options = mockShowHighResidualAlert.mock.calls[0][0];

    utils.unmount();
    await act(async () => options.onContinue());

    expect(mockSaveCheckPoint).not.toHaveBeenCalled();
    expect(mockUpdateData).not.toHaveBeenCalled();
  });

  test('a failure at the second height returns to the elevate step and keeps the first pose', async () => {
    mockAutoLocateMarks
      .mockResolvedValueOnce(located)
      .mockResolvedValueOnce({ matched: 7, reason: 'NOT_ENOUGH_MARKS', success: false });

    const utils = renderDialog();

    await runAutoStep(utils, t.start_engrave, 1);
    await runAutoStep(utils, 'elevate-next', 2);

    expect(mockShowNotEnoughMarksAlert).toHaveBeenCalledWith(expect.objectContaining({ found: 7, total: 8 }));
    expect(utils.getByTestId('elevate')).toBeInTheDocument();
    expect(mockExtrinsicRegression).not.toHaveBeenCalled();

    // engraving again at the raised height finishes the calibration with the first pose still there
    await runAutoStep(utils, 'elevate-next', 3, true);
    expect(mockExtrinsicRegression).toHaveBeenCalledWith([[[1]], [[3]]], [[[2]], [[4]]], [7, 22]);
  });

  test('returns to the elevate step when the parameters cannot be saved', async () => {
    mockSetFisheyeConfig.mockResolvedValueOnce({ status: 'error' });
    mockGetMaterialHeight.mockReset().mockResolvedValueOnce(10).mockResolvedValueOnce(25).mockResolvedValue(30);

    const utils = renderDialog();

    await runAutoStep(utils, t.start_engrave, 1);
    await runAutoStep(utils, 'elevate-next', 2);

    expect(mockPopUpError).toHaveBeenCalledTimes(1);
    expect(mockOnClose).not.toHaveBeenCalled();
    expect(utils.getByTestId('elevate')).toBeInTheDocument();

    // the retry at another height replaces the pose that was not saved
    await runAutoStep(utils, 'elevate-next', 3, true);
    expect(mockExtrinsicRegression).toHaveBeenLastCalledWith([[[1]], [[3]]], [[[2]], [[4]]], [7, 27]);
  });

  test('a failure at the first height returns to the paper step', async () => {
    mockAutoLocateMarks.mockResolvedValue({ matched: 5, reason: 'NOT_ENOUGH_MARKS', success: false });

    const utils = renderDialog();

    await runAutoStep(utils, t.start_engrave, 1);

    expect(mockShowNotEnoughMarksAlert).toHaveBeenCalledWith(expect.objectContaining({ found: 5, total: 8 }));
    expect(utils.getByTestId('title')).toHaveTextContent(t.put_paper);
    expect(mockSaveCheckPoint).not.toHaveBeenCalled();
  });

  test('the manual step chosen at the first height starts from the found points, and the second height is automatic again', async () => {
    const initialPoints = Array.from({ length: 8 }, (_, i) => [i, i * 10]);

    mockAutoLocateMarks
      .mockResolvedValueOnce({ initialPoints, matched: 6, reason: 'NOT_ENOUGH_MARKS', success: false })
      .mockResolvedValue(located);

    const utils = renderDialog();

    await runAutoStep(utils, t.start_engrave, 1);
    act(() => mockShowNotEnoughMarksAlert.mock.calls[0][0].onManual());
    fireEvent.click(utils.getByText(t.next));
    expect(utils.getByTestId('solve-pnp')).toHaveTextContent(`initial:${JSON.stringify(initialPoints)}`);

    await act(async () => {
      fireEvent.click(utils.getByText('solve-next'));
    });
    await waitFor(() => expect(utils.getByTestId('elevate')).toBeInTheDocument());
    await runAutoStep(utils, 'elevate-next', 2, true);
    // the first pose is the manual one (7 / 8); the second is the first automatic solve of this run (1 / 2)
    expect(mockExtrinsicRegression).toHaveBeenCalledWith([[[7]], [[1]]], [[[8]], [[2]]], [7, 22]);
  });

  test('the manual step chosen at the second height starts from the found points and keeps the first pose', async () => {
    const initialPoints = Array.from({ length: 8 }, (_, i) => [i + 1, i * 5]);

    mockAutoLocateMarks
      .mockResolvedValueOnce(located)
      .mockResolvedValueOnce({ initialPoints, matched: 7, reason: 'NOT_ENOUGH_MARKS', success: false });

    const utils = renderDialog();

    await runAutoStep(utils, t.start_engrave, 1);
    await runAutoStep(utils, 'elevate-next', 2);
    act(() => mockShowNotEnoughMarksAlert.mock.calls[0][0].onManual());
    expect(utils.getByTestId('solve-pnp')).toHaveTextContent(`initial:${JSON.stringify(initialPoints)}`);

    await act(async () => {
      fireEvent.click(utils.getByText('solve-next'));
    });
    await waitFor(() => expect(mockOnClose).toHaveBeenCalledWith(true));
    expect(mockExtrinsicRegression).toHaveBeenCalledWith([[[1]], [[7]]], [[[2]], [[8]]], [7, 22]);
  });

  test('falls back to the manual steps at both heights with a backend that lacks the commands', async () => {
    mockAutoLocateMarks.mockResolvedValue({ reason: 'UNSUPPORTED', success: false });

    const utils = renderDialog();

    await runAutoStep(utils, t.start_engrave, 1);
    expect(utils.getByTestId('title')).toHaveTextContent(t.solve_pnp_title);
    expect(mockPopUpError).not.toHaveBeenCalled();

    fireEvent.click(utils.getByText(t.next));
    expect(utils.getByTestId('solve-pnp')).toHaveTextContent('dh:7');
    await act(async () => {
      fireEvent.click(utils.getByText('solve-next'));
    });
    expect(utils.getByTestId('elevate')).toBeInTheDocument();
    // Back from the elevate step leads to the manual solve again
    fireEvent.click(utils.getByText('elevate-back'));
    expect(utils.getByTestId('solve-pnp')).toHaveTextContent('dh:7');
    await act(async () => {
      fireEvent.click(utils.getByText('solve-next'));
    });

    // the second height is manual too: the automatic step is not tried again
    await act(async () => {
      fireEvent.click(utils.getByText('elevate-next'));
    });
    await waitFor(() => expect(utils.getByTestId('solve-pnp')).toHaveTextContent('dh:22'));
    expect(mockAutoLocateMarks).toHaveBeenCalledTimes(1);

    await act(async () => {
      fireEvent.click(utils.getByText('solve-next'));
    });
    expect(mockExtrinsicRegression).toHaveBeenCalledWith([[[7]], [[7]]], [[[8]], [[8]]], [7, 22]);
    await waitFor(() => expect(mockOnClose).toHaveBeenCalledWith(true));
  });

  test('Back from the elevate step leads to the paper step after an automatic first pose', async () => {
    const utils = renderDialog();

    await runAutoStep(utils, t.start_engrave, 1);
    fireEvent.click(utils.getByText('elevate-back'));

    expect(utils.getByTestId('title')).toHaveTextContent(t.put_paper);
  });

  test('rests on the engraving step while the high-residual warning is open, and continues when asked', async () => {
    mockAutoLocateMarks.mockResolvedValue({ ...located, highResidual: true, rms: 0.4 });

    const utils = renderDialog();

    await runAutoStep(utils, t.start_engrave, 1);

    expect(utils.getByTestId('title')).toHaveTextContent(t.put_paper);
    expect(mockSaveCheckPoint).not.toHaveBeenCalled();

    const first = mockShowHighResidualAlert.mock.calls[0][0];

    expect(first.isAdvanced).toBe(false);
    expect(first.onSwitchToAdvanced).toBe(mockOnSwitchToAdvanced);
    await act(async () => first.onContinue());
    expect(utils.getByTestId('elevate')).toBeInTheDocument();

    // second height: the warning rests on the elevate step
    await runAutoStep(utils, 'elevate-next', 2);
    expect(utils.getByTestId('elevate')).toBeInTheDocument();
    expect(mockExtrinsicRegression).not.toHaveBeenCalled();
    await act(async () => mockShowHighResidualAlert.mock.calls[1][0].onContinue());
    await waitFor(() => expect(mockOnClose).toHaveBeenCalledWith(true));
  });

  test('never stays on the spinner when the step throws', async () => {
    mockAutoLocateMarks.mockRejectedValue(new Error('socket closed'));

    const utils = renderDialog();

    await runAutoStep(utils, t.start_engrave, 1);

    expect(mockPopUpError).toHaveBeenCalledWith({ message: t.failed_to_calibrate_with_pictures });
    expect(utils.getByTestId('title')).toHaveTextContent(t.put_paper);
  });

  test('closes the progress when the first pose cannot be saved', async () => {
    mockSaveCheckPoint.mockRejectedValueOnce(new Error('disk full'));

    const utils = renderDialog();

    await runAutoStep(utils, t.start_engrave, 1);

    expect(mockPopUpError).toHaveBeenCalledWith({ message: t.failed_to_calibrate_with_pictures });
    expect(utils.getByTestId('title')).toHaveTextContent(t.put_paper);
    expect(progressCaller.popById).toHaveBeenCalledTimes(
      (progressCaller.openNonstopProgress as jest.Mock).mock.calls.length,
    );
  });
});
