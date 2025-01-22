import type { LaserType, mopaWatts, promarkWatts } from '@core/app/constants/promark-constants';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';

export type ConfigKeyTypeMap = {
  backlash: number;
  biDirectional: boolean;
  clipRect: string; // x y w h
  color: string;
  // meta configs
  configName: string;
  cRatio: number;
  crossHatch: boolean;
  diode: number;
  dottingTime: number;
  fillAngle: number;
  fillInterval: number;
  focus: number;
  focusStep: number;
  // promark configs
  frequency: number;
  // printing configs
  fullcolor: boolean;
  halftone: number;
  height: number;
  ink: number;
  kRatio: number;
  minPower: number;
  module: number;
  mRatio: number;
  multipass: number;
  power: number;
  printingSpeed: number;
  printingStrength: number;
  pulseWidth: number; // Mopa only
  ref: boolean;
  // common configs
  repeat: number;
  // laser configs
  speed: number;
  split: boolean;
  uv: number;
  wInk: number;
  wMultipass: number;
  wRepeat: number;
  wSpeed: number;
  yRatio: number;
  zStep: number;
};

type ConfigKey = keyof ConfigKeyTypeMap;

export interface ConfigItem<T> {
  hasMultiValue?: boolean;
  value: T;
}

// Used for ConfigPanel, selected layer(s) config
export type ILayerConfig = {
  [key in keyof ConfigKeyTypeMap]: ConfigItem<ConfigKeyTypeMap[key]>;
};

// Saved parameters, containing presets and user saved configs
export type Preset = Partial<ConfigKeyTypeMap> & {
  hide?: boolean;
  isDefault?: boolean;
  key?: string;
  module?: number;
  name?: string;
};

type TPromarkDesktop = `${LaserType.Desktop}_${(typeof promarkWatts)[number]}`;
type TPromarkMopa = `${LaserType.MOPA}_${(typeof mopaWatts)[number]}`;

export type PromarkModel = `fpm1_${TPromarkDesktop | TPromarkMopa}`;
export type PresetModel = PromarkModel | WorkAreaModel;
