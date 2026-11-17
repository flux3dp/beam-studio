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
  lang: {
    generic_error: { UNKNOWN_ERROR: 'Unknown error' },
    monitor: {
      HARDWARE_ERROR: 'Hardware error',
      HARDWARE_ERROR_AIR_ASSIST_OUT_OF_RANGE: 'Air assist low',
      HARDWARE_ERROR_DOOR_OPENED: 'Close the door',
      HARDWARE_ERROR_LIMIT_SWITCH_TRIGGERED: 'Limit switch',
      resume: 'Resume',
      stop: 'Stop',
      USER_OPERATION: 'Follow the panel',
      USER_OPERATION_CHANGE_TOOLHEAD: 'Change the module',
      USER_OPERATION_CHANGE_TOOLHEAD_HEADTYPE_NONE: 'No module',
      USER_OPERATION_ROTARY_PAUSE: 'Switch to rotary',
    },
  },
}));

import DeviceConstants from '@core/app/constants/device-constants';

import {
  alertTaskError,
  createTaskPausePrompt,
  isAirAssistWarningOnly,
  isResumablePause,
  TASK_PAUSED_ALERT_ID,
  toErrorList,
  translateTaskError,
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
    expect(mockPopUp.mock.calls[0][0].message).toBe('Air assist low\n\nClose the door');
  });

  test('keeps asking when the pause drops to the air assist warning alone', () => {
    const onResume = jest.fn().mockResolvedValue(undefined);
    const prompt = createTaskPausePrompt({ onResume, onStop: jest.fn() });

    prompt.show([...AIR_ASSIST, 'DOOR_OPENED']);
    expect(mockPopUp).toHaveBeenCalledTimes(1);

    // the door was closed from the machine side: the user still resumes by hand
    prompt.show(AIR_ASSIST);
    expect(onResume).not.toHaveBeenCalled();
    expect(mockPopById).toHaveBeenCalledWith(TASK_PAUSED_ALERT_ID);
    expect(mockPopUp).toHaveBeenCalledTimes(2);
    expect(mockPopUp.mock.calls[1][0].message).toBe('HARDWARE_ERROR AIR_ASSIST_OUT_OF_RANGE');

    // once the pause is over, a new pause on the air assist warning alone resumes by itself
    prompt.close();
    prompt.show(AIR_ASSIST);
    expect(onResume).toHaveBeenCalledTimes(1);
    expect(mockPopUp).toHaveBeenCalledTimes(2);
  });

  test('translateTaskError keeps what the monitor shows for a single cause', () => {
    // DeviceErrorHandler.translate is mocked as join(' ')
    expect(translateTaskError([])).toBe('');
    expect(translateTaskError(AIR_ASSIST)).toBe('HARDWARE_ERROR AIR_ASSIST_OUT_OF_RANGE');
    expect(translateTaskError(['UNKNOWN_ERROR', 'X'])).toBe('UNKNOWN_ERROR X');
    expect(translateTaskError(['USER_OPERATION', 'CHANGE_TOOLHEAD', 'HEADTYPE_NONE'])).toBe(
      'USER_OPERATION CHANGE_TOOLHEAD HEADTYPE_NONE',
    );
    // nothing known: the same fallback as the monitor
    expect(translateTaskError(['HARDWARE_ERROR', 'NEW_ERROR', 'OTHER'])).toBe('HARDWARE_ERROR NEW_ERROR OTHER');
  });

  test('translateTaskError names every cause of an accumulated list', () => {
    expect(translateTaskError([...AIR_ASSIST, 'DOOR_OPENED'])).toBe('Air assist low\n\nClose the door');
    // the category key again mid-list (appended errors, then the status report)
    expect(translateTaskError([...AIR_ASSIST, 'HARDWARE_ERROR', 'DOOR_OPENED'])).toBe(
      'Air assist low\n\nClose the door',
    );
    expect(translateTaskError(['USER_OPERATION', 'ROTARY_PAUSE', 'HARDWARE_ERROR', 'DOOR_OPENED'])).toBe(
      'Switch to rotary\n\nClose the door',
    );
    // a sub key plus detail stays one message
    expect(
      translateTaskError(['USER_OPERATION', 'CHANGE_TOOLHEAD', 'HEADTYPE_NONE', 'HARDWARE_ERROR', 'DOOR_OPENED']),
    ).toBe('No module\n\nClose the door');
    // an unknown detail is left out when its category has a known one
    expect(translateTaskError(['HARDWARE_ERROR', 'NEW_ERROR', 'DOOR_OPENED'])).toBe('Close the door');
  });

  test('translateTaskError reads details without a category as hardware errors', () => {
    expect(translateTaskError(['LIMIT_SWITCH_TRIGGERED'])).toBe('Limit switch');
    expect(translateTaskError(['LIMIT_SWITCH_TRIGGERED', 'HARDWARE_ERROR', 'DOOR_OPENED'])).toBe(
      'Limit switch\n\nClose the door',
    );
    expect(translateTaskError(['HARDWARE_ERROR'])).toBe('HARDWARE_ERROR');
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
