import { sprintf } from 'sprintf-js';

import constant from '@core/app/actions/beambox/constant';
import { LaserType } from '@core/app/constants/promark-constants';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { swiftrayClient } from '@core/helpers/api/swiftray-client';
import { getDefaultConfig } from '@core/helpers/layer/layer-config-helper';

import { getPromarkInfo } from './promark-info';

export const loadTaskToSwiftray = async (scene: string, model: WorkAreaModel): Promise<void> => {
  const uploadRes = await swiftrayClient.loadSVG(
    {
      data: scene,
      extension: 'svg',
      name: 'calibration.svg',
      thumbnail: '',
      uploadName: 'calibration.svg',
    },
    { onError: () => {}, onFinished: () => {}, onProgressing: () => {} },
    { model, rotaryMode: false },
  );

  if (!uploadRes.success) {
    throw new Error(`Failed to load calibration task: ${uploadRes.error?.message ?? 'Unknown Error'}`);
  }

  const convertRes = await swiftrayClient.convert(
    'gcode',
    { onError: () => {}, onFinished: () => {}, onProgressing: () => {} },
    { isPromark: true, model, travelSpeed: 4000 },
  );

  if (!convertRes.success) {
    throw new Error(`Failed to convert calibration task: ${convertRes.error?.message ?? 'Unknown Error'}`);
  }
};

export const generateCalibrationTaskString = async ({
  power = 100,
  speed = 350,
  width,
}: {
  power?: number;
  speed?: number;
  width: number;
}): Promise<string> => {
  const fileName = 'fcode/promark-calibration.bvg';
  const resp = await fetch(fileName);
  let res = await resp.text();

  res = sprintf(res, { power, speed, width: width * constant.dpmm });

  return res;
};

export const loadCameraCalibrationTask = async (model: WorkAreaModel, width: number): Promise<void> => {
  const fileName = `fcode/promark-calibration-${width}.bvg`;
  const resp = await fetch(fileName);
  let scene = await resp.text();
  const defaultConfig = getDefaultConfig();
  const params = {
    frequency: defaultConfig.frequency ?? 27,
    power: 100,
    pulseWidth: defaultConfig.pulseWidth ?? 500,
    speed: 1000,
  };
  const { laserType, watt } = getPromarkInfo();

  if (laserType === LaserType.MOPA) {
    if (watt === 100) {
      params.power = 20;
    }
  } else if (watt === 50) {
    params.power = 40;
  }

  scene = sprintf(scene, params);
  await loadTaskToSwiftray(scene, model);
};

export default { loadCameraCalibrationTask };
