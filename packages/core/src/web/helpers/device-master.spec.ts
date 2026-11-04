import DeviceConstants from '@core/app/constants/device-constants';

jest.mock('@core/app/actions/alert-caller', () => ({}));
jest.mock('@core/app/actions/dialog-caller', () => ({}));
jest.mock('@core/app/actions/progress-caller', () => ({}));
jest.mock('@core/helpers/api/machine-linking', () => ({}));
jest.mock('@core/helpers/check-software', () => ({}));
jest.mock('@core/helpers/error-report/consent', () => ({}));
jest.mock('./api/camera', () => ({}));
jest.mock('./api/discover', () => ({ discoverManager: { register: jest.fn() } }));
jest.mock('./api/swiftray-client', () => ({}));
jest.mock('./api/swiftray-control', () => ({}));
jest.mock('./api/touch', () => ({}));
jest.mock('./device/bb2FirmwareWarning', () => ({}));

const mockPromptShow = jest.fn();
const mockPromptClose = jest.fn();
let mockPromptActions: { onResume: () => Promise<unknown>; onStop: () => Promise<unknown> };

jest.mock('./device/taskPausePrompt', () => ({
  ...jest.requireActual('./device/taskPausePrompt'),
  createTaskPausePrompt: (actions: typeof mockPromptActions) => {
    mockPromptActions = actions;

    return { close: mockPromptClose, show: mockPromptShow };
  },
}));
jest.mock('./device/promark/promark-data-store', () => ({}));
jest.mock('./version-checker', () => () => ({ meetRequirement: () => false }));

const mockAddFcodeMetadata = jest.fn();

jest.mock('@core/helpers/fcode/addFcodeMetadata', () => ({
  addFcodeMetadata: (...args: unknown[]) => mockAddFcodeMetadata(...args),
}));
jest.mock('@core/helpers/rsa-key', () => ({}));
jest.mock('@core/helpers/websocket', () => jest.fn());

import i18n from '@core/helpers/i18n';
import Websocket from '@core/helpers/websocket';
import type { Option } from '@core/interfaces/WebSocket';

import Control from './api/control';
import deviceMaster from './device-master';

