import type { IDeviceInfo } from '@core/interfaces/IDevice';

const mockPopUp = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({ popUp: (...args: unknown[]) => mockPopUp(...args) }));

const mockExecuteFirmwareUpdate = jest.fn();

jest.mock('@core/app/actions/beambox/menuDeviceActions', () => ({
  executeFirmwareUpdate: (...args: unknown[]) => mockExecuteFirmwareUpdate(...args),
}));

import { showBb2FirmwareWarning } from './bb2FirmwareWarning';

const createDevice = (version: string, serial: string) => ({ name: 'My Beambox II', serial, version }) as IDeviceInfo;

describe('bb2FirmwareWarning', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecuteFirmwareUpdate.mockResolvedValue(undefined);
  });

  test('shows an alert that opens the firmware update flow', async () => {
    const device = createDevice('6.0.12', '1');

    const promise = showBb2FirmwareWarning(device);

    expect(mockPopUp).toHaveBeenCalledWith({
      buttons: [
        expect.objectContaining({ label: 'Update Now', type: 'primary' }),
        expect.objectContaining({ label: 'Remind Me Later' }),
      ],
      id: 'bb2-firmware-warning',
      message:
        'Your My Beambox II is running firmware v6.0.12, which may affect system stability. We recommend updating to the latest version.',
      messageIcon: 'warning',
    });

    const [{ buttons }] = mockPopUp.mock.calls[0];

    buttons[0].onClick();
    await promise;
    expect(mockExecuteFirmwareUpdate).toHaveBeenCalledWith(device);

    // Should not show the warning again for the same device
    await showBb2FirmwareWarning(device);
    expect(mockPopUp).toHaveBeenCalledTimes(1);
  });

  test('does not show an alert for supported firmware', async () => {
    showBb2FirmwareWarning(createDevice('6.0.13', '2'));

    expect(mockPopUp).not.toHaveBeenCalled();
  });
});
