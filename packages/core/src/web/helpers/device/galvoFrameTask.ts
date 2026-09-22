import Progress from '@core/app/actions/progress-caller';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getExportOpt } from '@core/helpers/api/svg-laser-parser';
import { swiftrayClient } from '@core/helpers/api/swiftray-client';
import { generateCalibrationTaskString } from '@core/helpers/device/promark/calibration';
import deviceMaster from '@core/helpers/device-master';

import type { GalvoModule } from './galvoConfig';

/** The pointer pass runs with the laser off, so only the red dot marks the field out. */
export const redLightFrameParameters = { power: 0, speed: 4000 } as const;

const PROGRESS_ID = 'galvo-frame';

/**
 * Trace the field of one galvo head around wherever the gantry already stands.
 *
 * The scene is the square the Promark dialog uses, sized to the field and tagged with the head
 * under test. Its job origin is forced to the middle of that square, so the machine places the
 * frame around its current position instead of homing and losing the spot the operator chose.
 *
 * Requires the head to be connected to the nozzle: a galvo reaches only its own field.
 */
export const runGalvoFrame = async ({
  model,
  module,
  power,
  speed,
  width,
}: {
  model: WorkAreaModel;
  module: GalvoModule;
  power: number;
  speed: number;
  width: number;
}): Promise<void> => {
  const scene = await generateCalibrationTaskString({ module, power, speed, width });

  Progress.openNonstopProgress({ id: PROGRESS_ID, message: '' });

  try {
    const loadRes = await swiftrayClient.loadSVG(
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

    if (!loadRes.success) throw new Error(loadRes.error?.message ?? 'Failed to load the frame scene');

    const baseConfig = {
      forceJobOrigin: [width / 2, width / 2] as [number, number],
      ignoreDocumentAddOns: true,
      model,
    };
    const taskConfig = { ...baseConfig, ...(await getExportOpt(baseConfig)).config };
    let task: Blob | null = null;

    const convertRes = await swiftrayClient.convert(
      'fcode',
      {
        onError: () => {},
        onFinished: (blob) => {
          task = blob;
        },
        onProgressing: () => {},
      },
      { ...taskConfig, isPromark: false, useActualWorkarea: true } as any,
    );

    if (!convertRes.success) throw new Error(convertRes.error?.message ?? 'Failed to convert the frame scene');

    if (!task) throw new Error('The frame scene produced no task');

    await deviceMaster.go(task);
  } finally {
    Progress.popById(PROGRESS_ID);
  }
};