describe('deviceMaster log downloads share the control queue', () => {
  let control: Control;
  const send = jest.fn();
  const close = jest.fn();
  let transport: Option;
  const status = { st_id: DeviceConstants.status.IDLE };
  const replyToReport = () =>
    control.emit('command-message', { cmd: 'play report', device_status: status, status: 'ok' });
  const finishLog = () => control.emit('command-message', { cmd: 'fetch_log fluxrobotd.log', status: 'ok' });

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    control = new Control('test-device');
    jest.mocked(Websocket).mockImplementation((options) => {
      transport = options;

      return { close, send } as unknown as ReturnType<typeof Websocket>;
    });

    const connecting = control.connect();

    transport.onMessage!({ status: 'connected' });
    await connecting;
    jest.spyOn(deviceMaster, 'getControl').mockResolvedValue(control);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test('a report waits for the final log ok after the binary frame', async () => {
    const onProgress = jest.fn();
    const log = deviceMaster.downloadLog('fluxrobotd.log', onProgress, 10_000);
    const report = deviceMaster.getReport();

    await Promise.resolve();
    expect(send.mock.calls).toEqual([['fetch_log fluxrobotd.log']]);

    const progress = { completed: 4, size: 4, status: 'transfer' };

    control.emit('command-message', progress);
    expect(onProgress).toHaveBeenCalledWith(progress);
    expect(send).toHaveBeenCalledTimes(1);

    const blob = new Blob(['log']);
    const metadata = { mimetype: 'binary', size: 3, status: 'binary' };

    control.emit('command-message', metadata);
    control.emit('command-message', blob);
    await Promise.resolve();
    expect(send.mock.calls).toEqual([['fetch_log fluxrobotd.log']]);
    finishLog();
    expect(await log).toEqual([metadata, blob]);
    expect(send.mock.calls).toEqual([['fetch_log fluxrobotd.log'], ['play report']]);
    replyToReport();
    await expect(report).resolves.toEqual(status);
    expect(jest.getTimerCount()).toBe(0);
  });

  test('a queued log leaves the active report and its progress listener alone', async () => {
    const activeProgress = jest.fn();
    const logProgress = jest.fn();
    const report = deviceMaster.getReport();

    await Promise.resolve();
    control.setProgressListener(activeProgress);

    const log = deviceMaster.downloadLog('fluxrobotd.log', logProgress, 10_000);

    await Promise.resolve();
    expect(send.mock.calls).toEqual([['play report']]);
    control.emit('command-progress', 'active');
    expect(activeProgress).toHaveBeenCalledWith('active');
    expect(logProgress).not.toHaveBeenCalled();

    replyToReport();
    await expect(report).resolves.toEqual(status);
    expect(send.mock.calls).toEqual([['play report'], ['fetch_log fluxrobotd.log']]);
    control.emit('command-progress', 'log');
    expect(logProgress).toHaveBeenCalledWith('log');
    expect(activeProgress).toHaveBeenCalledTimes(1);

    const blob = new Blob(['log']);

    control.emit('command-message', blob);
    finishLog();
    expect((await log)[1]).toBe(blob);
    expect(jest.getTimerCount()).toBe(0);
  });

  test('a multi-file log collection keeps its original control after switching machines', async () => {
    const otherControl = new Control('other-device');
    const otherSend = jest.fn();

    Object.assign(otherControl, { ws: { send: otherSend } });

    const logs = deviceMaster.getLogsTexts(['playerd.log', 'fluxrobotd.log'], undefined, 10_000);

    await jest.advanceTimersByTimeAsync(0);
    expect(send.mock.calls).toEqual([['fetch_log playerd.log']]);

    // Selecting B changes the control returned by DeviceMaster while A's first file is in flight.
    jest.mocked(deviceMaster.getControl).mockResolvedValue(otherControl);

    const first = new Blob(['A player log']);
    const second = new Blob(['A robot log']);

    control.emit('command-message', first);
    control.emit('command-message', { cmd: 'fetch_log playerd.log', status: 'ok' });
    await jest.advanceTimersByTimeAsync(0);
    expect(otherSend).not.toHaveBeenCalled();
    expect(send.mock.calls).toEqual([['fetch_log playerd.log'], ['fetch_log fluxrobotd.log']]);
    control.emit('command-message', second);
    finishLog();

    const result = await logs;

    expect(result['playerd.log'][1]).toBe(first);
    expect(result['fluxrobotd.log'][1]).toBe(second);
    expect(jest.getTimerCount()).toBe(0);
  });

  test('a failed original connection never falls back to the newly selected machine', async () => {
    jest.mocked(deviceMaster.getControl).mockRejectedValueOnce(new Error('A disconnected'));

    const logs = deviceMaster.getLogsTexts(['playerd.log', 'fluxrobotd.log']);

    // Subsequent getControl calls would now succeed on another machine.
    await jest.advanceTimersByTimeAsync(0);
    expect(send).not.toHaveBeenCalled();
    await expect(logs).resolves.toEqual({
      'fluxrobotd.log': ['<fluxrobotd.log not downloaded: Error: A disconnected>\n'],
      'playerd.log': ['<playerd.log not downloaded: Error: A disconnected>\n'],
    });
    expect(send).not.toHaveBeenCalled();
  });

  test('fetchFisheyeParams waits for the command ahead of it', async () => {
    const report = deviceMaster.getReport();
    const params = deviceMaster.fetchFisheyeParams();

    await Promise.resolve();
    expect(send.mock.calls).toEqual([['play report']]);
    replyToReport();
    await expect(report).resolves.toEqual(status);
    expect(send.mock.calls).toEqual([['play report'], ['fetch_fisheye_params']]);
    control.emit('command-message', new Blob([JSON.stringify({ k: [1] })]));
    control.emit('command-message', { cmd: 'fetch_fisheye_params', status: 'ok' });
    await expect(params).resolves.toEqual({ k: [1] });
  });

  test('the queue continues after a terminal log error', async () => {
    const log = deviceMaster.downloadLog('fluxrobotd.log', undefined, 10_000);
    const rejectedLog = expect(log).rejects.toMatchObject({ error: 'NOT_FOUND' });
    const report = deviceMaster.getReport();

    await Promise.resolve();
    control.emit('command-error', { error: 'NOT_FOUND', status: 'error' });
    await rejectedLog;
    expect(send.mock.calls).toEqual([['fetch_log fluxrobotd.log'], ['play report']]);
    replyToReport();
    await expect(report).resolves.toEqual(status);
    expect(close).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });

  test.each(['transfer', 'final ok'])(
    'a timeout waiting for %s retires the socket and rejects queued commands',
    async (stage) => {
      const log = deviceMaster.downloadLog('fluxrobotd.log', undefined, 10_000);
      const rejectedLog = expect(log).rejects.toMatchObject({ error: 'TIMEOUT' });
      const report = deviceMaster.getReport();
      const reportOutcome = report.then(
        (value) => ({ value }),
        (error: unknown) => ({ error }),
      );

      // DeviceMaster awaits getControl before it adds the log and report tasks.
      await Promise.resolve();

      const nextTask = jest.fn();
      const queued = control.addTask(nextTask);
      const queuedOutcome = queued.then(
        (value) => ({ value }),
        (error: unknown) => ({ error }),
      );

      if (stage === 'final ok') transport.onMessage!(new Blob(['log']));

      await jest.advanceTimersByTimeAsync(10_000);
      await rejectedLog;

      const onMessage = jest.fn();

      control.on('message', onMessage);
      transport.onMessage!({ completed: 3, size: 3, status: 'transfer' });
      transport.onMessage!({ mimetype: 'binary', size: 3, status: 'binary' });
      transport.onMessage!(new Blob(['late log']));
      transport.onMessage!({ cmd: 'fetch_log fluxrobotd.log', status: 'ok' });

      expect(await reportOutcome).toMatchObject({ error: { error: 'TIMEOUT' } });
      expect(await queuedOutcome).toMatchObject({ error: { error: 'TIMEOUT' } });
      expect(nextTask).not.toHaveBeenCalled();
      expect(onMessage).not.toHaveBeenCalled();
      expect(send.mock.calls).toEqual([['fetch_log fluxrobotd.log']]);
      expect(close).toHaveBeenCalledTimes(1);
      expect(control.isConnected).toBe(false);
      await expect(control.addTask(control.report)).rejects.toMatchObject({ error: 'TIMEOUT' });
      expect(jest.getTimerCount()).toBe(0);

      // A new connection is independent of the retired transport, including its late final ok.
      const oldTransport = transport;
      const fresh = new Control('test-device');
      const connecting = fresh.connect();

      transport.onMessage!({ status: 'connected' });
      await connecting;
      jest.mocked(deviceMaster.getControl).mockResolvedValue(fresh);

      const freshReport = deviceMaster.getReport();

      await Promise.resolve();
      oldTransport.onMessage!({ cmd: 'fetch_log fluxrobotd.log', status: 'ok' });
      transport.onMessage!({ cmd: 'play report', device_status: status, status: 'ok' });
      await expect(freshReport).resolves.toEqual(status);
      expect(send.mock.calls).toEqual([['fetch_log fluxrobotd.log'], ['play report']]);
      expect(jest.getTimerCount()).toBe(0);
    },
  );
});

