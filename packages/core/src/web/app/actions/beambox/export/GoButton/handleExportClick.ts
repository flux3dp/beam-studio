import Dialog from '@core/app/actions/dialog-caller';
import progressCaller from '@core/app/actions/progress-caller';
import TutorialConstants from '@core/app/constants/tutorial-constants';
import { getNextStepRequirement, handleNextStep } from '@core/app/views/tutorials/tutorialController';
import checkDeviceStatus from '@core/helpers/check-device-status';
import { checkBlockedSerial } from '@core/helpers/device/checkBlockedSerial';
import getDevice from '@core/helpers/device/get-device';
import promarkButtonHandler from '@core/helpers/device/promark/promark-button-handler';
import isWeb from '@core/helpers/is-web';
import type { ILang } from '@core/interfaces/ILang';

import { checkModuleCalibration } from './checkModuleCalibration';
import { exportTask } from './exportTask';
import { handleExportAlerts } from './handleExportAlerts';

export const handleExportClick =
  (lang: ILang) =>
  async (byHandler = false): Promise<void> => {
    const progressList = ['retrieve-image-data', 'fetch-task-code', 'fetch-task', 'upload-scene'];

    if (Dialog.isIdExist('monitor') || progressList.some((id) => progressCaller.checkIdExist(id))) {
      return;
    }

    promarkButtonHandler.setStatus('preparing');

    if (getNextStepRequirement() === TutorialConstants.SEND_FILE) {
      handleNextStep();
    }

    const handleExport = async () => {
      try {
        const { device } = await getDevice();

        if (!device) {
          return;
        }

        const isSerialValid = await checkBlockedSerial(device.serial);

        if (!isSerialValid) {
          return;
        }

        const confirmed = await handleExportAlerts(device, lang);

        if (!confirmed) {
          return;
        }

        const deviceStatus = await checkDeviceStatus(device);

        if (!deviceStatus) {
          return;
        }

        await checkModuleCalibration(device, lang);
        await exportTask(device, byHandler, lang);
      } finally {
        promarkButtonHandler.handleTaskFinish();
      }
    };

    if (isWeb() && navigator.language !== 'da') {
      Dialog.forceLoginWrapper(handleExport, false, promarkButtonHandler.handleTaskFinish);
    } else {
      handleExport();
    }
  };
