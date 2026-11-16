const mockPopUp = jest.fn();
const mockPopUpError = jest.fn();
const mockPopById = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popById: (...args: unknown[]) => mockPopById(...args),
  popUp: (...args: unknown[]) => mockPopUp(...args),
  popUpError: (...args: unknown[]) => mockPopUpError(...args),
}));

jest.mock('@core/helpers/device-error-handler', () => ({
  translate: (error: string[]) => error.join(' '),
}));

jest.mock('@core/helpers/i18n', () => ({
  lang: { monitor: { resume: 'Resume', stop: 'Stop' } },
}));

import DeviceConstants from '@core/app/constants/device-constants';

import {
  alertTaskError,
  createTaskPausePrompt,
  isAirAssistWarningOnly,
  isResumablePause,
  TASK_PAUSED_ALERT_ID,
  toErrorList,
} from './taskPausePrompt';

const AIR_ASSIST = ['HARDWARE_ERROR', 'AIR_ASSIST_OUT_OF_RANGE'];
const FILTER = ['HARDWARE_ERROR', 'FILTER_EXPIRED'];
const PROBE = ['HARDWARE_ERROR', 'PROBE_SHOWED'];

describe('test taskPausePrompt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('toErrorList', () => {
    expect(toErrorList(undefined)).toEqual([]);
    expect(toErrorList('')).toEqual([]);
    expect(toErrorList('TIMEOUT')).toEqual(['TIMEOUT']);
    expect(toErrorList(AIR_ASSIST)).toEqual(AIR_ASSIST);
  });

  test('isResumablePause', () => {
    const { ABORTED, PAUSED_FROM_RUNNING, PAUSED_FROM_STARTING, RUNNING } = DeviceConstants.status;

    expect(isResumablePause(PAUSED_FROM_STARTING, AIR_ASSIST)).toBe(true);
    expect(isResumablePause(PAUSED_FROM_RUNNING, ['HARDWARE_ERROR', 'DOOR_OPENED'])).toBe(true);
    expect(isResumablePause(PAUSED_FROM_STARTING, [])).toBe(false);
    expect(isResumablePause(ABORTED, AIR_ASSIST)).toBe(false);
    expect(isResumablePause(RUNNING, AIR_ASSIST)).toBe(false);
  });

  test('shows the prompt once per error and closes it', () => {
    const prompt = createTaskPausePrompt({ onResume: jest.fn(), onStop: jest.fn() });

    prompt.show(FILTER);
    prompt.show(FILTER);
    expect(mockPopUp).toHaveBeenCalledTimes(1);
    expect(mockPopUp).toHaveBeenCalledWith(
      expect.objectContaining({
        buttonLabels: ['Stop', 'Resume'],
        id: TASK_PAUSED_ALERT_ID,
        message: 'HARDWARE_ERROR FILTER_EXPIRED',
        primaryButtonIndex: 1,
      }),
    );

    prompt.show(PROBE);
    expect(mockPopById).toHaveBeenCalledWith(TASK_PAUSED_ALERT_ID);
    expect(mockPopUp).toHaveBeenCalledTimes(2);

    prompt.close();
    expect(mockPopById).toHaveBeenCalledTimes(2);
    prompt.close();
    expect(mockPopById).toHaveBeenCalledTimes(2);
  });

  test('buttons resume or stop, then wait before asking again', async () => {
    const onResume = jest.fn().mockResolvedValue(undefined);
    const onStop = jest.fn().mockResolvedValue(undefined);
    const prompt = createTaskPausePrompt({ onResume, onStop });

    prompt.show(FILTER);

    const [stop, resume] = mockPopUp.mock.calls[0][0].callbacks;

    await resume();
    expect(onResume).toHaveBeenCalledTimes(1);

    // the machine still reports the pause right after resuming
    prompt.show(FILTER);
    expect(mockPopUp).toHaveBeenCalledTimes(1);

    // still paused on the same error afterwards (e.g. the filter is not replaced): ask again
    jest.advanceTimersByTime(3000);
    prompt.show(FILTER);
    expect(mockPopUp).toHaveBeenCalledTimes(2);

    await stop();
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  test('isAirAssistWarningOnly', () => {
    expect(isAirAssistWarningOnly(AIR_ASSIST)).toBe(true);
    expect(isAirAssistWarningOnly([...AIR_ASSIST, 'DOOR_OPENED'])).toBe(false);
    expect(isAirAssistWarningOnly(['HARDWARE_ERROR', 'DOOR_OPENED', 'AIR_ASSIST_OUT_OF_RANGE'])).toBe(false);
    expect(isAirAssistWarningOnly(FILTER)).toBe(false);
    expect(isAirAssistWarningOnly([])).toBe(false);
  });

  test('resumes the air assist warning alone without asking', async () => {
    const onResume = jest.fn().mockResolvedValue(undefined);
    const prompt = createTaskPausePrompt({ onResume, onStop: jest.fn() });

    prompt.show(AIR_ASSIST);
    expect(onResume).toHaveBeenCalledTimes(1);
    expect(mockPopUp).not.toHaveBeenCalled();

    // the machine still reports the pause right after resuming
    prompt.show(AIR_ASSIST);
    expect(onResume).toHaveBeenCalledTimes(1);

    // resume did not take: try again after the grace time
    jest.advanceTimersByTime(3000);
    prompt.show(AIR_ASSIST);
    expect(onResume).toHaveBeenCalledTimes(2);
    expect(mockPopUp).not.toHaveBeenCalled();
  });

  test('asks when the air assist warning comes with another error', () => {
    const onResume = jest.fn();
    const prompt = createTaskPausePrompt({ onResume, onStop: jest.fn() });

    prompt.show([...AIR_ASSIST, 'DOOR_OPENED']);
    expect(onResume).not.toHaveBeenCalled();
    expect(mockPopUp).toHaveBeenCalledTimes(1);
  });

  test('alertTaskError', () => {
    alertTaskError([]);
    alertTaskError(undefined);
    expect(mockPopUpError).not.toHaveBeenCalled();

    alertTaskError(['HARDWARE_ERROR', 'FIRE_DETECTED']);
    expect(mockPopUpError).toHaveBeenLastCalledWith({ message: 'HARDWARE_ERROR FIRE_DETECTED' });

    alertTaskError(new Error('UPLOAD_FAILED'));
    expect(mockPopUpError).toHaveBeenLastCalledWith({ message: 'UPLOAD_FAILED' });
  });
});
