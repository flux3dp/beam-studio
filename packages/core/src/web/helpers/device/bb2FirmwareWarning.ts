import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import { executeFirmwareUpdate } from '@core/app/actions/beambox/menuDeviceActions';
import i18n from '@core/helpers/i18n';
import versionChecker from '@core/helpers/version-checker';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

const noticedSerials: Set<string> = new Set();

const shouldShowWarning = (device: IDeviceInfo | null): device is IDeviceInfo => {
  if (!device?.version) return false;

  if (noticedSerials.has(device.serial)) return false;

  return !versionChecker(device.version).meetRequirement('BB2_STABLE');
};

export const showBb2FirmwareWarning = async (device: IDeviceInfo): Promise<void> => {
  if (!shouldShowWarning(device)) return;

  const t = i18n.lang.beambox.banner.firmware_warning;

  const res = await new Promise<boolean>((resolve) => {
    alertCaller.popUp({
      buttons: [
        {
          label: t.updateNow,
          onClick: () => resolve(true),
          type: 'primary',
        },
        { label: t.remindLater, onClick: () => resolve(false) },
      ],
      id: 'bb2-firmware-warning',
      message: sprintf(t.message, device.name, device.version),
      messageIcon: 'warning',
    });
  });

  if (res) await executeFirmwareUpdate(device);

  noticedSerials.add(device.serial);
};
