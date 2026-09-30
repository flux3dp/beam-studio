import React from 'react';

import alertCaller from '@core/app/actions/alert-caller';
import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import TopBarController from '@core/app/components/beambox/TopBar/contexts/TopBarController';
import { checkOpenCvSupport } from '@core/helpers/api/open-cv';
import checkDeviceStatus from '@core/helpers/check-device-status';
import deviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';
import isWeb from '@core/helpers/is-web';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import { PRINT_AND_CUT_CALIBRATION_DIALOG_ID, PRINT_AND_CUT_DIALOG_ID } from '../constants';

import PrintAndCutCalibration from './PrintAndCutCalibration';

export const showPrintAndCutCalibration = async (device: IDeviceInfo): Promise<void> => {
  // the calibration borrows the print-and-cut store, so the two cannot coexist
  if (isIdExist(PRINT_AND_CUT_CALIBRATION_DIALOG_ID) || isIdExist(PRINT_AND_CUT_DIALOG_ID)) return;

  if (isWeb() && !(await checkOpenCvSupport('imageContour'))) {
    alertCaller.popUpError({ message: i18n.lang.print_and_cut.backend_outdated });

    return;
  }

  if (!(await checkDeviceStatus(device))) return;

  if (!(await deviceMaster.select(device)).success) return;

  // the camera preview and the fcode export resolve their machine through the
  // top bar selection, so the menu's device must become that selection
  TopBarController.setSelectedDevice(device);

  addDialogComponent(
    PRINT_AND_CUT_CALIBRATION_DIALOG_ID,
    <PrintAndCutCalibration device={device} onClose={() => popDialogById(PRINT_AND_CUT_CALIBRATION_DIALOG_ID)} />,
  );
};
