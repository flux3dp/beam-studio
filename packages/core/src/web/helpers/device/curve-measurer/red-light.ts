import alertCaller from '@core/app/actions/alert-caller';
import progressCaller from '@core/app/actions/progress-caller';
import alertConstants from '@core/app/constants/alert-constants';
import deviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';
import type { CurveMeasurer, InteractiveOptions, MeasurePointData } from '@core/interfaces/CurveMeasurer';
import type { MeasureData } from '@core/interfaces/ICurveEngraving';

import BaseCurveMeasurer from './base';
import translateError from './translateError';

export default class RedLightCurveMeasurer extends BaseCurveMeasurer implements CurveMeasurer {
  private hasTakenReference: boolean = false;

  setup = async (onProgressText?: (text: string) => void): Promise<boolean> => {
    const res = await this.setupDevice();

    if (!res) return false;

    const { lang } = i18n;

    if (deviceMaster.currentControlMode !== 'red_laser_measure') {
      onProgressText?.(lang.message.enteringRedLaserMeasureMode);
      await deviceMaster.enterRedLaserMeasureMode();
    }

    return true;
  };

  /**
   * Check if the task is alive, if not, setup the device again,
   * set hasTakenReference to false if reconnected successfully
   * @returns {boolean} - Whether the task is alive or successfully reconnect the device
   */
  checkTaskAlive = async () => {
    const isAlive = await deviceMaster.checkTaskAlive();

    if (!isAlive) {
      const setupRes = await this.setup();

      if (!setupRes) return false;

      this.hasTakenReference = false;
    }

    return true;
  };

  showTakeReferenceDialog = async (): Promise<null | number> => {
    const { lang } = i18n;
    const progressId = 'take-reference';

    progressCaller.openNonstopProgress({ id: progressId });

    if (deviceMaster.currentControlMode !== 'red_laser_measure') {
      progressCaller.update(progressId, { message: lang.message.enteringRedLaserMeasureMode });
    }

    const res = await new Promise<null | number>((resolve) => {
      const t = i18n.lang.curve_engraving;

      alertCaller.popUp({
        buttonType: alertConstants.CONFIRM_CANCEL,
        caption: t.take_reference,
        message: t.take_reference_desc,
        onCancel: () => resolve(null),
        onConfirm: async () => {
          try {
            const isTaskAlive = await this.checkTaskAlive();

            if (!isTaskAlive) return;

            const z = await deviceMaster.takeReferenceZ();

            resolve(z);
          } catch (error) {
            let errorMsg: null | string = null;

            if (error instanceof Error) errorMsg = error.message;

            const { code, message } = translateError(errorMsg);

            if (code) alertCaller.popUpError({ message });
            else alertCaller.popUpError({ message: `${t.failed_to_take_reference}: ${message}` });

            resolve(null);
          }
        },
      });
    });

    if (res) this.hasTakenReference = true;

    progressCaller.popById(progressId);

    return res;
  };

  end = async (): Promise<void> => {
    if (!this.device) return;

    try {
      if (deviceMaster.currentControlMode === 'red_laser_measure') {
        await deviceMaster.endSubTask();
      }
    } catch (error) {
      console.error('Failed to exit red laser measure mode', error);
    }
  };

  measurePoint = async (x: number, y: number, feedrate: number): Promise<MeasurePointData> => {
    const data = await deviceMaster.measureZ({ F: feedrate, X: x, Y: y });

    return data;
  };

  override async measurePoints(
    curData: MeasureData,
    targetIndices: number[],
    opts?: InteractiveOptions,
  ): Promise<MeasureData | null> {
    if (this.hasTakenReference) {
      const res = await this.checkTaskAlive();

      if (!res) return null;
    }

    if (!this.hasTakenReference) {
      const res = await this.showTakeReferenceDialog();

      if (!res) return null;
    }

    const res = await super.measurePoints(curData, targetIndices, opts);

    return res;
  }
}
