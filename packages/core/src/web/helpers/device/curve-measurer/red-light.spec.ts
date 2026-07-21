const mockPopUp = jest.fn();
const mockPopUpError = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUp: (...args: any[]) => mockPopUp(...args),
  popUpError: (...args: any[]) => mockPopUpError(...args),
}));

const mockOpenNonstopProgress = jest.fn();
const mockPopById = jest.fn();
const mockUpdate = jest.fn();

jest.mock('@core/app/actions/progress-caller', () => ({
  openNonstopProgress: (...args: any[]) => mockOpenNonstopProgress(...args),
  popById: (...args: any[]) => mockPopById(...args),
  update: (...args: any[]) => mockUpdate(...args),
}));

jest.mock('@core/helpers/check-device-status', () => jest.fn().mockResolvedValue(true));

const mockCheckTaskAlive = jest.fn();
const mockTakeReferenceZ = jest.fn();
const mockEnterRedLaserMeasureMode = jest.fn();
const mockMeasureZ = jest.fn();
const mockEndSubTask = jest.fn();
let mockControlMode = 'red_laser_measure';

jest.mock('@core/helpers/device-master', () => ({
  checkTaskAlive: (...args: any[]) => mockCheckTaskAlive(...args),
  get currentControlMode() {
    return mockControlMode;
  },
  endSubTask: (...args: any[]) => mockEndSubTask(...args),
  enterRedLaserMeasureMode: (...args: any[]) => mockEnterRedLaserMeasureMode(...args),
  measureZ: (...args: any[]) => mockMeasureZ(...args),
  takeReferenceZ: (...args: any[]) => mockTakeReferenceZ(...args),
}));

// alertConstants is a constants module — imported directly (see unit-test skill core rule).

import langEn from '@core/app/lang/en';

import RedLightCurveMeasurer from './red-light';

const device = { model: 'fbb2' } as any;
const t = langEn.curve_engraving;

// Drive showTakeReferenceDialog's popUp by invoking the onConfirm callback captured by the mock.
const runConfirm = async () => {
  const [{ onConfirm }] = mockPopUp.mock.calls[0];

  await onConfirm();
};

describe('RedLightCurveMeasurer.showTakeReferenceDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockControlMode = 'red_laser_measure';
    mockCheckTaskAlive.mockResolvedValue(true);
  });

  test('Row 1: pops up a failed-to-take-reference error when takeReferenceZ throws a plain error', async () => {
    mockTakeReferenceZ.mockRejectedValueOnce(new Error('probe not lowered'));

    const measurer = new RedLightCurveMeasurer(device);
    const promise = measurer.showTakeReferenceDialog();

    await runConfirm();

    const res = await promise;

    expect(res).toBeNull();
    expect(mockPopUpError).toHaveBeenCalledTimes(1);
    // Uncoded error => translateError returns code null => the `failed_to_take_reference` branch.
    expect(mockPopUpError).toHaveBeenCalledWith({
      message: `${t.failed_to_take_reference}: probe not lowered`,
    });
  });

  test('Row 1: pops up the translated coded error message when takeReferenceZ throws error#921', async () => {
    mockTakeReferenceZ.mockRejectedValueOnce(new Error('error#921'));

    const measurer = new RedLightCurveMeasurer(device);
    const promise = measurer.showTakeReferenceDialog();

    await runConfirm();

    const res = await promise;

    expect(res).toBeNull();
    // Coded error => code branch => translated message only, no "failed_to_take_reference" prefix.
    expect(mockPopUpError).toHaveBeenCalledWith({ message: `#921 ${t['921']}` });
  });

  test('resolves with the measured Z and shows no error on success', async () => {
    mockTakeReferenceZ.mockResolvedValueOnce(12.5);

    const measurer = new RedLightCurveMeasurer(device);
    const promise = measurer.showTakeReferenceDialog();

    await runConfirm();

    const res = await promise;

    expect(res).toBe(12.5);
    expect(mockPopUpError).not.toHaveBeenCalled();
    expect(mockPopById).toHaveBeenCalledWith('take-reference');
  });

  test('aborts without taking reference when the task is not alive', async () => {
    mockCheckTaskAlive.mockResolvedValueOnce(false);

    const measurer = new RedLightCurveMeasurer(device);
    const promise = measurer.showTakeReferenceDialog();

    await runConfirm();

    const res = await promise;

    expect(res).toBeNull();
    expect(mockTakeReferenceZ).not.toHaveBeenCalled();
  });
});
