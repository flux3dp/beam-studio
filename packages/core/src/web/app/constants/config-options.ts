import ConfigOption from 'interfaces/ConfigOption';
import { ILang } from 'interfaces/ILang';

const multipassOptions: ConfigOption[] = [
  { value: 2 },
  { value: 3 },
  { value: 4 },
  { value: 5 },
];

const whiteMultipassOptions: ConfigOption[] = [
  { value: 3 },
  { value: 4 },
  { value: 5 },
  { value: 6 },
  { value: 7 },
];

const getSaturationOptions = (lang: ILang): ConfigOption[] => {
  const t = lang.beambox.right_panel.laser_panel;
  return [
    { value: 1, label: t.slider.very_low },
    { value: 2, label: t.slider.low },
    { value: 3, label: t.slider.regular },
    { value: 4, label: t.slider.high },
    { value: 5, label: t.slider.very_high },
  ];
};

const getWhiteSaturationOptions = (lang: ILang): ConfigOption[] => {
  const t = lang.beambox.right_panel.laser_panel;
  return [
    { value: 3, label: t.slider.very_low },
    { value: 6, label: t.slider.low },
    { value: 9, label: t.slider.regular },
    { value: 12, label: t.slider.high },
    { value: 15, label: t.slider.very_high },
  ];
};

const getPrintingSpeedOptions = (lang: ILang): ConfigOption[] => {
  const t = lang.beambox.right_panel.laser_panel;
  return [
    { value: 10, label: t.slider.very_slow },
    { value: 30, label: t.slider.slow },
    { value: 60, label: t.slider.regular },
    { value: 100, label: t.slider.fast },
    { value: 150, label: t.slider.very_fast },
  ];
};

export default {
  multipassOptions,
  whiteMultipassOptions,
  getPrintingSpeedOptions,
  getSaturationOptions,
  getWhiteSaturationOptions,
};
