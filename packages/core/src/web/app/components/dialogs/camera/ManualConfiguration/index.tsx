import React from 'react';

import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import checkDeviceStatus from '@core/helpers/check-device-status';
import deviceMaster from '@core/helpers/device-master';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import ManualConfiguration from './ManualConfiguration';

export const MANUAL_CONFIGURATION_DIALOG_ID = 'manual-configuration';

/**
 * Calibration ▸ Manual Configuration: edit stored calibration values by hand, no laser, no motion.
 * May open during a preview session; saved values apply from the next session, which refetches them.
 */
export const showManualConfiguration = async (device: IDeviceInfo): Promise<void> => {
  if (isIdExist(MANUAL_CONFIGURATION_DIALOG_ID)) return;

  if (!(await checkDeviceStatus(device))) return;

  if (!(await deviceMaster.select(device)).success) return;

  addDialogComponent(
    MANUAL_CONFIGURATION_DIALOG_ID,
    <ManualConfiguration device={device} onClose={() => popDialogById(MANUAL_CONFIGURATION_DIALOG_ID)} />,
  );
};
