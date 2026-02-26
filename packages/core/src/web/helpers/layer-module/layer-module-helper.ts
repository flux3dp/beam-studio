import { adorModels } from '@core/app/actions/beambox/constant';
import type { DetectedLayerModuleType, LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { DetectedLayerModule, LayerModule } from '@core/app/constants/layer-module/layer-modules';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getSupportedModules } from '@core/app/constants/workarea-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import i18n from '@core/helpers/i18n';

const LaserModuleSet = new Set([LayerModule.LASER_10W_DIODE, LayerModule.LASER_20W_DIODE]);

export const getDefaultModule = (workarea?: WorkAreaModel): LayerModuleType => {
  workarea = workarea ?? useDocumentStore.getState().workarea;

  if (adorModels.has(workarea)) {
    const value = useGlobalPreferenceStore.getState()['default-laser-module'];

    return LaserModuleSet.has(value) ? value : LayerModule.LASER_20W_DIODE;
  }

  const supportedModules = getSupportedModules(workarea);

  return supportedModules.includes(LayerModule.LASER_UNIVERSAL) ? LayerModule.LASER_UNIVERSAL : supportedModules[0];
};

export const getPrintingModule = (workarea?: WorkAreaModel): LayerModuleType | null => {
  workarea = workarea ?? useDocumentStore.getState().workarea;

  const supportedModules = getSupportedModules(workarea);

  if (supportedModules.includes(LayerModule.PRINTER_4C)) {
    return LayerModule.PRINTER_4C;
  }

  return supportedModules.includes(LayerModule.PRINTER) ? LayerModule.PRINTER : null;
};

export const getModulesTranslations = (shouldNote4C = false): Record<LayerModuleType, string> => {
  const t = i18n.lang.layer_module;

  return {
    [LayerModule.LASER_10W_DIODE]: t.laser_10w_diode,
    [LayerModule.LASER_20W_DIODE]: t.laser_20w_diode,
    [LayerModule.LASER_1064]: t.laser_2w_infrared,
    [LayerModule.LASER_UNIVERSAL]: t.general_laser,
    [LayerModule.PRINTER]: t.printing,
    [LayerModule.PRINTER_4C]: shouldNote4C ? `${t.printing} (4C)` : t.printing,
    [LayerModule.UV_PRINT]: t.uv_print,
    [LayerModule.UV_VARNISH]: t.uv_varnish,
    [LayerModule.UV_WHITE_INK]: t.uv_white_ink,
  };
};

export const getDetectedModulesTranslations = (shouldNote4C = false): Record<DetectedLayerModuleType, string> => {
  const t = i18n.lang.layer_module;
  const printer4CText = shouldNote4C ? `${t.printing} (4C)` : t.printing;

  return {
    [DetectedLayerModule.LASER_10W_DIODE]: t.laser_10w_diode,
    [DetectedLayerModule.LASER_20W_DIODE]: t.laser_20w_diode,
    [DetectedLayerModule.LASER_1064]: t.laser_2w_infrared,
    [DetectedLayerModule.NONE]: t.none,
    [DetectedLayerModule.PRINTER]: t.printing,
    [DetectedLayerModule.PRINTER_4C]: printer4CText,
    [DetectedLayerModule.PRINTER_4C_WITH_1064]: `${printer4CText} + 1064`,
    [DetectedLayerModule.PRINTER_4C_WITH_UV]: `${printer4CText} + UV`,
    [DetectedLayerModule.PRINTER_4C_WITH_UV_1064]: `${printer4CText} + UV + 1064`,
    [DetectedLayerModule.UNKNOWN]: t.unknown,
  };
};

type SelectorOpt = { checkRepeat?: boolean; checkVisible?: boolean };

const getSelector = (
  modules: LayerModuleType[],
  { checkRepeat = false, checkVisible = false }: SelectorOpt = {},
): string => {
  let query = 'g.layer[data-module="{module}"]';

  if (checkVisible) query += ':not([display="none"])';

  if (checkRepeat) query += ':not([data-repeat="0"])';

  return Array.from(modules)
    .map((module) => query.replace('{module}', module.toString()))
    .join(', ');
};

export const getLayersByModule = (modules: LayerModuleType[], opt?: SelectorOpt): NodeListOf<SVGGElement> =>
  document.querySelectorAll<SVGGElement>(getSelector(modules, opt));

export const hasModuleLayer = (modules: LayerModuleType[], opt?: SelectorOpt): boolean =>
  Boolean(document.querySelector(getSelector(modules, opt)));
