import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import type { LaserType, mopaWatts, promarkWatts } from '@core/app/constants/promark-constants';
import type { EngraveDpiOption } from '@core/app/constants/resolutions';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import type { Hexa2RfWatt } from '@core/helpers/device/deviceStore';

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
  /** 0-100, percentage */
  airAssist: number;
  /** μs ,delay to emit laser */
  delay: number;
  diode: number;
  dpi: EngraveDpiOption;
  focus: number;
  focusStep: number;
  height: number;
  minPower: number;
  power: number;
  speed: number;
  zStep: number;
};

type CurveEngravingConfig = {
  ceZHighSpeed: boolean;
};

type PrintingConfig = {
  amAngleMap: Record<'c' | 'k' | 'm' | 'y', number> | undefined;
  amDensity: number;
  colorCurvesMap: Record<'c' | 'k' | 'm' | 'y', number[]> | undefined;
  cRatio: number;
  fullcolor: boolean;
  halftone: number;
  /**
   * 1 ~ 9 for ador Printer, 0 ~ 100 for 4c Printer.
   */
  ink: number;
  kRatio: number;
  mRatio: number;
  multipass: number;
  /**
   * 1 for left, 2 for right, 3 for both
   */
  nozzleMode: number;
  /**
   * nozzle offset x of right relative to left, the real print x will be x - nozzleOffsetX
   */
  nozzleOffsetX: number;
  /**
   * nozzle offset y of left relative to right, the real print y will be y - nozzleOffsetY
   */
  nozzleOffsetY: number;
  printingSpeed: number;
  printingStrength: number;
  refreshInterval: number;
  refreshThreshold: number;
  split: boolean;
  wInk: number;
  wMultipass: number;
  wRepeat: number;
  wSpeed: number;
  yRatio: number;
};

/**
 * Configs for uv module.
 */
type UVConfig = {
  interpolation: number;
  rightPadding: number;
  uvXStep: number;
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
  CurveEngravingConfig &
  LaserConfig &
  MetaConfig &
  PrintingConfig &
  PromarkConfig &
  UVConfig;

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
export type FHX2RFPresetModel = `fhx2rf_${Hexa2RfWatt}`;
export type PresetModel = FHX2RFPresetModel | PromarkModel | WorkAreaModel;
