/* eslint-disable import/prefer-default-export */
import alertCaller from 'app/actions/alert-caller';
import alertConfig, { AlertConfigKey } from 'helpers/api/alert-config';
import alertConstants from 'app/constants/alert-constants';
import BeamboxPreference from 'app/actions/beambox/beambox-preference';
import CalibrationType from 'app/components/dialogs/camera/AdorCalibration/calibrationTypes';
import LayerModules, { modelsWithModules } from 'app/constants/layer-module/layer-modules';
import { IDeviceInfo } from 'interfaces/IDevice';
import { showAdorCalibration } from 'app/components/dialogs/camera/AdorCalibration';
import { ILang } from 'interfaces/ILang';

export const checkModuleCalibration = async (device: IDeviceInfo, lang: ILang): Promise<void> => {
  const workarea = BeamboxPreference.read('workarea');

  if (!modelsWithModules.has(workarea) || !modelsWithModules.has(device.model)) return;

  const moduleOffsets = BeamboxPreference.read('module-offsets') || {};
  const getLayers = (module: LayerModules) =>
    document.querySelectorAll(
      `#svgcontent > g.layer[data-module="${module}"]:not([display="none"]):not([data-repeat="0"])`
    );

  const checkCalibration = async (
    layerModule: LayerModules,
    calibrationType: CalibrationType,
    alertTitle: string,
    alertMsg: string
  ) => {
    const alertConfigKey = `skip-cali-${layerModule}-warning`;

    if (!moduleOffsets?.[layerModule] && !alertConfig.read(alertConfigKey as AlertConfigKey)) {
      const moduleLayers = [...getLayers(layerModule)];

      if (
        moduleLayers.some((g) =>
          Boolean(g.querySelector(':not(title):not(filter):not(g):not(feColorMatrix)'))
        )
      ) {
        const doCali = await new Promise((resolve) => {
          alertCaller.popUp({
            id: 'module-cali-warning',
            caption: alertTitle,
            message: alertMsg,
            buttonType: alertConstants.CONFIRM_CANCEL,
            onConfirm: () => resolve(true),
            onCancel: () => resolve(false),
          });
        });

        if (doCali) await showAdorCalibration(calibrationType);
      }
    }
  };
  const langNotification = lang.layer_module.notification;

  await checkCalibration(
    LayerModules.PRINTER,
    CalibrationType.PRINTER_HEAD,
    langNotification.performPrintingCaliTitle,
    langNotification.performPrintingCaliMsg
  );

  await checkCalibration(
    LayerModules.LASER_1064,
    CalibrationType.IR_LASER,
    langNotification.performIRCaliTitle,
    langNotification.performIRCaliMsg
  );
};
