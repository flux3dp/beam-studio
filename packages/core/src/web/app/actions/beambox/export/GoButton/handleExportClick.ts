import previewModeController from '@core/app/actions/beambox/preview-mode-controller';
import canvasEvents from '@core/app/actions/canvas/canvasEvents';
import Dialog from '@core/app/actions/dialog-caller';
import progressCaller from '@core/app/actions/progress-caller';
import { getNextStepRequirement, handleNextStep } from '@core/app/components/tutorials/tutorialController';
import TutorialConstants from '@core/app/constants/tutorial-constants';
import textActions from '@core/app/svgedit/text/textactions';
import checkDeviceStatus from '@core/helpers/check-device-status';
import { checkBlockedSerial } from '@core/helpers/device/checkBlockedSerial';
import getDevice from '@core/helpers/device/get-device';
import promarkButtonHandler from '@core/helpers/device/promark/promark-button-handler';
import { isCanvasEmpty } from '@core/helpers/layer/checkContent';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { ILang } from '@core/interfaces/ILang';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { checkModuleCalibration } from './checkModuleCalibration';
import { exportTask } from './exportTask';
import { handleExportAlerts } from './handleExportAlerts';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

const isRelatedModalsExist = (): boolean => {
  const progressList = [
    'preparing-export',
    'retrieve-image-data',
    'fetch-task-code',
    'fetch-task',
    'upload-scene',
  ] as const;

  return Dialog.isIdExist('monitor') || progressList.some((id) => progressCaller.checkIdExist(id));
};

export const handleExportClick =
  (lang: ILang) =>
  async (byHandler = false): Promise<void> => {
    try {
      if (previewModeController.isPreviewMode) await previewModeController.end();

      if (isRelatedModalsExist()) return;

      progressCaller.openNonstopProgress({ id: 'preparing-export' });

      if (isCanvasEmpty()) return;

      promarkButtonHandler.setStatus('preparing');
      // remove all selected elements, to prevent the svg image resource not found
      textActions.clear();
      svgCanvas.selectOnly([]);
      canvasEvents.setSelectedElement(null);

      if (getNextStepRequirement() === TutorialConstants.SEND_FILE) handleNextStep();

      const { device } = await getDevice();

      if (!device) return;

      if (!(await checkBlockedSerial(device.serial))) return;

      if (!(await handleExportAlerts(device, lang))) return;

      if (!(await checkDeviceStatus(device))) return;

      await checkModuleCalibration(device, lang);
      await exportTask(device, byHandler, lang);
    } finally {
      progressCaller.popById('preparing-export');
      promarkButtonHandler.handleTaskFinish();
    }
  };
