import alertCaller from '@core/app/actions/alert-caller';
import progressCaller from '@core/app/actions/progress-caller';
import { getAddOnInfo } from '@core/app/constants/addOn';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import alertConfig from '@core/helpers/api/alert-config';
import deviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';
import { getData } from '@core/helpers/layer/layer-config-helper';
import versionChecker from '@core/helpers/version-checker';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

const doZSpeedLimitTest = async (device: IDeviceInfo): Promise<boolean> => {
  const addOnInfo = getAddOnInfo(device.model);

  if (!addOnInfo.curveEngraving) return true;

  const workareaObject = getWorkarea(device.model);

  if (!workareaObject.curveSpeedLimit?.zRegular) return true;

  const versionCheck = versionChecker(device.version);

  if (!versionCheck.meetRequirement('BB2_Z_SPEED_TEST')) return true;

  const {
    lang: { alert: tAlert, z_speed_limit_test: t },
  } = i18n;

  if (!alertConfig.read('skip-z-speed-test-info')) {
    await new Promise<void>((resolve) => {
      alertCaller.popUp({
        callbacks: resolve,
        checkbox: {
          callbacks: () => {
            alertConfig.write('skip-z-speed-test-info', true);
            resolve();
          },
          text: tAlert.dont_show_again,
        },
        message: t.alert_before,
      });
    });
  }

  try {
    const layers = [...document.querySelectorAll('#svgcontent > g.layer:not([display="none"])')];
    let zSpeed = workareaObject.curveSpeedLimit.zRegular!;

    if (workareaObject.curveSpeedLimit.zHighSpeed) {
      for (let i = 0; i < layers.length; i++) {
        if (getData(layers[i], 'ceZHighSpeed')) {
          zSpeed = workareaObject.curveSpeedLimit.zHighSpeed;
          break;
        }
      }
    }

    progressCaller.openNonstopProgress({
      id: 'z-speed-limit-test',
      message: t.testing,
    });
    await deviceMaster.enterZSpeedLimitTestMode();
    await deviceMaster.zSpeedLimitTestSetSpeed(zSpeed);

    const res = await deviceMaster.zSpeedLimitTestStart();

    if (!res) {
      const ignore = await new Promise<boolean>((resolve) => {
        alertCaller.popUp({
          buttons: [
            { label: t.ignore, onClick: () => resolve(true) },
            { label: t.retest, onClick: () => resolve(false), type: 'primary' },
          ],
          message: t.alert_failed,
        });
      });

      if (!ignore) {
        return doZSpeedLimitTest(device);
      }

      return ignore;
    }

    return true;
  } catch (error) {
    let errorMessage: string;

    if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      try {
        errorMessage = JSON.stringify(error);
      } catch {
        errorMessage = 'Unknown Error';
      }
    }

    alertCaller.popUpError({
      message: `Z Speed Limit Test Failed: ${errorMessage}`,
    });

    return false;
  } finally {
    if (deviceMaster.currentControlMode === 'z_speed_limit_test') await deviceMaster.endSubTask();

    progressCaller.popById('z-speed-limit-test');
  }
};

export default doZSpeedLimitTest;