describe('deviceMaster.setField', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test.each([70, 75, 110, 200])('sends the %i mm work area to the machine unchanged', async (worksize) => {
    const field = { angle: 1, offsetX: 2, offsetY: 3 };
    const control = { addTask: jest.fn().mockResolvedValue(undefined), setField: jest.fn() };

    jest.spyOn(deviceMaster, 'getControl').mockResolvedValue(control as unknown as Control);
    await deviceMaster.setField(worksize, field);

    expect(control.addTask).toHaveBeenCalledWith(control.setField, worksize, field);
  });
});

describe('deviceMaster.waitTillStatusPredicate', () => {
  const { ABORTED, ALARM, COMPLETED, IDLE, PAUSED_FROM_STARTING, RUNNING } = DeviceConstants.status;
  const AIR_ASSIST = ['HARDWARE_ERROR', 'AIR_ASSIST_OUT_OF_RANGE'];
  let reports: Array<{ error?: string | string[]; prog?: number; st_id: number }>;
  const control = {
    addTask: jest.fn((fn: () => unknown) => fn()),
    report: jest.fn(async () => ({ device_status: reports.length > 1 ? reports.shift() : reports[0] })),
  };
  /** Run the polls until the wait settles. */
  const settle = async <T>(promise: Promise<T>) => {
    const result = promise.then(
      (value) => ({ value }),
      (error) => ({ error }),
    );

    await jest.advanceTimersByTimeAsync(30_000);

    return result;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.spyOn(deviceMaster, 'getControl').mockResolvedValue(control as unknown as Control);
    jest.spyOn(deviceMaster, 'quit').mockResolvedValue(undefined);
    jest.spyOn(deviceMaster, 'resume').mockResolvedValue(undefined);
    jest.spyOn(deviceMaster, 'stop').mockResolvedValue(undefined);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  test('resolves and quits on completion', async () => {
    const onProgress = jest.fn();

    reports = [{ prog: 0.5, st_id: RUNNING }, { st_id: COMPLETED }];

    expect(await settle(deviceMaster.waitTillStatusPredicate({ onProgress }))).toEqual({ value: null });
    expect(onProgress).toHaveBeenCalledWith(0.5);
    expect(deviceMaster.quit).toHaveBeenCalledTimes(1);
  });

  test('keeps polling through a resumable pause and closes the prompt when resumed elsewhere', async () => {
    reports = [
      { error: AIR_ASSIST, st_id: PAUSED_FROM_STARTING },
      { error: AIR_ASSIST, st_id: PAUSED_FROM_STARTING },
      { st_id: RUNNING },
      { st_id: COMPLETED },
    ];

    expect(await settle(deviceMaster.waitTillStatusPredicate({}))).toEqual({ value: null });
    expect(mockPromptShow).toHaveBeenCalledTimes(2);
    expect(mockPromptShow).toHaveBeenCalledWith(AIR_ASSIST);
    expect(mockPromptClose).toHaveBeenCalled();
  });

  test('prompt actions resume or stop the task', async () => {
    reports = [{ error: AIR_ASSIST, st_id: PAUSED_FROM_STARTING }, { st_id: ABORTED }];

    const waiting = deviceMaster.waitTillStatusPredicate({});

    await mockPromptActions.onResume();
    expect(deviceMaster.resume).toHaveBeenCalledTimes(1);

    // stopping from the prompt is a plain abort, whatever error is still reported
    await mockPromptActions.onStop();
    reports = [{ error: AIR_ASSIST, st_id: ABORTED }];
    expect(await settle(waiting)).toEqual({ error: [] });
    expect(deviceMaster.stop).toHaveBeenCalledTimes(1);
  });

  test('rejects with the error when the task cannot go on', async () => {
    reports = [{ st_id: RUNNING }, { error: ['HARDWARE_ERROR', 'FIRE_DETECTED'], st_id: ALARM }];
    expect(await settle(deviceMaster.waitTillStatusPredicate({}))).toEqual({
      error: ['HARDWARE_ERROR', 'FIRE_DETECTED'],
    });

    reports = [{ error: 'HARDWARE_ERROR', st_id: ABORTED }];
    expect(await settle(deviceMaster.waitTillStatusPredicate({}))).toEqual({ error: ['HARDWARE_ERROR'] });
    expect(deviceMaster.quit).not.toHaveBeenCalled();
  });

  test('resolves when the task went back to idle after running', async () => {
    reports = [{ st_id: IDLE }, { st_id: RUNNING }, { st_id: IDLE }];
    expect(await settle(deviceMaster.waitTillStatusPredicate({}))).toEqual({ value: null });
  });

  test('a failed report is retried', async () => {
    reports = [{ st_id: RUNNING }, { st_id: COMPLETED }];

    const getControl = jest.mocked(deviceMaster.getControl);

    // 9 misses, a report, then 9 more: the count restarts after every report
    for (let i = 0; i < 9; i += 1) getControl.mockRejectedValueOnce(new Error('disconnected'));

    getControl.mockResolvedValueOnce(control as unknown as Control);

    for (let i = 0; i < 9; i += 1) getControl.mockRejectedValueOnce(new Error('disconnected'));

    expect(await settle(deviceMaster.waitTillStatusPredicate({}))).toEqual({ value: null });
  });

  test('rejects when the report cannot be read 10 times in a row', async () => {
    reports = [{ st_id: RUNNING }];
    jest.mocked(deviceMaster.getControl).mockRejectedValue(new Error('disconnected'));

    const result = (await settle(deviceMaster.waitTillStatusPredicate({}))) as { error: Error };

    expect(result.error).toEqual(new Error(i18n.lang.message.unable_to_get_task_status));
    expect(deviceMaster.getControl).toHaveBeenCalledTimes(10);
    expect(deviceMaster.quit).not.toHaveBeenCalled();
  });
});

describe('deviceMaster.doCalibration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    deviceMaster.currentDevice = { info: { version: '5.0.0' } } as typeof deviceMaster.currentDevice;
    jest.spyOn(deviceMaster, 'stop').mockResolvedValue(undefined);
    jest.spyOn(deviceMaster, 'go').mockResolvedValue(undefined);
    jest.spyOn(deviceMaster, 'waitTillStatusPredicate').mockResolvedValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    deviceMaster.currentDevice = undefined;
  });

  test('uploads the task with the air assist warning ignored', async () => {
    const blob = new Blob(['task']);
    const patched = new Blob(['patched task']);

    mockAddFcodeMetadata.mockResolvedValue(patched);
    await deviceMaster.doCalibration({ blob, onProgress: jest.fn() });

    expect(mockAddFcodeMetadata).toHaveBeenCalledWith(blob, { IGNORE_AIR_ASSIST_WARNING: '1' });
    expect(deviceMaster.go).toHaveBeenCalledWith(patched);
  });
});
