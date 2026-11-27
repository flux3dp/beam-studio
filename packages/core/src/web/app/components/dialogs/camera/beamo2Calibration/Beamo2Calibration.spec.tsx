import React, { useEffect } from 'react';

import { act, fireEvent, render, waitFor } from '@testing-library/react';

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

const mockDoorClosedWrapper = jest.fn();
const mockDoor = { keepClosed: true };

jest.mock(
  '@core/app/actions/camera/preview-helper/DoorChecker',
  () =>
    class {
      destroy = jest.fn();
      doorClosedWrapper = (...args: any[]) => mockDoorClosedWrapper(...args);
      get keepClosed() {
        return mockDoor.keepClosed;
      }
    },
);

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

/** machine calls in the order they happened */
let machineCalls: string[];
const mockMachine = { controlMode: '', info: { model: 'fbm2', st_id: 0 } };
const mockDoBeamo2Calibration = jest.fn();
const mockGetReport = jest.fn();

jest.mock('@core/helpers/device-master', () => ({
  get currentControlMode() {
    return mockMachine.controlMode;
  },
  get currentDevice() {
    return { info: mockMachine.info };
  },
  doBeamo2Calibration: (...args: any[]) => mockDoBeamo2Calibration(...args),
  endSubTask: async () => {
    machineCalls.push('endSubTask');
    mockMachine.controlMode = '';
  },
  getReport: (...args: any[]) => mockGetReport(...args),
  rawLooseMotor: async () => {
    machineCalls.push('rawLooseMotor');
  },
}));

const mockAutoSolvePnP = jest.fn();

jest.mock(
  './autoSolvePnP',
  () =>
    (...args: any[]) =>
      mockAutoSolvePnP(...args),
);

const mockMoveLaserHead = jest.fn();

jest.mock(
  '../common/moveLaserHead',
  () =>
    (...args: any[]) =>
      mockMoveLaserHead(...args),
);

const mockShowHighResidualAlert = jest.fn();

jest.mock(
  '../common/showHighResidualAlert',
  () =>
    (...args: any[]) =>
      mockShowHighResidualAlert(...args),
);

jest.mock('../common/downloadCalibrationFile', () => jest.fn());

const mockShowNotEnoughMarksAlert = jest.fn();

jest.mock(
  '../common/showNotEnoughMarksAlert',
  () =>
    (...args: any[]) =>
      mockShowNotEnoughMarksAlert(...args),
);

