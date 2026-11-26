const mockSend = jest.fn();
let socketOptions: { onError: (r: any) => void; onFatal: (r: any) => void; onMessage: (r: any) => void };

jest.mock('@core/helpers/websocket', () => (options: any) => {
  socketOptions = options;

  return { send: (...args: any[]) => mockSend(...args) };
});

import { cameraCalibrationApi } from './camera-calibration';

// what fluxghost sends for a command it does not know; the websocket wrapper hands it to onMessage, not onError
const unknownCommand = { message: 'BAD_PARAM_TYPE', status: 'Error' };
const img = new Blob(['photo']);

describe('cameraCalibrationApi auto PnP commands', () => {
  beforeEach(() => jest.clearAllMocks());

  test('autoPnPDetect uploads the photo and returns the blobs', async () => {
    const promise = cameraCalibrationApi.autoPnPDetect(img);

    expect(mockSend).toHaveBeenLastCalledWith(`auto_pnp_detect ${img.size}`);
    socketOptions.onMessage({ status: 'continue' });
    expect(mockSend).toHaveBeenLastCalledWith(img);
    socketOptions.onMessage({ blobs: [[1, 2, 3, 4]], status: 'ok', weak: [[5, 6, 7, 8]] });

    expect(await promise).toEqual({ blobs: [[1, 2, 3, 4]], success: true, weak: [[5, 6, 7, 8]] });
  });

  test('autoPnPDetect reports a backend without the command as UNSUPPORTED', async () => {
    const fromMessage = cameraCalibrationApi.autoPnPDetect(img);

    socketOptions.onMessage(unknownCommand);
    expect(await fromMessage).toEqual({ reason: 'UNSUPPORTED', success: false });
  });

  test('autoPnPDetect rejects on an error reply: only the unknown-command reply means UNSUPPORTED', async () => {
    const promise = cameraCalibrationApi.autoPnPDetect(img);

    socketOptions.onError({ status: 'error' });
    await expect(promise).rejects.toEqual({ status: 'error' });
  });

  test('autoPnPDetect passes a fail reason on', async () => {
    const promise = cameraCalibrationApi.autoPnPDetect(img);

    socketOptions.onMessage({ info: 'NO_DATA', reason: 'No calibration data found', status: 'fail' });
    expect(await promise).toEqual({ reason: 'NO_DATA', success: false });
  });

  test('autoPnPMatch sends the lists with the residual limit and returns the points', async () => {
    const promise = cameraCalibrationApi.autoPnPMatch([[0, 0]], [[[1, 2, 3, 4]]], [[]], 0.2);

    expect(mockSend).toHaveBeenLastCalledWith(
      `auto_pnp_match ${JSON.stringify({ blobs: [[[1, 2, 3, 4]]], r_max: 0.2, ref_points: [[0, 0]], weak: [[]] })}`,
    );
    socketOptions.onMessage({ filled: 0, matched: 1, points: [[1, 2]], rms: 0.1, status: 'ok' });

    expect(await promise).toEqual({ filled: 0, matched: 1, points: [[1, 2]], rms: 0.1, success: true });
  });

  test('autoPnPMatch keeps the points of a failed match', async () => {
    const promise = cameraCalibrationApi.autoPnPMatch([[0, 0]], [[]]);

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

    socketOptions.onMessage(unknownCommand);
    await expect(fromMessage).rejects.toEqual({ message: 'BAD_PARAM_TYPE' });

    const fromError = cameraCalibrationApi.autoPnPMatch([[0, 0]], [[]]);

    socketOptions.onError({ status: 'error' });
    await expect(fromError).rejects.toEqual({ status: 'error' });
  });
});
