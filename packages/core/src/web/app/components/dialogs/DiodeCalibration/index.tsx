import React from 'react';

import dialogCaller from '@core/app/actions/dialog-caller';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import DiodeCalibration from './Component';

export const showDiodeCalibration = (device: IDeviceInfo): void => {
  if (dialogCaller.isIdExist('diode-cali')) {
    return;
  }

  dialogCaller.addDialogComponent(
    'diode-cali',
    <DiodeCalibration device={device} onClose={() => dialogCaller.popDialogById('diode-cali')} />,
  );
};
