import alertCaller from 'app/actions/alert-caller';
import alertConstants from 'app/constants/alert-constants';
import deviceMaster from 'helpers/device-master';
import progressCaller from 'app/actions/progress-caller';
import i18n from 'helpers/i18n';
import { CurveMeasurer, InteractiveOptions } from 'interfaces/CurveMeasurer';

import { MeasureData } from 'interfaces/ICurveEngraving';
import BaseCurveMeasurer from './base';

export default class RedLightCurveMeasurer extends BaseCurveMeasurer implements CurveMeasurer {
  private hasTakenReference: boolean;

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

  showTakeReferenceDialog = async (): Promise<number | null> => {
    const { lang } = i18n;
    const progressId = 'take-reference';
    progressCaller.openNonstopProgress({ id: progressId });
    if (deviceMaster.currentControlMode !== 'red_laser_measure') {
      progressCaller.update(progressId, { message: lang.message.enteringRedLaserMeasureMode });
    }
    const res = await new Promise<number | null>((resolve) => {
      alertCaller.popUp({
        caption: lang.curve_engraving.take_reference,
        message: lang.curve_engraving.take_reference_desc,
        buttonType: alertConstants.CONFIRM_CANCEL,
        onConfirm: async () => {
          try {
            const z = await deviceMaster.takeReferenceZ();
            resolve(z);
          } catch (error) {
            alertCaller.popUpError({ message: `Failed to take reference ${error.message}` });
            resolve(null);
          }
        },
        onCancel: () => resolve(null),
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
        await deviceMaster.endRedLaserMeasureMode();
      }
    } catch (error) {
      console.error('Failed to exit red laser measure mode', error);
    }
  };

  measurePoint = async (x: number, y: number, feedrate: number): Promise<number | null> => {
    const z = await deviceMaster.measureZ({ X: x, Y: y, F: feedrate });
    return z;
  };

  async measurePoints(
    curData: MeasureData,
    targetIndices: Array<number>,
    opts?: InteractiveOptions
  ): Promise<MeasureData> {
    if (!this.hasTakenReference) {
      const res = await this.showTakeReferenceDialog();
      if (!res) return null;
    }
    const res = await super.measurePoints(curData, targetIndices, opts);
    return res;
  }
}
