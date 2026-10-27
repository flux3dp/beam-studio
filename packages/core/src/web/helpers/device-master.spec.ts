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
jest.mock('./device/promark/promark-data-store', () => ({}));
jest.mock('./version-checker', () => ({}));
jest.mock('@core/helpers/rsa-key', () => ({}));
jest.mock('@core/helpers/websocket', () => jest.fn());

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
