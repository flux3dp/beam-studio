const mockSend = jest.fn();
const mockClose = jest.fn();
let socketOptions: { onError: (r: any) => void; onFatal: (r: any) => void; onMessage: (r: any) => void };

// p-queue is ESM-only and cannot be loaded here: a stand-in with what the api relies on, one task at a time
jest.mock('p-queue', () => ({
  __esModule: true,
  default: class {
    private tail: Promise<unknown> = Promise.resolve();

    add = (task: () => Promise<unknown>) => {
      const result = this.tail.then(task);

      this.tail = result.catch(() => {});

      return result;
    };
  },
}));

jest.mock('@core/helpers/websocket', () => (options: any) => {
  socketOptions = options;

  return { close: (...args: any[]) => mockClose(...args), send: (...args: any[]) => mockSend(...args) };
});

import { cameraCalibrationApi } from './camera-calibration';

// what fluxghost sends for a command it does not know; the websocket wrapper hands it to onMessage, not onError
const unknownCommand = { message: 'BAD_PARAM_TYPE', status: 'Error' };
const img = new Blob(['photo']);

const flush = () => new Promise((resolve) => setTimeout(resolve));

describe('cameraCalibrationApi command queue', () => {
  beforeEach(() => jest.clearAllMocks());

  test('a later command waits for the earlier reply, which goes to the earlier command', async () => {
    const match = cameraCalibrationApi.autoPnPMatch([[0, 0]], [[]]);

    await flush();

    // the dialog was closed and opened again while the match was still running
    const update = cameraCalibrationApi.updateData({ d: [[0]], k: [[1]] } as any);

    await flush();
    expect(mockSend).toHaveBeenCalledTimes(1);

    socketOptions.onMessage({ matched: 3, reason: 'NOT_ENOUGH_MARKS', status: 'fail' });
    expect(await match).toEqual({ matched: 3, reason: 'NOT_ENOUGH_MARKS', success: false });

    await flush();
    expect(mockSend).toHaveBeenCalledTimes(2);
    expect(mockSend.mock.calls[1][0]).toMatch(/^update_data /);

    socketOptions.onMessage({ status: 'ok' });
    expect(await update).toBe(true);
  });

  test('a command that timed out closes the connection before the next one is sent', async () => {
    jest.useFakeTimers();

    try {
      const oldConnection = socketOptions;
      const lost = cameraCalibrationApi.autoPnPMatch([[0, 0]], [[]]);
      const lostResult = expect(lost).rejects.toThrow(/timed out/i);

      await jest.advanceTimersByTimeAsync(0);

      const update = cameraCalibrationApi.updateData({ d: [[0]], k: [[1]] } as any);

      await jest.advanceTimersByTimeAsync(2 * 60 * 1000 - 1);
      expect(mockClose).not.toHaveBeenCalled();
      expect(mockSend).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(1);
      await lostResult;
      await jest.advanceTimersByTimeAsync(0);
      expect(mockSend).toHaveBeenCalledTimes(2);
      // closed for good first, and the next command goes out on a new connection
      expect(mockClose).toHaveBeenCalledWith(false);
      expect(mockClose.mock.invocationCallOrder[0]).toBeLessThan(mockSend.mock.invocationCallOrder[1]);
      expect(socketOptions).not.toBe(oldConnection);

      // whatever the old connection still reports is not taken for the reply of update_data
      oldConnection.onMessage({ status: 'fail' });
      oldConnection.onFatal({ code: 1006 });

      socketOptions.onMessage({ status: 'ok' });
      expect(await update).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('cameraCalibrationApi auto PnP commands', () => {
  beforeEach(() => jest.clearAllMocks());

  test('autoPnPDetect uploads the photo and returns the blobs', async () => {
    const promise = cameraCalibrationApi.autoPnPDetect(img);

    await flush();

    expect(mockSend).toHaveBeenLastCalledWith(`auto_pnp_detect ${img.size}`);
    socketOptions.onMessage({ status: 'continue' });
    expect(mockSend).toHaveBeenLastCalledWith(img);
    socketOptions.onMessage({ blobs: [[1, 2, 3, 4]], status: 'ok', weak: [[5, 6, 7, 8]] });

    expect(await promise).toEqual({ blobs: [[1, 2, 3, 4]], success: true, weak: [[5, 6, 7, 8]] });
  });

  test('autoPnPDetect reports a backend without the command as UNSUPPORTED', async () => {
    const fromMessage = cameraCalibrationApi.autoPnPDetect(img);

    await flush();

    socketOptions.onMessage(unknownCommand);
    expect(await fromMessage).toEqual({ reason: 'UNSUPPORTED', success: false });
  });

  test('autoPnPDetect rejects on an error reply: only the unknown-command reply means UNSUPPORTED', async () => {
    const promise = cameraCalibrationApi.autoPnPDetect(img);

    await flush();

    socketOptions.onError({ status: 'error' });
    await expect(promise).rejects.toEqual({ status: 'error' });
  });

  test('autoPnPDetect passes a fail reason on', async () => {
    const promise = cameraCalibrationApi.autoPnPDetect(img);

    await flush();

    socketOptions.onMessage({ info: 'NO_DATA', reason: 'No calibration data found', status: 'fail' });
    expect(await promise).toEqual({ reason: 'NO_DATA', success: false });
  });

  test('autoPnPMatch sends the lists with the residual limit and returns the points', async () => {
    const promise = cameraCalibrationApi.autoPnPMatch([[0, 0]], [[[1, 2, 3, 4]]], [[]], 0.2);

    await flush();

    expect(mockSend).toHaveBeenLastCalledWith(
      `auto_pnp_match ${JSON.stringify({ blobs: [[[1, 2, 3, 4]]], r_max: 0.2, ref_points: [[0, 0]], weak: [[]] })}`,
    );
    socketOptions.onMessage({ filled: 0, matched: 1, points: [[1, 2]], rms: 0.1, status: 'ok' });

    expect(await promise).toEqual({ filled: 0, matched: 1, points: [[1, 2]], rms: 0.1, success: true });
  });

  test('autoPnPMatch keeps the points of a failed match', async () => {
    const promise = cameraCalibrationApi.autoPnPMatch([[0, 0]], [[]]);

    await flush();

    socketOptions.onMessage({ matched: 1, points: [[1, 2]], reason: 'HIGH_RESIDUAL', rms: 1.8, status: 'fail' });
    expect(await promise).toEqual({
      matched: 1,
      points: [[1, 2]],
      reason: 'HIGH_RESIDUAL',
      rms: 1.8,
      success: false,
    });
  });

  test('autoPnPMatch never reports UNSUPPORTED: the backend has detected by then, so the reply is a failure', async () => {
    const fromMessage = cameraCalibrationApi.autoPnPMatch([[0, 0]], [[]]);

    await flush();

    socketOptions.onMessage(unknownCommand);
    await expect(fromMessage).rejects.toEqual({ message: 'BAD_PARAM_TYPE' });

    const fromError = cameraCalibrationApi.autoPnPMatch([[0, 0]], [[]]);

    await flush();

    socketOptions.onError({ status: 'error' });
    await expect(fromError).rejects.toEqual({ status: 'error' });
  });
});
