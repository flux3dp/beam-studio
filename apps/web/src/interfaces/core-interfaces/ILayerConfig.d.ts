import { LaserType, mopaWatts, promarkWatts } from 'app/constants/promark-constants';
import { WorkAreaModel } from 'app/constants/workarea-constants';

export type ConfigKeyTypeMap = {
  // meta configs
  configName: string;
  module: number;
  color: string;
  clipRect: string; // x y w h
  ref: boolean;
  // common configs
  repeat: number;
  backlash: number;
  // laser configs
  speed: number;
  power: number;
  minPower: number;
  height: number;
  zStep: number;
  diode: number;
  focus: number;
  focusStep: number;
  // printing configs
  fullcolor: boolean;
  split: boolean;
  printingSpeed: number;
  ink: number;
  multipass: number;
  cRatio: number;
  mRatio: number;
  yRatio: number;
  kRatio: number;
  printingStrength: number;
  halftone: number;
  wInk: number;
  wSpeed: number;
  wMultipass: number;
  wRepeat: number;
  uv: number;
  // promark configs
  frequency: number;
  pulseWidth: number; // Mopa only
  fillInterval: number;
  fillAngle: number;
  biDirectional: boolean;
  crossHatch: boolean;
  dottingTime: number;
};

type ConfigKey = keyof ConfigKeyTypeMap;

export interface ConfigItem<T> {
  value: T;
  hasMultiValue?: boolean;
}

// Used for ConfigPanel, selected layer(s) config
export type ILayerConfig = {
  [key in keyof ConfigKeyTypeMap]: ConfigItem<ConfigKeyTypeMap[key]>;
};

// Saved parameters, containing presets and user saved configs
export type Preset = {
  isDefault?: boolean;
  name?: string;
  key?: string;
  hide?: boolean;
  module?: number;
} & Partial<ConfigKeyTypeMap>;

type TPromarkDesktop = `${LaserType.Desktop}_${(typeof promarkWatts)[number]}`;
type TPromarkMopa = `${LaserType.MOPA}_${(typeof mopaWatts)[number]}`;

export type PromarkModel = `fpm1_${TPromarkDesktop | TPromarkMopa}`;
export type PresetModel = WorkAreaModel | PromarkModel;
