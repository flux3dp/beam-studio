import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import { adorModels } from '@core/app/actions/beambox/constant';
import type { DetectedLayerModuleType, LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { DetectedLayerModule, LayerModule } from '@core/app/constants/layer-module/layer-modules';
import { getSupportedModules } from '@core/app/constants/workarea-constants';
import i18n from '@core/helpers/i18n';

const LaserModuleSet = new Set([LayerModule.LASER_10W_DIODE, LayerModule.LASER_20W_DIODE]);

export const getDefaultLaserModule = (): LayerModuleType => {
  const workarea = beamboxPreference.read('workarea');

  if (!adorModels.has(workarea)) {
    return LayerModule.LASER_UNIVERSAL;
  }

  const value = beamboxPreference.read('default-laser-module');

  return LaserModuleSet.has(value) ? value : LayerModule.LASER_20W_DIODE;
};

export const getPrintingModule = (): LayerModuleType => {
  const workarea = beamboxPreference.read('workarea');
  const supportedModules = getSupportedModules(workarea);

  if (supportedModules.includes(LayerModule.PRINTER_4C)) {
    return LayerModule.PRINTER_4C;
  }

  return LayerModule.PRINTER;
};

export const getModulesTranslations = (): Record<LayerModuleType, string> => {
  const t = i18n.lang.layer_module;

  return {
    [LayerModule.LASER_10W_DIODE]: t.laser_10w_diode,
    [LayerModule.LASER_20W_DIODE]: t.laser_20w_diode,
    [LayerModule.LASER_1064]: t.laser_2w_infrared,
    [LayerModule.LASER_UNIVERSAL]: t.general_laser,
    [LayerModule.PRINTER]: t.printing,
    [LayerModule.PRINTER_4C]: `${t.printing} (4C)`,
    [LayerModule.UV_PRINT]: t.uv_print,
    [LayerModule.UV_VARNISH]: t.uv_varnish,
    [LayerModule.UV_WHITE_INK]: t.uv_white_ink,
  };
};

export const getDetectedModulesTranslations = (): Record<DetectedLayerModuleType, string> => {
  const t = i18n.lang.layer_module;

  return {
    [DetectedLayerModule.LASER_10W_DIODE]: t.laser_10w_diode,
    [DetectedLayerModule.LASER_20W_DIODE]: t.laser_20w_diode,
    [DetectedLayerModule.LASER_1064]: t.laser_2w_infrared,
    [DetectedLayerModule.NONE]: t.none,
    [DetectedLayerModule.PRINTER]: t.printing,
    [DetectedLayerModule.PRINTER_4C]: `${t.printing} (4C)`,
    [DetectedLayerModule.PRINTER_4C_WITH_1064]: `${t.printing} (4C + 1064)`,
    [DetectedLayerModule.PRINTER_4C_WITH_UV]: `${t.printing} (4C + UV)`,
    [DetectedLayerModule.PRINTER_4C_WITH_UV_1064]: `${t.printing} (4C + UV + 1064)`,
    [DetectedLayerModule.UNKNOWN]: t.unknown,
  };
};