jest.mock('../common/SolvePnP', () => ({ initialPoints }: any) => (
  <div data-testid="solve-pnp">{JSON.stringify(initialPoints ?? null)}</div>
));
jest.mock('../common/ChArUco', () => ({ onNext }: any) => (
  <div data-testid="charuco">
    <button onClick={onNext} type="button">
      charuco-next
    </button>
  </div>
));
jest.mock('../common/CheckPnP', () => ({ onBack }: any) => (
  <div data-testid="check-pnp">
    <button onClick={onBack} type="button">
      check-back
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
// like the real one: runs the process it is given, then onNext; two processing steps in a row share the instance
jest.mock('../common/ProcessingDialog', () => ({ onNext, process }: any) => {
  useEffect(() => {
    process().then(() => onNext());
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [process]);

  return <div data-testid="processing" />;
});

import Beamo2Calibration from './Beamo2Calibration';

const t = i18n.lang.calibration;
const quadrant = (v: any) => ({ bottomLeft: v, bottomRight: v, topLeft: v, topRight: v });
const solved = {
  highResidual: false,
  imgPoints: quadrant([
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ]),
  rms: 0.4,
  rvecs: quadrant([[1]]),
  success: true,
  tvecs: quadrant([[2]]),
};
const mockOnClose = jest.fn();
const mockOnSwitchToAdvanced = jest.fn();

const renderDialog = (isAdvanced = false) =>
  render(
    <Beamo2Calibration
      currentData={isAdvanced ? undefined : { d: [[0]], k: [[1]] }}
      isAdvanced={isAdvanced}
      onClose={mockOnClose}
      onSwitchToAdvanced={mockOnSwitchToAdvanced}
    />,
  );

/** click a PUT_PAPER button and wait until the processing steps that follow are over */
const runAutoStep = async (utils: ReturnType<typeof render>, button = t.start_engrave, calls = 1) => {
  await act(async () => {
    fireEvent.click(utils.getByText(button));
  });
  await waitFor(() => expect(mockAutoSolvePnP).toHaveBeenCalledTimes(calls));
  await waitFor(() => expect(utils.queryByTestId('processing')).not.toBeInTheDocument());
};

describe('Beamo2Calibration automatic solve step', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    machineCalls = [];
    mockMachine.controlMode = '';
    mockMachine.info = { model: 'fbm2', st_id: 0 };
    mockCheckDeviceStatus.mockImplementation(async (info) => {
      machineCalls.push(`checkDeviceStatus st_id=${info.st_id}`);

      return true;
    });
    mockDoor.keepClosed = true;
    // like the real one: the poll starts once the head is in place
    mockDoorClosedWrapper.mockImplementation(async (callback) => {
      const res = await callback();

      mockDoor.keepClosed = true;

      return res;
    });
    // the head is moved in raw mode and, with shouldKeepPosition, stays there
    mockMoveLaserHead.mockImplementation(async (_position, options) => {
      if (options?.shouldKeepPosition) mockMachine.controlMode = 'raw';

      return true;
    });
    mockGetReport.mockResolvedValue({ st_id: 0 });
    mockAutoSolvePnP.mockResolvedValue(solved);
    mockSolvePnPCalculate.mockResolvedValue({ data: { rvec: [[3]], tvec: [[4]] }, success: true });
  });

  afterEach(() => jest.restoreAllMocks());

  test('engraves, solves automatically and reaches the check step without a drag screen', async () => {
    const utils = renderDialog();

    expect(utils.getByTestId('title')).toHaveTextContent(t.put_paper);
    await runAutoStep(utils);

    expect(mockDoBeamo2Calibration).toHaveBeenCalledTimes(1);
    expect(mockMoveLaserHead).toHaveBeenCalledWith(undefined, { shouldKeepPosition: true });
    expect(mockAutoSolvePnP).toHaveBeenCalledWith({ d: [[0]], k: [[1]] }, expect.any(Function));
    // SOLVE_OTHER_PNP: the five regions that share marks between quadrants
    expect(mockSolvePnPCalculate).toHaveBeenCalledTimes(5);
    expect(utils.getByTestId('check-pnp')).toBeInTheDocument();
    expect(utils.queryByTestId('solve-pnp')).not.toBeInTheDocument();
    expect(mockPopUpError).not.toHaveBeenCalled();
  });

  test('releases the machine and refreshes its status before starting again from the paper step', async () => {
    const utils = renderDialog();

    await runAutoStep(utils);
    fireEvent.click(utils.getByText('check-back'));
    expect(utils.getByTestId('title')).toHaveTextContent(t.put_paper);

    // the discovery broadcast still says raw mode; the machine itself reports idle
    mockMachine.info.st_id = -10;
    machineCalls = [];
    await runAutoStep(utils, i18n.lang.global.skip, 2);

    expect(machineCalls).toEqual(['rawLooseMotor', 'endSubTask', 'checkDeviceStatus st_id=0']);
    expect(mockDoBeamo2Calibration).toHaveBeenCalledTimes(1);
    expect(utils.getByTestId('check-pnp')).toBeInTheDocument();
  });

  test('leaves the status alone on the first visit of the paper step', async () => {
    mockMachine.info.st_id = 0;

    const utils = renderDialog();

    await runAutoStep(utils);

    expect(machineCalls).toEqual(['checkDeviceStatus st_id=0']);
    expect(mockGetReport).not.toHaveBeenCalled();
  });

  test('falls back to the manual steps with a backend that lacks the commands', async () => {
    mockAutoSolvePnP.mockResolvedValue({ reason: 'UNSUPPORTED', success: false });

    const utils = renderDialog();

    await runAutoStep(utils);

    expect(utils.getByTestId('title')).toHaveTextContent(t.solve_pnp_title);
    expect(mockPopUpError).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(utils.getByText(t.next));
    });
    expect(utils.getByTestId('solve-pnp')).toBeInTheDocument();
  });

  test('reports missing marks with the number found and returns to the paper step', async () => {
    mockAutoSolvePnP.mockResolvedValue({ matched: 14, reason: 'NOT_ENOUGH_MARKS', success: false });

    const utils = renderDialog();

    await runAutoStep(utils);

    expect(mockPopUpError).not.toHaveBeenCalled();
    expect(mockShowNotEnoughMarksAlert).toHaveBeenCalledWith(expect.objectContaining({ found: 14, total: 16 }));
    expect(utils.getByTestId('title')).toHaveTextContent(t.put_paper);
  });

  test('the manual steps chosen after missing marks start each quadrant from the points that were found', async () => {
    const quadrant = (offset: number) => Array.from({ length: 4 }, (_, i) => [offset + i, i * 10]);
    const imgPoints = {
      bottomLeft: quadrant(20),
      bottomRight: quadrant(30),
      topLeft: quadrant(0),
      topRight: quadrant(10),
    };

    mockAutoSolvePnP.mockResolvedValue({ imgPoints, matched: 14, reason: 'NOT_ENOUGH_MARKS', success: false });

    const utils = renderDialog();

    await runAutoStep(utils);
    act(() => mockShowNotEnoughMarksAlert.mock.calls[0][0].onManual());
    expect(utils.getByTestId('title')).toHaveTextContent(t.solve_pnp_title);

    await act(async () => {
      fireEvent.click(utils.getByText(t.next));
    });
    // the first manual step is the top-left quadrant
    expect(utils.getByTestId('solve-pnp')).toHaveTextContent(JSON.stringify(imgPoints.topLeft));
  });

  test('the manual steps find the corners themselves when this run predicted no points, whatever an earlier run found', async () => {
    mockAutoSolvePnP
      .mockResolvedValueOnce(solved)
      .mockResolvedValue({ matched: 2, reason: 'NOT_ENOUGH_MARKS', success: false });

    const utils = renderDialog();

    await runAutoStep(utils);
    fireEvent.click(utils.getByText('check-back'));
    await runAutoStep(utils, i18n.lang.global.skip, 2);
    act(() => mockShowNotEnoughMarksAlert.mock.calls[0][0].onManual());
    await act(async () => {
      fireEvent.click(utils.getByText(t.next));
    });

    expect(utils.getByTestId('solve-pnp')).toHaveTextContent('null');
  });

  test('high residual in basic mode: continue, or release the machine and switch to advanced mode', async () => {
    mockAutoSolvePnP.mockResolvedValue({ ...solved, highResidual: true, rms: 1.8 });

    const utils = renderDialog();

    await runAutoStep(utils);

    expect(utils.getByTestId('title')).toHaveTextContent(t.put_paper);

    const options = mockShowHighResidualAlert.mock.calls[0][0];

    expect(options.isAdvanced).toBe(false);

    machineCalls = [];
    mockOnSwitchToAdvanced.mockImplementation(() => machineCalls.push('onSwitchToAdvanced'));
    await act(async () => options.onSwitchToAdvanced());
    // released first: the advanced flow moves the head as soon as it opens
    expect(machineCalls).toEqual(['rawLooseMotor', 'endSubTask', 'onSwitchToAdvanced']);

    await act(async () => options.onContinue());
    await waitFor(() => expect(utils.getByTestId('check-pnp')).toBeInTheDocument());
  });

  test('high residual in advanced mode offers the pattern capture again', async () => {
    mockAutoSolvePnP.mockResolvedValue({ ...solved, highResidual: true, rms: 1.8 });

    const utils = renderDialog(true);

    expect(utils.getByTestId('title')).toHaveTextContent(t.put_charuco);
    await act(async () => {
      fireEvent.click(utils.getByText(t.next));
    });
    fireEvent.click(utils.getByText('charuco-next'));
    await runAutoStep(utils);

    const options = mockShowHighResidualAlert.mock.calls[0][0];

    expect(options.isAdvanced).toBe(true);
    act(() => options.onRecapture());
    expect(utils.getByTestId('title')).toHaveTextContent(t.put_charuco);
  });

  test('never stays on the spinner when the step throws', async () => {
    mockAutoSolvePnP.mockRejectedValue(new Error('socket closed'));

    const utils = renderDialog();

    await runAutoStep(utils);

    expect(mockPopUpError).toHaveBeenCalledWith({ message: t.failed_to_calibrate_with_pictures });
    expect(utils.getByTestId('title')).toHaveTextContent(t.put_paper);
  });

  test('drops the capture and shoots again from the first exposure when the door was opened during it', async () => {
    const seen: boolean[] = [];

    mockAutoSolvePnP.mockImplementationOnce(async (_params, isCancelled) => {
      seen.push(isCancelled());
      mockDoor.keepClosed = false;
      seen.push(isCancelled());

      return { reason: 'CANCELLED', success: false };
    });

    const utils = renderDialog();

    await runAutoStep(utils, t.start_engrave, 2);

    expect(seen).toEqual([false, true]);
    expect(mockDoorClosedWrapper).toHaveBeenCalledTimes(2);
    expect(mockMoveLaserHead).toHaveBeenCalledTimes(2);
    expect(utils.getByTestId('check-pnp')).toBeInTheDocument();
    expect(mockPopUpError).not.toHaveBeenCalled();
  });

  test('returns to the paper step when the door stays open', async () => {
    mockDoorClosedWrapper.mockResolvedValue(false);

    const utils = renderDialog();

    await act(async () => {
      fireEvent.click(utils.getByText(t.start_engrave));
    });
    await waitFor(() => expect(utils.getByTestId('title')).toHaveTextContent(t.put_paper));

    expect(mockAutoSolvePnP).not.toHaveBeenCalled();
    expect(mockPopUpError).not.toHaveBeenCalled();
  });
});
