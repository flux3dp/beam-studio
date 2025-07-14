import alertCaller from '@core/app/actions/alert-caller';
import BeamboxPreference from '@core/app/actions/beambox/beambox-preference';
import { modelsWithModules } from '@core/app/actions/beambox/constant';
import { showAdorCalibration } from '@core/app/components/dialogs/camera/AdorCalibration';
import alertConstants from '@core/app/constants/alert-constants';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import type { AlertConfigKey } from '@core/helpers/api/alert-config';
import alertConfig from '@core/helpers/api/alert-config';
import { getModuleOffsets } from '@core/helpers/device/moduleOffsets';
import type { IDeviceInfo } from '@core/interfaces/IDevice';
import type { ILang } from '@core/interfaces/ILang';

// Fixme: checkCalibration won't show any alert since the return value of getModuleOffsets is always truthy
// Update the logic to check if the module is calibrated or not
export const checkModuleCalibration = async (device: IDeviceInfo, lang: ILang): Promise<void> => {
  const workarea = BeamboxPreference.read('workarea');

  if (!modelsWithModules.has(workarea) || !modelsWithModules.has(device.model)) {
    return;
  }

  const getLayers = (module: LayerModuleType) =>
    document.querySelectorAll(
      `#svgcontent > g.layer[data-module="${module}"]:not([display="none"]):not([data-repeat="0"])`,
    );

  const checkCalibration = async (layerModule: LayerModuleType, alertTitle: string, alertMsg: string) => {
    const alertConfigKey = `skip-cali-${layerModule}-warning`;

    if (!getModuleOffsets({ module: layerModule, workarea }) && !alertConfig.read(alertConfigKey as AlertConfigKey)) {
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
          await showAdorCalibration(layerModule);
        }
      }
    }
  };
  const langNotification = lang.layer_module.notification;

  [LayerModule.PRINTER, LayerModule.PRINTER_4C, LayerModule.UV_WHITE_INK, LayerModule.UV_VARNISH].forEach(
    async (module) => {
      await checkCalibration(
        module,
        langNotification.performPrintingCaliTitle,
        langNotification.performPrintingCaliMsg,
      );
    },
  );

  await checkCalibration(
    LayerModule.LASER_1064,
    langNotification.performIRCaliTitle,
    langNotification.performIRCaliMsg,
  );
};
