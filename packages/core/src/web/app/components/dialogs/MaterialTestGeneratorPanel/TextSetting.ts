import { promarkModels } from '@core/app/actions/beambox/constant';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { moduleBaseConfig } from '@core/helpers/layer/layer-config-helper';

export interface TextSetting {
  power: number;
  select: { label: string; value: string };
  speed: number;
}

export const textParams = ['power', 'speed'] as const;

/**
 * Labels and frame are engraved too, so they need a speed the head can actually run. A galvo head
 * has its own, an order of magnitude above a gantry's -- taken from the module's base config rather
 * than restated here, so the labels keep up with whatever a galvo layer is given by default.
 */
export const getTextSetting = (workarea: WorkAreaModel, module?: LayerModuleType): TextSetting => ({
  power: 15,
  select: { label: 'Custom', value: 'custom' },
  speed: (module && moduleBaseConfig[module]?.speed) || (promarkModels.has(workarea) ? 1000 : 20),
});
