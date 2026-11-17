const mockYieldTo = jest.fn();
const mockEndSubTask = jest.fn();
const mockGetReport = jest.fn();
const mockOpenMessage = jest.fn();
const device = { model: 'fbm2', serial: 'S1', uuid: 'u1' };

jest.mock('@core/helpers/device/background', () => ({ yieldTo: (...args: unknown[]) => mockYieldTo(...args) }));
jest.mock('@core/helpers/device-master', () => ({
  currentDevice: { control: { getMode: () => 'raw', isConnected: true }, info: { serial: 'S1' } },
  endSubTask: (...args: unknown[]) => mockEndSubTask(...args),
  getReport: (...args: unknown[]) => mockGetReport(...args),
}));
jest.mock('@core/app/components/beambox/TopBar/contexts/TopBarController', () => ({
  getSelectedDevice: () => device,
}));
jest.mock('@core/app/actions/message-caller', () => ({
  __esModule: true,
  default: { openMessage: (...args: unknown[]) => mockOpenMessage(...args) },
  MessageLevel: { INFO: 'info' },
}));
jest.mock('@core/app/stores/documentStore', () => ({ useDocumentStore: { getState: () => ({ workarea: 'fbm2' }) } }));
jest.mock('@core/app/actions/dialog-caller', () => ({ selectDevice: jest.fn() }));
jest.mock('@core/helpers/check-software', () => () => true);
jest.mock('@core/helpers/i18n', () => ({ lang: { message: { device_not_found: { caption: 'not found' } } } }));
jest.mock('@core/implementations/storage', () => ({ get: jest.fn(), set: jest.fn() }));
jest.mock('./defaultDelayTable', () => ({ setDefaultDelayTable: jest.fn() }));
jest.mock('./fit-device-workarea-alert', () => jest.fn());
jest.mock('./promark/promark-info', () => ({ initPromarkInfo: jest.fn() }));

import getDevice from './get-device';

describe('getDevice', () => {
  beforeEach(() => jest.clearAllMocks());

  it('asks a busy background task to yield before ending its sub-task', async () => {
    mockYieldTo.mockResolvedValue(true);
    mockGetReport.mockResolvedValue({ st_id: 0 });

    const res = await getDevice();

    expect(mockYieldTo).toHaveBeenCalledWith(device);
    expect(mockYieldTo.mock.invocationCallOrder[0]).toBeLessThan(mockEndSubTask.mock.invocationCallOrder[0]);
    expect(res).toEqual({ device: { ...device, st_id: 0 }, isWorkareaMatched: true });
  });

  it('hands back no device, touching nothing, when the user keeps the background task', async () => {
    mockYieldTo.mockResolvedValue(false);

    expect(await getDevice()).toEqual({ device: null });
    expect(mockEndSubTask).not.toHaveBeenCalled();
    expect(mockGetReport).not.toHaveBeenCalled();
    expect(mockOpenMessage).not.toHaveBeenCalled();
  });
});
