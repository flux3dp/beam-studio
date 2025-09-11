import alertCaller from '@core/app/actions/alert-caller';
import { modelsWithModules } from '@core/app/actions/beambox/constant';
import { showModuleCalibration } from '@core/app/components/dialogs/camera/ModuleCalibration';
import alertConstants from '@core/app/constants/alert-constants';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import workareaManager from '@core/app/svgedit/workarea';
import type { AlertConfigKey } from '@core/helpers/api/alert-config';
import alertConfig from '@core/helpers/api/alert-config';
import { getAllOffsets } from '@core/helpers/device/moduleOffsets';
import { getLayersByModule } from '@core/helpers/layer-module/layer-module-helper';
import type { IDeviceInfo } from '@core/interfaces/IDevice';
import type { ILang } from '@core/interfaces/ILang';

/**
 * checkModuleCalibration - Check if the module has been calibrated, currently only check the offset value from device
 */
export const checkModuleCalibration = async (device: IDeviceInfo, lang: ILang): Promise<void> => {
  const workarea = workareaManager.model;

  if (!modelsWithModules.has(workarea) || !modelsWithModules.has(device.model)) {
    return;
  }

  const deviceModuleOffsets = await getAllOffsets(workarea, { useCache: false });

  if (!deviceModuleOffsets) return;

  const checkCalibration = async (layerModule: LayerModuleType, alertTitle: string, alertMsg: string) => {
    const alertConfigKey = `skip-cali-${layerModule}-warning`;

    if (!deviceModuleOffsets[layerModule]?.[2] && !alertConfig.read(alertConfigKey as AlertConfigKey)) {
      const moduleLayers = [...getLayersByModule([layerModule], { checkRepeat: true, checkVisible: true })];

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
          await showModuleCalibration(layerModule);
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
