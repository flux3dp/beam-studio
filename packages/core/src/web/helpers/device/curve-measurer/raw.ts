import deviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';
import type { CurveMeasurer } from '@core/interfaces/CurveMeasurer';

import BaseCurveMeasurer from './base';

export default class RawModeCurveMeasurer extends BaseCurveMeasurer implements CurveMeasurer {
  private currentPosition: { x: number; y: number };

  setup = async (onProgressText?: (text: string) => void): Promise<boolean> => {
    const res = await this.setupDevice();

    if (!res) {
      return false;
    }

    const { lang } = i18n;

    if (deviceMaster.currentControlMode !== 'raw') {
      onProgressText?.(lang.message.enteringRawMode);
      await deviceMaster.enterRawMode();
    }

    onProgressText(lang.message.homing);
    await deviceMaster.rawHome();

    return true;
  };

  end = async (): Promise<void> => {
    if (!this.device) {
      return;
    }

    try {
      if (deviceMaster.currentControlMode === 'raw') {
        await deviceMaster.rawLooseMotor();
        await deviceMaster.endSubTask();
      }
    } catch (error) {
      console.error('Failed to end measure mode', error);
    }
  };

  measurePoint = async (
    x: number,
    y: number,
    feedrate: number,
    offset?: [number, number, number],
    objectHeight?: number,
    lowest?: number,
  ): Promise<null | number> => {
    const target = offset ? [Math.max(x - offset[0], 0), Math.max(y - offset[1], 0)] : [x, y];
    const [targetX, targetY] = target;

    await deviceMaster.rawMove({ f: feedrate, x: targetX, y: targetY });

    if (this.currentPosition) {
      const dist = Math.hypot(targetX - this.currentPosition.x, targetY - this.currentPosition.y);
      const time = (dist / feedrate) * 60;

      await new Promise((resolve) => setTimeout(resolve, time * 1000));
      this.currentPosition = { x: targetX, y: targetY };
    }

    const z = await deviceMaster.rawMeasureHeight(
      lowest === null ? { relZ: objectHeight } : { baseZ: Math.max(lowest - objectHeight, 0) },
    );

    return z;
  };
}
