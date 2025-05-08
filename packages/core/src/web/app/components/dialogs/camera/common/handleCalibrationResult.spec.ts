import { sprintf } from 'sprintf-js';

import i18n from '@core/helpers/i18n';

import handleCalibrationResult from './handleCalibrationResult';

const mockPopUp = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUp: (...args) => mockPopUp(...args),
}));

const goodThreshold = 1;
const averageThreshold = 2;

describe('handleCalibrationResult', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('excellent and continue', async () => {
    const retScore = 0.5;

    mockPopUp.mockImplementationOnce((args) => {
      args.buttons[0].onClick();
    });

    const result = await handleCalibrationResult(retScore, goodThreshold, averageThreshold);

    expect(result).toBe(true);
    expect(mockPopUp).toHaveBeenCalledTimes(1);
    expect(mockPopUp).toHaveBeenCalledWith({
      buttons: [
        { className: 'primary', label: i18n.lang.calibration.next, onClick: expect.any(Function) },
        { label: i18n.lang.calibration.cancel, onClick: expect.any(Function) },
      ],
      message: sprintf(i18n.lang.calibration.calibrate_success_msg, i18n.lang.calibration.res_excellent, retScore),
    });

    expect(result).toBe(true);
  });

  test('average and continue', async () => {
    const retScore = 1.5;

    mockPopUp.mockImplementationOnce((args) => {
      args.buttons[0].onClick();
    });

    const result = await handleCalibrationResult(retScore, goodThreshold, averageThreshold);

    expect(result).toBe(true);
    expect(mockPopUp).toHaveBeenCalledTimes(1);
    expect(mockPopUp).toHaveBeenCalledWith({
      buttons: [
        { className: 'primary', label: i18n.lang.calibration.next, onClick: expect.any(Function) },
        { label: i18n.lang.calibration.cancel, onClick: expect.any(Function) },
      ],
      message: sprintf(i18n.lang.calibration.calibrate_success_msg, i18n.lang.calibration.res_average, retScore),
    });

    expect(result).toBe(true);
  });

  test('poor and cancel', async () => {
    const retScore = 3;

    mockPopUp.mockImplementationOnce((args) => {
      args.buttons[1].onClick();
    });

    const result = await handleCalibrationResult(retScore, goodThreshold, averageThreshold);

    expect(result).toBe(false);
    expect(mockPopUp).toHaveBeenCalledTimes(1);
    expect(mockPopUp).toHaveBeenCalledWith({
      buttons: [
        { className: 'primary', label: i18n.lang.calibration.next, onClick: expect.any(Function) },
        { label: i18n.lang.calibration.cancel, onClick: expect.any(Function) },
      ],
      message: sprintf(i18n.lang.calibration.calibrate_success_msg, i18n.lang.calibration.res_poor, retScore),
    });

    expect(result).toBe(false);
  });
});
