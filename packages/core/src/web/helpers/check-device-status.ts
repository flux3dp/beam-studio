/**
 * check device status and action
 */
import i18n from '@core/helpers/i18n';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import alertCaller from '../app/actions/alert-caller';
import previewModeController from '../app/actions/beambox/preview-mode-controller';
import Progress from '../app/actions/progress-caller';
import alertConstants from '../app/constants/alert-constants';
import DeviceConstants from '../app/constants/device-constants';

import DeviceMaster from './device-master';

export default async function (device: IDeviceInfo, allowPause?: boolean, forceAbort?: boolean) {
  if (!device) return;

  if (previewModeController.isPreviewMode || previewModeController.isStarting) {
    if (previewModeController.currentDevice?.uuid !== device.uuid) {
      await previewModeController.end();
    } else {
      return new Promise<boolean>((resolve) => {
        alertCaller.popUp({
          buttonType: alertConstants.YES_NO,
          message: i18n.lang.message.device_is_used,
          onNo: () => resolve(false),
          onYes: async () => {
            console.log('?');
            await previewModeController.end({ shouldWaitForEnd: true });
            resolve(true);
          },
        });
      });
    }
  }

  // eslint-disable-next-line no-async-promise-executor
  return new Promise<boolean>(async (resolve) => {
    const onYes = async (type: 'abort' | 'kick') => {
      let timer: NodeJS.Timeout;

      const res = await DeviceMaster.select(device);

      if (!res.success) {
        resolve(false);

        return;
      }

      switch (type) {
        case 'kick':
          await DeviceMaster.kick();
          await new Promise((resolve) => setTimeout(resolve, 500));
          resolve(true);
          break;
        case 'abort':
          Progress.openNonstopProgress({
            id: 'device-master-abort',
            timeout: 30000,
          });
          await DeviceMaster.stop();
          timer = setInterval(async () => {
            const report = await DeviceMaster.getReport();

            if (report.st_id === DeviceConstants.status.ABORTED) {
              setTimeout(function () {
                DeviceMaster.quit();
              }, 500);
            } else if (report.st_id === DeviceConstants.status.IDLE) {
              clearInterval(timer);
              Progress.popById('device-master-abort');
              resolve(true);
            }
          }, 1000);
          break;
      }
    };

    const t = i18n.lang.message;

    switch (device.st_id) {
      case null:
      case undefined:
      case DeviceConstants.status.IDLE:
        resolve(true);
        break;
      case DeviceConstants.status.TASK_CARTDRIDGE_IO:
      case DeviceConstants.status.TASK_RAW:
      case DeviceConstants.status.TASK_SCAN:
      case DeviceConstants.status.TASK_MAINTAIN:
      case DeviceConstants.status.TASK_REDLIGHT:
        // ask kick?
        alertCaller.popUp({
          buttonType: alertConstants.YES_NO,
          id: 'kick',
          message: t.device_is_used,
          onNo: () => resolve(false),
          onYes: () => onYes('kick'),
        });
        break;
      case DeviceConstants.status.COMPLETED:
      case DeviceConstants.status.ABORTED:
        // quit
        // eslint-disable-next-line no-case-declarations
        const res = await DeviceMaster.select(device);

        if (res.success) {
          await DeviceMaster.quit();
          resolve(true);
        } else {
          resolve(false);
        }

        break;
      case DeviceConstants.status.RUNNING:
      case DeviceConstants.status.PAUSED:
      case DeviceConstants.status.PAUSED_FROM_STARTING:
      case DeviceConstants.status.PAUSED_FROM_RUNNING:
      case DeviceConstants.status.PAUSING_FROM_STARTING:
      case DeviceConstants.status.PAUSING_FROM_RUNNING:
        if (allowPause) {
          resolve(true);
        } else {
          // ask for abort
          if (forceAbort) {
            onYes('abort');
          } else {
            alertCaller.popUp({
              buttonType: alertConstants.YES_NO,
              id: 'abort',
              message: t.device_is_used,
              onNo: () => resolve(false),
              onYes: () => onYes('abort'),
            });
          }
        }

        break;
      default:
        // device busy
        console.log('Device Busy ', device.st_id);
        alertCaller.popUp({ caption: t.device_busy.caption, message: t.device_busy.message });
        break;
    }
  });
}
