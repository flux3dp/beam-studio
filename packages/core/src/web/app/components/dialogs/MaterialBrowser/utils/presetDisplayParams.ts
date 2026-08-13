import { type LayerModuleType, printingModules } from '@core/app/constants/layer-module/layer-modules';
import { dpiValueMap } from '@core/app/constants/resolutions';
import i18n from '@core/helpers/i18n';
import type { PresetModel } from '@core/interfaces/ILayerConfig';
import type { PresetValues } from '@core/interfaces/IMaterial';

export interface PresetParamPill {
  label: string;
  value: string;
}

/**
 * The key-parameter pills of a preset row, matching the machine context
 * (PRD §6.2): laser / Promark Q-Switch / Promark MOPA / printing.
 */
export const getPresetDisplayParams = (
  values: PresetValues,
  { model, module }: { model: PresetModel; module: LayerModuleType },
): PresetParamPill[] => {
  const lang = i18n.lang.beambox.right_panel.laser_panel;
  const pills: PresetParamPill[] = [];
  const push = (label: string, value: number | string | undefined, unit = '') => {
    if (value !== undefined) pills.push({ label, value: `${value}${unit}` });
  };

  if (printingModules.has(module)) {
    push(lang.ink_saturation, values.ink);
    push(lang.print_multipass, values.multipass);
    push(lang.repeat, values.repeat);

    return pills;
  }

  if (model.startsWith('fpm1_')) {
    const isMopa = model.startsWith('fpm1_1');

    push(lang.strength, values.power, '%');
    push(lang.speed, values.speed, ' mm/s');

    if (isMopa) {
      push(lang.pulse_width, values.pulseWidth, ' ns');
    } else {
      push(lang.dottingTime, values.dottingTime, ' µs');
      push(lang.fill_interval, values.fillInterval, ' mm');
    }

    push(lang.frequency, values.frequency, ' kHz');

    return pills;
  }

  push(lang.strength, values.power, '%');
  push(lang.speed, values.speed, ' mm/s');
  push(lang.repeat, values.repeat);

  if (values.dpi) push('DPI', dpiValueMap[values.dpi]);

  return pills;
};
