import type ConfigOption from '@core/interfaces/ConfigOption';
import type { ILang } from '@core/interfaces/ILang';

const multipassOptions: ConfigOption[] = [{ value: 2 }, { value: 3 }, { value: 4 }, { value: 5 }];

const whiteMultipassOptions: ConfigOption[] = [{ value: 3 }, { value: 4 }, { value: 5 }, { value: 6 }, { value: 7 }];

const getSaturationOptions = (lang: ILang): ConfigOption[] => {
  const t = lang.beambox.right_panel.laser_panel;

  return [
    { label: t.slider.very_low, value: 1 },
    { label: t.slider.low, value: 2 },
    { label: t.slider.regular, value: 3 },
    { label: t.slider.high, value: 4 },
    { label: t.slider.very_high, value: 5 },
  ];
};

const getWhiteSaturationOptions = (lang: ILang): ConfigOption[] => {
  const t = lang.beambox.right_panel.laser_panel;

  return [
    { label: t.slider.very_low, value: 3 },
    { label: t.slider.low, value: 6 },
    { label: t.slider.regular, value: 9 },
    { label: t.slider.high, value: 12 },
    { label: t.slider.very_high, value: 15 },
  ];
};

const getPrintingSpeedOptions = (lang: ILang): ConfigOption[] => {
  const t = lang.beambox.right_panel.laser_panel;

  return [
    { label: t.slider.very_slow, value: 10 },
    { label: t.slider.slow, value: 30 },
    { label: t.slider.regular, value: 60 },
    { label: t.slider.fast, value: 100 },
    { label: t.slider.very_fast, value: 150 },
  ];
};

export default {
  getPrintingSpeedOptions,
  getSaturationOptions,
  getWhiteSaturationOptions,
  multipassOptions,
  whiteMultipassOptions,
};
