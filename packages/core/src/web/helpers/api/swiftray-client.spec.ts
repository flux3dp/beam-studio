jest.mock('@core/app/actions/alert-caller', () => ({ popUp: jest.fn() }));
jest.mock('@core/app/actions/message-caller', () => ({ MessageLevel: {}, openMessage: jest.fn() }));
jest.mock('@core/app/components/beambox/TopBar/contexts/TopBarController', () => ({ getSelectedDevice: jest.fn() }));
jest.mock('@core/app/svgedit/workarea', () => ({}));
jest.mock('@core/helpers/device-master', () => ({}));
jest.mock('@core/helpers/logger', () => () => ({ append: jest.fn() }));
jest.mock('@core/helpers/is-web', () => () => false);

import { SwiftrayClient, swiftrayClient } from './swiftray-client';

describe('Swiftray device routes', () => {
  afterEach(() => jest.restoreAllMocks());

  test('keeps BeamGo and Promark routes and widths independent', async () => {
    const action = jest.spyOn(swiftrayClient, 'action').mockResolvedValue({ success: true });
    const beamgo = swiftrayClient.forDevice('beamgo/A');
    const promark = swiftrayClient.forDevice('promark-uuid');

    await beamgo.startFraming({
      framingPower: 30,
      points: [
        [1, 1],
        [2, 2],
      ],
      rotaryInfo: null,
    });
    await promark.startFraming({
      points: [
        [1, 1],
        [2, 2],
      ],
      rotaryInfo: null,
    });
    await beamgo.pauseTask();
    expect(action.mock.calls[0]).toEqual([
      '/devices/beamgo/A',
      'startFraming',
      expect.objectContaining({ framingPower: 30, width: 90 }),
    ]);
    expect(action.mock.calls[1]).toEqual([
      '/devices/promark-uuid',
      'startFraming',
      expect.objectContaining({ width: 150 }),
    ]);
    expect(action.mock.calls[2]).toEqual(['/devices/beamgo/A', 'pause', undefined]);
    expect(beamgo).toBeInstanceOf(SwiftrayClient);
  });

  test('surfaces BeamGo start refusals while keeping Promark responses compatible', async () => {
    jest.spyOn(swiftrayClient, 'action').mockResolvedValue({ error: 'HARDWARE_ERROR,DOOR_OPENED', success: false });
    await expect(swiftrayClient.forDevice('beamgo/A').startTask()).rejects.toMatchObject({
      error: ['HARDWARE_ERROR', 'DOOR_OPENED'],
    });
    await expect(swiftrayClient.forDevice('promark-uuid').startTask()).resolves.toMatchObject({ success: false });
  });

  test('invalid uploads fail once instead of falling back to a second upload', async () => {
    const action = jest.spyOn(swiftrayClient, 'action').mockResolvedValue({ error: 'OUT_OF_BOUNDS', success: false });
    const blob = { text: async () => 'G1X100' } as Blob;

    await expect(swiftrayClient.forDevice('beamgo/A').upload(blob)).rejects.toThrow('OUT_OF_BOUNDS');
    expect(action).toHaveBeenCalledTimes(1);
  });

  test('reports a removed BeamGo as disconnected instead of leaving the Monitor running', async () => {
    jest.spyOn(swiftrayClient, 'action').mockResolvedValue({ error: 'DISCONNECTED', success: false });
    await expect(swiftrayClient.forDevice('beamgo/A').getDeviceStatus()).resolves.toMatchObject({
      disconnection: 1,
      st_id: 128,
    });
  });
});
