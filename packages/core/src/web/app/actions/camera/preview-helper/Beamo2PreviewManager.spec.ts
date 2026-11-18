const mockSelect = jest.fn();
const mockConnectCamera = jest.fn();
const mockDisconnectCamera = jest.fn();
const mockKick = jest.fn();

jest.mock('@core/helpers/device-master', () => ({
  connectCamera: (...args: any[]) => mockConnectCamera(...args),
  currentControlMode: '',
  disconnectCamera: (...args: any[]) => mockDisconnectCamera(...args),
  kick: (...args: any[]) => mockKick(...args),
  select: (...args: any[]) => mockSelect(...args),
}));

const mockHandlePreviewSetupError = jest.fn();

jest.mock(
  './handlePreviewSetupError',
  () =>
    (...args: any[]) =>
      mockHandlePreviewSetupError(...args),
);
jest.mock('./callWithRetry', () => (fn: () => unknown) => fn());
jest.mock('./FisheyePreviewManagerV4', () => jest.fn());
jest.mock('./DoorChecker', () => jest.fn().mockImplementation(() => ({ destroy: jest.fn() })));
jest.mock('@core/app/actions/beambox/preview-mode-background-drawer', () => ({}));
jest.mock('@core/app/svgedit/canvasBackground', () => ({ clearBackgroundImage: jest.fn(), setMaskImage: jest.fn() }));
jest.mock('@core/helpers/device/camera/cameraExposure', () => ({ setExposure: jest.fn() }));
jest.mock('@core/app/actions/message-caller', () => ({ closeMessage: jest.fn(), openMessage: jest.fn() }));
jest.mock('@core/app/actions/alert-caller', () => ({}));
jest.mock('@core/helpers/api/alert-config', () => ({}));
jest.mock('@core/app/svgedit/workarea', () => ({}));

import Beamo2PreviewManager from './Beamo2PreviewManager';

const device = { model: 'fbm2', name: 'beamo II', serial: 'S' } as any;

describe('Beamo2PreviewManager setup failure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelect.mockResolvedValue({ success: true });
    // e.g. RESOURCE_BUSY: another computer's auto preview took `task raw` first
    mockConnectCamera.mockRejectedValue(new Error('RESOURCE_BUSY'));
  });

  test('a silent (background) capture never kicks the client that holds the machine', async () => {
    expect(await new Beamo2PreviewManager(device).setup({ silent: true })).toBe(false);
    expect(mockDisconnectCamera).toHaveBeenCalled();
    expect(mockKick).not.toHaveBeenCalled();
    expect(mockHandlePreviewSetupError).not.toHaveBeenCalled();
  });

  test('a user-started preview still releases the machine with kick', async () => {
    expect(await new Beamo2PreviewManager(device).setup()).toBe(false);
    expect(mockKick).toHaveBeenCalledTimes(1);
    expect(mockHandlePreviewSetupError).toHaveBeenCalled();
  });
});
