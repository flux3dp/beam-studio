import alertCaller from '@core/app/actions/alert-caller';
import { getSupportInfo } from '@core/app/constants/add-on';
import alertConfig from '@core/helpers/api/alert-config';
import deviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';
import { getData } from '@core/helpers/layer/layer-config-helper';
import versionChecker from '@core/helpers/version-checker';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

const doZSpeedLimitTest = async (device: IDeviceInfo): Promise<boolean> => {
  const supportInfo = getSupportInfo(device.model);

  if (!supportInfo.curveEngraving) return true;

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
    let zSpeed = 140;

    for (let i = 0; i < layers.length; i++) {
      zSpeed = Math.max(zSpeed, getData(layers[i], 'ceZSpeedLimit'));
    }

    await deviceMaster.enterZSpeedLimitTestMode();
    await deviceMaster.zSpeedLimitTestSetSpeed(zSpeed);

    const res = await deviceMaster.zSpeedLimitTestStart();

    if (!res) {
      return new Promise<boolean>((resolve) => {
        alertCaller.popUp({
          buttons: [
            { onClick: () => resolve(doZSpeedLimitTest(device)), title: t.retest },
            { onClick: () => resolve(true), title: t.ignore },
          ],
          message: t.alert_failed,
          primaryButtonIndex: 0,
        });
      });
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
  }
};

export default doZSpeedLimitTest;
