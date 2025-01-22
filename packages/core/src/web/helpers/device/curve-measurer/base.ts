/* eslint-disable ts/no-unused-vars */
import alertCaller from '@core/app/actions/alert-caller';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import checkDeviceStatus from '@core/helpers/check-device-status';
import deviceMaster from '@core/helpers/device-master';
import durationFormatter from '@core/helpers/duration-formatter';
import i18n from '@core/helpers/i18n';
import type { CurveMeasurer, InteractiveOptions } from '@core/interfaces/CurveMeasurer';
import type { MeasureData, Points } from '@core/interfaces/ICurveEngraving';
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
    lowest?: number,
  ): Promise<null | number> => {
    throw new Error('Not implemented');
  };

  async measurePoints(
    curData: MeasureData,
    targetIndices: number[],
    opts: InteractiveOptions = {},
  ): Promise<MeasureData> {
    const { lang } = i18n;
    const { checkCancel, onPointFinished, onProgressText } = opts;

    onProgressText?.(lang.curve_engraving.starting_measurement);

    const workarea = getWorkarea(this.device.model);
    const [offsetX, offsetY, offsetZ] = workarea.autoFocusOffset || [0, 0, 0];
    const feedrate = 6000;
    const { objectHeight, points } = curData;
    let { highest = null, lowest = null } = curData;
    // deep copy
    const newPoints = JSON.parse(JSON.stringify(points));
    const start = Date.now();
    const columns = newPoints[0].length;

    for (let i = 0; i < targetIndices.length; i += 1) {
      if (checkCancel?.()) {
        return null;
      }

      const idx = targetIndices[i];
      const row = Math.floor(idx / columns);
      const column = idx % columns;
      const point = newPoints[row][column];
      const [x, y] = point;

      try {
        const z = await this.measurePoint(x, y, feedrate, [offsetX, offsetY, offsetZ], objectHeight, lowest);
        const pointZ = typeof z === 'number' ? Math.max(0, z - offsetZ) : null;

        if (lowest === null || z > lowest) {
          lowest = z;
        } // actually the max measured value

        // actually the min measured value, use pointZ to display Plane when z is null
        if (highest === null || z < highest) {
          highest = pointZ;
        }

        newPoints[row][column][2] = pointZ;
      } catch (error) {
        console.error(`Failed to measure height at point ${x}, ${y}`, error);
      }

      const elapsedTime = Date.now() - start;
      const finished = i + 1;
      const finishedRatio = (i + 1) / targetIndices.length;
      const remainingTime = (elapsedTime / finishedRatio - elapsedTime) / 1000;

      onProgressText?.(`${lang.message.time_remaining} ${durationFormatter(remainingTime)}`);
      onPointFinished?.(finished);
    }

    return {
      ...curData,
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
      const totalPoints = xRange.length * yRange.length;
      const targetIndices = Array.from({ length: totalPoints }, (_, i) => i);
      const data = await this.measurePoints(
        {
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
      alertCaller.popUpError({ message: `Failed to measure area ${error.message}` });
      console.log(error);

      return null;
    }
  };
}
