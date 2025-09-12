/* eslint-disable ts/no-unused-vars */
import alertCaller from '@core/app/actions/alert-caller';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import checkDeviceStatus from '@core/helpers/check-device-status';
import deviceMaster from '@core/helpers/device-master';
import durationFormatter from '@core/helpers/duration-formatter';
import i18n from '@core/helpers/i18n';
import type { CurveMeasurer, InteractiveOptions, MeasurePointData } from '@core/interfaces/CurveMeasurer';
import type { Errors, MeasureData, Points } from '@core/interfaces/ICurveEngraving';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

export default class BaseCurveMeasurer implements CurveMeasurer {
  protected device: IDeviceInfo;

  constructor(device: IDeviceInfo) {
    this.device = device;
  }

  async setupDevice(): Promise<boolean> {
    const res = await deviceMaster.select(this.device);

    if (!res) {
      return false;
    }

    const deviceStatus = await checkDeviceStatus(this.device);

    if (!deviceStatus) {
      return false;
    }

    return true;
  }

  setup = async (): Promise<boolean> => {
    throw new Error('Not implemented');
  };

  end = async (): Promise<void> => {
    throw new Error('Not implemented');
  };

  measurePoint = async (
    x: number,
    y: number,
    feedrate: number,
    offset?: [number, number, number],
    objectHeight?: number,
    lowest?: null | number,
  ): Promise<MeasurePointData> => {
    throw new Error('Not implemented');
  };

  async measurePoints(
    curData: MeasureData,
    targetIndices: number[],
    opts: InteractiveOptions = {},
  ): Promise<MeasureData | null> {
    const {
      lang: { curve_engraving: t, message: tMessage },
    } = i18n;
    const { checkCancel, onPointFinished, onProgressText } = opts;

    onProgressText?.(t.starting_measurement);

    const { autoFocusOffset: [offsetX, offsetY, offsetZ] = [0, 0, 0] } = getWorkarea(this.device.model);
    const feedrate = 6000;
    const { errors, objectHeight, points } = curData;
    let { highest = null, lowest = null } = curData;
    // create new array to avoid mutation for react to update
    const newPoints = [...points] as Points;
    const newErrors = [...errors] as Errors;
    const start = Date.now();
    const columns = newPoints[0].length;

    for (let i = 0; i < targetIndices.length; i += 1) {
      if (checkCancel?.()) return null;

      const idx = targetIndices[i];
      const row = Math.floor(idx / columns);
      const column = idx % columns;
      const point = newPoints[row][column];
      const [x, y] = point;

      try {
        const {
          height: z,
          xOffset,
          yOffset,
        } = await this.measurePoint(x, y, feedrate, [offsetX, offsetY, offsetZ], objectHeight, lowest);

        if (typeof z === 'number') {
          const pointZ = Math.max(0, z - offsetZ);

          // actually the max measured value
          if (lowest === null || z > lowest) lowest = z;

          // actually the min measured value, use pointZ to display Plane when z is null
          if (highest === null || z < highest) highest = pointZ;

          newPoints[row][column][2] = pointZ;
          newErrors[row][column] = null;

          if (typeof xOffset === 'number') newPoints[row][column][3] = xOffset;

          if (typeof yOffset === 'number') newPoints[row][column][4] = yOffset;
        } else {
          newPoints[row][column][2] = null;
        }
      } catch (error) {
        newPoints[row][column][2] = null;
        newErrors[row][column] = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Failed to measure height at point ${x}, ${y}`, error);
      }

      const elapsedTime = Date.now() - start;
      const finished = i + 1;
      const finishedRatio = (i + 1) / targetIndices.length;
      const remainingTime = (elapsedTime / finishedRatio - elapsedTime) / 1000;

      onProgressText?.(`${tMessage.time_remaining} ${durationFormatter(remainingTime)}`);
      onPointFinished?.(finished);
    }

    return {
      ...curData,
      errors: newErrors,
      highest,
      lowest,
      points: newPoints,
    };
  }

  measureArea = async (
    xRange: number[],
    yRange: number[],
    objectHeight: number,
    opts: InteractiveOptions = {},
  ): Promise<MeasureData | null> => {
    try {
      const points: Points = yRange.map((y) => xRange.map((x) => [x, y, null]));
      const errors: Errors = yRange.map(() => xRange.map(() => null));
      const totalPoints = xRange.length * yRange.length;
      const targetIndices = Array.from({ length: totalPoints }, (_, i) => i);
      const data = await this.measurePoints(
        {
          errors,
          gap: [xRange[1] - xRange[0], yRange[1] - yRange[0]],
          highest: null,
          lowest: null,
          objectHeight,
          points,
        },
        targetIndices,
        opts,
      );

      return data;
    } catch (error) {
      if (error instanceof Error) alertCaller.popUpError({ message: `Failed to measure area ${error.message}` });
      else alertCaller.popUpError({ message: 'Failed to measure area' });

      return null;
    }
  };
}
