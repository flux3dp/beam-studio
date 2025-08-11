import { match } from 'ts-pattern';

import type ConfigOption from '@core/interfaces/ConfigOption';
import type { ILang } from '@core/interfaces/ILang';

import type { LayerModuleType } from './layer-module/layer-modules';
import { LayerModule } from './layer-module/layer-modules';

const multipassOptions: ConfigOption[] = [{ value: 2 }, { value: 3 }, { value: 4 }, { value: 5 }];

const whiteMultipassOptions: ConfigOption[] = [{ value: 3 }, { value: 4 }, { value: 5 }, { value: 6 }, { value: 7 }];

export const getSaturationOptions = (
  lang: ILang,
  layerModule: LayerModuleType = LayerModule.PRINTER,
): ConfigOption[] | undefined => {
  const t = lang.beambox.right_panel.laser_panel;

  return match(layerModule)
    .with(LayerModule.PRINTER, () => [
      { label: t.slider.very_low, value: 1 },
      { label: t.slider.low, value: 2 },
      { label: t.slider.regular, value: 3 },
      { label: t.slider.high, value: 4 },
      { label: t.slider.very_high, value: 5 },
    ])
    .with(LayerModule.PRINTER_4C, () => [
      { label: t.slider.low, value: 35 },
      { label: t.slider.regular, value: 70 },
      { label: t.slider.high, value: 100 },
    ])
    .otherwise(() => undefined);
};

export const getWhiteSaturationOptions = (
  lang: ILang,
  layerModule: LayerModuleType = LayerModule.PRINTER,
): ConfigOption[] | undefined => {
  const t = lang.beambox.right_panel.laser_panel;

  return match(layerModule)
    .with(LayerModule.PRINTER, () => [
      { label: t.slider.very_low, value: 3 },
      { label: t.slider.low, value: 6 },
      { label: t.slider.regular, value: 9 },
      { label: t.slider.high, value: 12 },
      { label: t.slider.very_high, value: 15 },
    ])
    .otherwise(() => undefined);
};

export const getSpeedOptions = (
  lang: ILang,
  layerModule: LayerModuleType = LayerModule.PRINTER,
): ConfigOption[] | undefined => {
  const t = lang.beambox.right_panel.laser_panel;

  return match(layerModule)
    .with(LayerModule.PRINTER, () => [
      { label: t.slider.very_slow, value: 10 },
      { label: t.slider.slow, value: 30 },
      { label: t.slider.regular, value: 60 },
      { label: t.slider.fast, value: 100 },
      { label: t.slider.very_fast, value: 150 },
    ])
    .with(LayerModule.PRINTER_4C, () => [
      { label: t.slider.very_slow, value: 5 },
      { label: t.slider.slow, value: 15 },
      { label: t.slider.regular, value: 25 },
      { label: t.slider.fast, value: 35 },
      { label: t.slider.very_fast, value: 45 },
    ])
    .otherwise(() => undefined);
};

export default {
  getSaturationOptions,
  getSpeedOptions,
  getWhiteSaturationOptions,
  multipassOptions,
  whiteMultipassOptions,
};
