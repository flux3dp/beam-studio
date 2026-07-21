import React from 'react';

import alertCaller from '@core/app/actions/alert-caller';
import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import progressCaller from '@core/app/actions/progress-caller';
import { getLaserDelayTable } from '@core/helpers/device/laserDelayTable';

import LaserDelaySettingPanel from './LaserDelaySettingPanel';

const generateDefaultData = (): Record<string, number> => {
  const data: Record<string, number> = {};

  for (let speed = 100; speed <= 2000; speed += 100) {
    data[`S${speed}`] = 1500;
  }

  return data;
};

export const showLaserDelaySettingPanel = async (): Promise<void> => {
  const id = 'laser-delay-setting';

  if (isIdExist(id)) {
    return;
  }

  progressCaller.openNonstopProgress({ id: 'fetch-laser-delay', message: 'Fetching laser delay settings' });

  let initData: Record<string, number>;

  try {
    initData = await getLaserDelayTable();
  } catch (error) {
    let errorMessage: string;

    if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      try {
        errorMessage = JSON.stringify(error);
      } catch {
        errorMessage = String(error);
      }
    }

    alertCaller.popUpError({ message: `Failed to get laser_delay: ${errorMessage}` });
    initData = generateDefaultData();
  } finally {
    progressCaller.popById('fetch-laser-delay');
  }

  addDialogComponent(id, <LaserDelaySettingPanel initData={initData} onClose={() => popDialogById(id)} />);
};
