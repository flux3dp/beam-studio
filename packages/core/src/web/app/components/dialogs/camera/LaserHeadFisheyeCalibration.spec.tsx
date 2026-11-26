import React, { useEffect } from 'react';

import { act, fireEvent, render, waitFor } from '@testing-library/react';

import { bb2PnPPoints } from '@core/app/constants/fisheyeCameraConstants';
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

jest.mock('@core/helpers/api/camera-calibration', () => ({
  cameraCalibrationApi: { solvePnPCalculate: (...args: any[]) => mockSolvePnPCalculate(...args) },
}));

jest.mock('@core/helpers/camera-calibration-helper', () => ({ setFisheyeConfig: jest.fn() }));

const mockCheckDeviceStatus = jest.fn();

jest.mock(
  '@core/helpers/check-device-status',
  () =>
    (...args: any[]) =>
      mockCheckDeviceStatus(...args),
);

const mockDoBB2Calibration = jest.fn();
const mockDoHexa2Calibration = jest.fn();
const mockDevice = { info: { model: 'fbb2' } };

jest.mock('@core/helpers/device-master', () => ({
  get currentDevice() {
    return mockDevice;
  },
  doBB2Calibration: (...args: any[]) => mockDoBB2Calibration(...args),
  doHexa2Calibration: (...args: any[]) => mockDoHexa2Calibration(...args),
}));

const mockAutoLocateMarks = jest.fn();

jest.mock(
  './common/autoLocateMarks',
  () =>
    (...args: any[]) =>
      mockAutoLocateMarks(...args),
);

const mockMoveLaserHead = jest.fn();

jest.mock(
  './common/moveLaserHead',
  () =>
    (...args: any[]) =>
      mockMoveLaserHead(...args),
);

const mockShowHighResidualAlert = jest.fn();

jest.mock(
  './common/showHighResidualAlert',
  () =>
    (...args: any[]) =>
      mockShowHighResidualAlert(...args),
);

const mockShowNotEnoughMarksAlert = jest.fn();

jest.mock(
  './common/showNotEnoughMarksAlert',
  () =>
    (...args: any[]) =>
      mockShowNotEnoughMarksAlert(...args),
);

