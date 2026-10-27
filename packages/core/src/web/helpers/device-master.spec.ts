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
jest.mock('@core/helpers/websocket', () => ({}));

import Control from './api/control';
import deviceMaster from './device-master';

describe('deviceMaster log downloads share the control queue', () => {
  let control: Control;
  const send = jest.fn();
  const status = { st_id: DeviceConstants.status.IDLE };
  const replyToReport = () =>
    control.emit('command-message', { cmd: 'play report', device_status: status, status: 'ok' });
  const finishLog = () => control.emit('command-message', { cmd: 'fetch_log fluxrobotd.log', status: 'ok' });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    control = new Control('test-device');
    Object.assign(control, { ws: { send } });
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

  test.each(['error', 'timeout', 'missing final ok'])('the queue continues after a log %s', async (failure) => {
    const log = deviceMaster.downloadLog('fluxrobotd.log', undefined, 10_000);
    const expectedError = { error: failure === 'error' ? 'NOT_FOUND' : 'TIMEOUT', status: 'error' };
    const rejectedLog = expect(log).rejects.toMatchObject(expectedError);
    const report = deviceMaster.getReport();

    await Promise.resolve();

    if (failure === 'missing final ok') {
      control.emit('command-message', new Blob(['log']));
    }

    if (failure !== 'error') {
      jest.advanceTimersByTime(10_000);
    } else {
      control.emit('command-error', expectedError);
    }

    await rejectedLog;
    expect(send.mock.calls).toEqual([['fetch_log fluxrobotd.log'], ['play report']]);
    replyToReport();
    await expect(report).resolves.toEqual(status);
    expect(jest.getTimerCount()).toBe(0);
  });
});
