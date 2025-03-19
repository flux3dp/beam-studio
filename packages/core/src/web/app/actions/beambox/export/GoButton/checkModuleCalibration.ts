import alertCaller from '@core/app/actions/alert-caller';
import BeamboxPreference from '@core/app/actions/beambox/beambox-preference';
import { modelsWithModules } from '@core/app/actions/beambox/constant';
import { showAdorCalibration } from '@core/app/components/dialogs/camera/AdorCalibration';
import CalibrationType from '@core/app/components/dialogs/camera/AdorCalibration/calibrationTypes';
import alertConstants from '@core/app/constants/alert-constants';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import type { AlertConfigKey } from '@core/helpers/api/alert-config';
import alertConfig from '@core/helpers/api/alert-config';
import type { IDeviceInfo } from '@core/interfaces/IDevice';
import type { ILang } from '@core/interfaces/ILang';

export const checkModuleCalibration = async (device: IDeviceInfo, lang: ILang): Promise<void> => {
  const workarea = BeamboxPreference.read('workarea');

  if (!modelsWithModules.has(workarea) || !modelsWithModules.has(device.model)) {
    return;
  }

  const moduleOffsets = BeamboxPreference.read('module-offsets');
  const getLayers = (module: LayerModule) =>
    document.querySelectorAll(
      `#svgcontent > g.layer[data-module="${module}"]:not([display="none"]):not([data-repeat="0"])`,
    );

  const checkCalibration = async (
    layerModule: LayerModule,
    calibrationType: CalibrationType,
    alertTitle: string,
    alertMsg: string,
  ) => {
    const alertConfigKey = `skip-cali-${layerModule}-warning`;

    if (!moduleOffsets?.[layerModule] && !alertConfig.read(alertConfigKey as AlertConfigKey)) {
      const moduleLayers = [...getLayers(layerModule)];

      if (moduleLayers.some((g) => Boolean(g.querySelector(':not(title):not(filter):not(g):not(feColorMatrix)')))) {
        const doCali = await new Promise((resolve) => {
          alertCaller.popUp({
            buttonType: alertConstants.CONFIRM_CANCEL,
            caption: alertTitle,
            id: 'module-cali-warning',
            message: alertMsg,
            onCancel: () => resolve(false),
            onConfirm: () => resolve(true),
          });
        });

        if (doCali) {
          await showAdorCalibration(calibrationType);
        }
      }
    }
  };
  const langNotification = lang.layer_module.notification;

  await checkCalibration(
    LayerModule.PRINTER,
    CalibrationType.PRINTER_HEAD,
    langNotification.performPrintingCaliTitle,
    langNotification.performPrintingCaliMsg,
  );

  await checkCalibration(
    LayerModule.LASER_1064,
    CalibrationType.IR_LASER,
    langNotification.performIRCaliTitle,
    langNotification.performIRCaliMsg,
  );
};
