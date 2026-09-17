import { sprintf } from 'sprintf-js';

import constant from '@core/app/actions/beambox/constant';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { swiftrayClient } from '@core/helpers/api/swiftray-client';
import deviceMaster from '@core/helpers/device-master';

import type { GalvoModule } from './galvoConfig';

/** Traced with the laser off, so the red pointer alone shows where the field lands. */
const FRAME_POWER = 0;
const FRAME_SPEED = 4000;

/**
 * Build the frame scene around a point, rather than around the origin, so the machine traces where
 * the head already is instead of homing first. The caller passes the position it read from the
 * machine; the square is centred on it.
 */
export const generateGalvoFrameScene = async ({
  center,
  module,
  width,
}: {
  center: { x: number; y: number };
  module: GalvoModule;
  width: number;
}): Promise<string> => {
  const resp = await fetch('fcode/hx2-galvo-frame.bvg');
  const template = await resp.text();
  const sizeInPx = width * constant.dpmm;

  return sprintf(template, {
    module,
    power: FRAME_POWER,
    speed: FRAME_SPEED,
    width: sizeInPx,
    x: center.x * constant.dpmm - sizeInPx / 2,
    y: center.y * constant.dpmm - sizeInPx / 2,
  });
};

/** Convert a scene through swiftray and hand back the task, without touching the canvas. */
export const convertSceneToTask = async (scene: string, model: WorkAreaModel): Promise<Blob> => {
  const uploadRes = await swiftrayClient.loadSVG(
    {
      data: scene,
      extension: 'svg',
      name: 'galvo-frame.svg',
      thumbnail: '',
      uploadName: 'galvo-frame.svg',
    },
    { onError: () => {}, onFinished: () => {}, onProgressing: () => {} },
    { model, rotaryMode: false },
  );

  if (!uploadRes.success) {
    throw new Error(uploadRes.error?.message ?? 'Failed to load the frame scene');
  }

  let taskBlob: Blob | null = null;
  const convertRes = await swiftrayClient.convert(
    'fcode',
    {
      onError: () => {},
      onFinished: (blob) => {
        taskBlob = blob;
      },
      onProgressing: () => {},
    },
    { isPromark: false, model, travelSpeed: FRAME_SPEED },
  );

  if (!convertRes.success) {
    throw new Error(convertRes.error?.message ?? 'Failed to convert the frame scene');
  }

  if (!taskBlob) throw new Error('The frame scene produced no task');

  return taskBlob;
};

/**
 * Trace the field of one galvo head where the gantry currently stands.
 *
 * Requires the head to be coupled to the nozzle: the galvo only reaches its own field, so the
 * gantry has to have been parked somewhere useful first.
 */
export const runGalvoFrame = async ({
  model,
  module,
  width,
}: {
  model: WorkAreaModel;
  module: GalvoModule;
  width: number;
}): Promise<void> => {
  const { x, y } = await deviceMaster.rawGetStatePos();
  const scene = await generateGalvoFrameScene({ center: { x, y }, module, width });
  const task = await convertSceneToTask(scene, model);

  await deviceMaster.go(task);
};