jest.mock('./common/downloadCalibrationFile', () => jest.fn());
jest.mock('./common/ChArUco', () => ({ onNext }: any) => (
  <div data-testid="charuco">
    <button onClick={onNext} type="button">
      charuco-next
    </button>
  </div>
));
jest.mock('./common/SolvePnP', () => ({ initialPoints }: any) => (
  <div data-testid="solve-pnp">{JSON.stringify(initialPoints ?? null)}</div>
));
jest.mock('./common/CheckPnP', () => ({ onBack }: any) => (
  <div data-testid="check-pnp">
    <button onClick={onBack} type="button">
      check-back
    </button>
  </div>
));
jest.mock('./common/Instruction', () => ({ buttons, title }: any) => (
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
jest.mock('./common/ProcessingDialog', () => ({ process }: any) => {
  useEffect(() => {
    process();
    // eslint-disable-next-line hooks/exhaustive-deps
  }, []);

  return <div data-testid="processing" />;
});

import LaserHeadFisheyeCalibration from './LaserHeadFisheyeCalibration';

const t = i18n.lang.calibration;
const points = Array.from({ length: 8 }, (_, i) => [i, i * 10] as [number, number]);
const mockOnClose = jest.fn();
const mockOnSwitchToAdvanced = jest.fn();

const renderDialog = (isAdvanced = false) =>
  render(
    <LaserHeadFisheyeCalibration
      currentData={{ d: [[0]], k: [[1]] }}
      isAdvanced={isAdvanced}
      onClose={mockOnClose}
      onSwitchToAdvanced={mockOnSwitchToAdvanced}
    />,
  );

/** PUT_PAPER → engrave (or skip) → the automatic step has run */
const runAutoStep = async (utils: ReturnType<typeof render>, button = t.start_engrave) => {
  await act(async () => {
    fireEvent.click(utils.getByText(button));
  });
  await waitFor(() => expect(mockAutoLocateMarks).toHaveBeenCalled());
  await waitFor(() => expect(utils.queryByTestId('processing')).not.toBeInTheDocument());
};

describe('LaserHeadFisheyeCalibration automatic solve step', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockDevice.info.model = 'fbb2';
    mockCheckDeviceStatus.mockResolvedValue(true);
    mockMoveLaserHead.mockResolvedValue(true);
    mockAutoLocateMarks.mockResolvedValue({ highResidual: false, points, rms: 0.05, success: true });
    mockSolvePnPCalculate.mockResolvedValue({ data: { rvec: [[1]], tvec: [[2]] }, success: true });
  });

  afterEach(() => jest.restoreAllMocks());

  test('engraves, locates the 8 marks with the laser-head camera and goes to the check step', async () => {
    const utils = renderDialog();

    expect(utils.getByTestId('title')).toHaveTextContent(t.put_paper);
    await runAutoStep(utils);

    expect(mockDoBB2Calibration).toHaveBeenCalledTimes(1);
    expect(mockDoHexa2Calibration).not.toHaveBeenCalled();
    expect(mockMoveLaserHead).toHaveBeenCalledTimes(1);

    const [options] = mockAutoLocateMarks.mock.calls[0];

    expect(options.cameraIndex).toBe(0);
    expect(options.refPoints).toBe(bb2PnPPoints);
    expect(options.rMax).toBe(0.2);
    expect(options.exposureRounds).toEqual([[250], [100, 500]]);
    expect(options.params).toEqual({ d: [[0]], k: [[1]] });
    expect(mockSolvePnPCalculate).toHaveBeenCalledWith(0, points, bb2PnPPoints);
    expect(utils.getByTestId('check-pnp')).toBeInTheDocument();
    expect(utils.queryByTestId('solve-pnp')).not.toBeInTheDocument();
    expect(mockPopUpError).not.toHaveBeenCalled();
  });

  test('uses the HEXA RF task on fhx2rf and no task at all on Skip', async () => {
    mockDevice.info.model = 'fhx2rf';

    const first = renderDialog();

    await runAutoStep(first);
    expect(mockDoHexa2Calibration).toHaveBeenCalledTimes(1);
    expect(mockDoBB2Calibration).not.toHaveBeenCalled();
    first.unmount();

    jest.clearAllMocks();
    mockCheckDeviceStatus.mockResolvedValue(true);
    mockMoveLaserHead.mockResolvedValue(true);

    await runAutoStep(renderDialog(), i18n.lang.global.skip);
    expect(mockDoHexa2Calibration).not.toHaveBeenCalled();
    expect(mockAutoLocateMarks).toHaveBeenCalledTimes(1);
  });

  test('returns from the check step to the paper step when the pose was found automatically', async () => {
    const utils = renderDialog();

    await runAutoStep(utils);
    fireEvent.click(utils.getByText('check-back'));

    expect(utils.getByTestId('title')).toHaveTextContent(t.put_paper);
  });

  test('falls back to the manual steps with a backend that lacks the commands', async () => {
    mockAutoLocateMarks.mockResolvedValue({ reason: 'UNSUPPORTED', success: false });

    const utils = renderDialog();

    await runAutoStep(utils);

    expect(utils.getByTestId('title')).toHaveTextContent(t.solve_pnp_title);
    expect(mockPopUpError).not.toHaveBeenCalled();
    expect(mockSolvePnPCalculate).not.toHaveBeenCalled();

    fireEvent.click(utils.getByText(t.next));
    expect(utils.getByTestId('solve-pnp')).toBeInTheDocument();
  });

  test('reports missing marks with the number found and returns to the paper step', async () => {
    mockAutoLocateMarks.mockResolvedValue({ matched: 6, reason: 'NOT_ENOUGH_MARKS', success: false });

    const utils = renderDialog();

    await runAutoStep(utils);

    expect(mockPopUpError).not.toHaveBeenCalled();
    expect(mockShowNotEnoughMarksAlert).toHaveBeenCalledWith(expect.objectContaining({ found: 6, total: 8 }));
    expect(utils.getByTestId('title')).toHaveTextContent(t.put_paper);
    expect(mockSolvePnPCalculate).not.toHaveBeenCalled();
  });

  test('the manual steps chosen after missing marks start from the points that were found', async () => {
    const initialPoints = Array.from({ length: 8 }, (_, i) => [i, i * 10]);

    mockAutoLocateMarks.mockResolvedValue({ initialPoints, matched: 6, reason: 'NOT_ENOUGH_MARKS', success: false });

    const utils = renderDialog();

    await runAutoStep(utils);
    act(() => mockShowNotEnoughMarksAlert.mock.calls[0][0].onManual());
    expect(utils.getByTestId('title')).toHaveTextContent(t.solve_pnp_title);

    fireEvent.click(utils.getByText(t.next));
    expect(utils.getByTestId('solve-pnp')).toHaveTextContent(JSON.stringify(initialPoints));
  });

  test('rests on the paper step while the high-residual warning is open, and continues when asked', async () => {
    mockAutoLocateMarks.mockResolvedValue({ highResidual: true, points, rms: 0.4, success: true });

    const utils = renderDialog();

    await runAutoStep(utils);

    expect(utils.getByTestId('title')).toHaveTextContent(t.put_paper);
    expect(mockShowHighResidualAlert).toHaveBeenCalledTimes(1);

    const options = mockShowHighResidualAlert.mock.calls[0][0];

    expect(options.isAdvanced).toBe(false);
    expect(options.onSwitchToAdvanced).toBe(mockOnSwitchToAdvanced);

    act(() => options.onContinue());
    expect(utils.getByTestId('check-pnp')).toBeInTheDocument();
  });

  test('offers the pattern capture again in advanced mode', async () => {
    mockAutoLocateMarks.mockResolvedValue({ highResidual: true, points, rms: 0.4, success: true });

    const utils = renderDialog(true);

    // advanced mode opens on the pattern steps
    expect(utils.getByTestId('title')).toHaveTextContent(t.put_charuco);
    fireEvent.click(utils.getByText(t.next));
    fireEvent.click(utils.getByText('charuco-next'));
    await runAutoStep(utils);

    const options = mockShowHighResidualAlert.mock.calls[0][0];

    expect(options.isAdvanced).toBe(true);
    act(() => options.onRecapture());
    expect(utils.getByTestId('title')).toHaveTextContent(t.put_charuco);
  });

  test('never stays on the spinner when the step throws', async () => {
    mockSolvePnPCalculate.mockResolvedValue({ success: false });

    const utils = renderDialog();

    await runAutoStep(utils);

    expect(mockPopUpError).toHaveBeenCalledWith({ message: t.failed_to_calibrate_with_pictures });
    expect(utils.getByTestId('title')).toHaveTextContent(t.put_paper);

    mockAutoLocateMarks.mockRejectedValue(new Error('socket closed'));
    await runAutoStep(utils);
    expect(mockPopUpError).toHaveBeenCalledTimes(2);
    expect(utils.getByTestId('title')).toHaveTextContent(t.put_paper);
  });

  test('does not start when the machine is busy or the head cannot move', async () => {
    mockCheckDeviceStatus.mockResolvedValue(false);

    const utils = renderDialog();

    await act(async () => {
      fireEvent.click(utils.getByText(t.start_engrave));
    });
    expect(mockDoBB2Calibration).not.toHaveBeenCalled();

    mockCheckDeviceStatus.mockResolvedValue(true);
    mockMoveLaserHead.mockResolvedValue(false);
    await act(async () => {
      fireEvent.click(utils.getByText(t.start_engrave));
    });
    expect(mockAutoLocateMarks).not.toHaveBeenCalled();
    expect(utils.getByTestId('title')).toHaveTextContent(t.put_paper);
  });
});
