import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import type { LaserType, mopaWatts, promarkWatts } from '@core/app/constants/promark-constants';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';

type MetaConfig = {
  clipRect: string; // x y w h
  color: string;
  configName: string;
  module: LayerModuleType;
  ref: boolean;
};

type CommonConfig = {
  backlash: number;
  repeat: number;
};

type LaserConfig = {
  ceZSpeedLimit: number; // can add CurveEngravingConfig if more ce configs are added
  diode: number;
  focus: number;
  focusStep: number;
  height: number;
  minPower: number;
  power: number;
  speed: number;
  zStep: number;
};

type PrintingConfig = {
  amDensity: number;
  cRatio: number;
  fullcolor: boolean;
  halftone: number;
  ink: number;
  kRatio: number;
  mRatio: number;
  multipass: number;
  printingSpeed: number;
  printingStrength: number;
  split: boolean;
  uv: number;
  wInk: number;
  wMultipass: number;
  wRepeat: number;
  wSpeed: number;
  yRatio: number;
};

type Printing4CConfig = {
  refreshInterval: number; // refresh to cartridge for # blocks
  refreshWidth: number; // refresh spray width
  refreshZ: number; // refresh z move
};

/**
 * Configs for white ink module, different from printing module white ink
 */
type WhiteInkConfig = {
  whiteInkX: number;
  whiteInkY: number;
};

type PromarkConfig = {
  biDirectional: boolean;
  crossHatch: boolean;
  dottingTime: number;
  fillAngle: number;
  fillInterval: number;
  frequency: number;
  pulseWidth: number; // Mopa only
  wobbleDiameter: number;
  wobbleStep: number;
};

export type ConfigKeyTypeMap = CommonConfig &
  LaserConfig &
  MetaConfig &
  Printing4CConfig &
  PrintingConfig &
  PromarkConfig &
  WhiteInkConfig;

export type ConfigKey = keyof ConfigKeyTypeMap;

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
  module?: LayerModuleType;
  name?: string;
};

type TPromarkDesktop = `${LaserType.Desktop}_${(typeof promarkWatts)[number]}`;
type TPromarkMopa = `${LaserType.MOPA}_${(typeof mopaWatts)[number]}`;

export type PromarkModel = `fpm1_${TPromarkDesktop | TPromarkMopa}`;
export type PresetModel = PromarkModel | WorkAreaModel;
