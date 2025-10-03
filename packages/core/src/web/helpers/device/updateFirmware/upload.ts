import { match } from 'ts-pattern';

import progressCaller from '@core/app/actions/progress-caller';
import deviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import { handleUpdateFinish } from './handleUpdateFinish';

export const uploadToDevice = async (device: IDeviceInfo, file: File, type: 'firmware' | 'mainboard' = 'firmware') => {
  const res = await deviceMaster.select(device);
  const { lang } = i18n;

  if (res.success) {
    progressCaller.openSteppingProgress({
      caption: lang.topbar.menu.update_firmware,
      id: 'update-firmware',
      message: lang.update.updating,
    });
    try {
      const uploadFunction = match(type)
        .with('firmware', () => deviceMaster.updateFirmware)
        .with('mainboard', () => deviceMaster.updateMainboard)
        .exhaustive();

      await uploadFunction(file, (r) => {
        const percentage = Number(r.percentage || 0).toFixed(2);

        progressCaller.update('update-firmware', {
          caption: lang.topbar.menu.update_firmware,
          message: `${lang.update.updating} (${percentage}%)`,
          percentage,
        });
      });
      handleUpdateFinish(true);
    } catch {
      handleUpdateFinish(false);
    }
    progressCaller.popById('update-firmware');
  }
};
