import canvasEvents from '@core/app/actions/canvas/canvasEvents';
import Dialog from '@core/app/actions/dialog-caller';
import progressCaller from '@core/app/actions/progress-caller';
import TutorialConstants from '@core/app/constants/tutorial-constants';
import textActions from '@core/app/svgedit/text/textactions';
import { getNextStepRequirement, handleNextStep } from '@core/app/views/tutorials/tutorialController';
import checkDeviceStatus from '@core/helpers/check-device-status';
import { checkBlockedSerial } from '@core/helpers/device/checkBlockedSerial';
import getDevice from '@core/helpers/device/get-device';
import promarkButtonHandler from '@core/helpers/device/promark/promark-button-handler';
import isWeb from '@core/helpers/is-web';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { ILang } from '@core/interfaces/ILang';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { exportTask } from './exportTask';
import { handleExportAlerts } from './handleExportAlerts';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

export const handleExportClick =
  (lang: ILang) =>
  async (byHandler = false): Promise<void> => {
    const progressList = ['retrieve-image-data', 'fetch-task-code', 'fetch-task', 'upload-scene'] as const;

    if (Dialog.isIdExist('monitor') || progressList.some((id) => progressCaller.checkIdExist(id))) return;

    promarkButtonHandler.setStatus('preparing');
    // remove all selected elements, to prevent the svg image resource not found
    textActions.clear();
    svgCanvas.selectOnly([]);
    canvasEvents.setSelectedElement(null);

    if (getNextStepRequirement() === TutorialConstants.SEND_FILE) handleNextStep();

    const handleExport = async () => {
      try {
        const { device } = await getDevice();

        if (!device) return;

        if (!(await checkBlockedSerial(device.serial))) return;

        if (!(await handleExportAlerts(device, lang))) return;

        if (!(await checkDeviceStatus(device))) return;

        // await checkModuleCalibration(device, lang);
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
