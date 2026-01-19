import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import type { BBox } from '@core/interfaces/ICurveEngraving';

import type { IDeviceInfo } from './IDevice';

export interface IBaseConfig {
  codeType?: 'fcode' | 'gcode' | 'preview';
  device?: IDeviceInfo | null;
  enableAutoFocus?: boolean;
  enableDiode?: boolean;
  isPromark?: boolean;
  model: WorkAreaModel;
  paddingAccel?: null | number;
  shouldMockFastGradient?: boolean;
  shouldUseFastGradient?: boolean;
  supportAccOverrideV1?: boolean;
  supportJobOrigin?: boolean;
  supportPwm?: boolean;
  travelSpeed?: number;
}

export type TAccelerationOverride = Partial<
  Record<'fill' | 'path', Partial<{ a: number; x: number; y: number; z: number }>>
>;

export type TFcodeOptionalConfig = Partial<{
  /**
   * acceleration to calculate task time, not real acceleration used in machine
   */
  acc: number;
  /**
   * set acceleration for real task
   */
  acc_override: TAccelerationOverride;
  af: boolean;
  /**
   * a travel speed
   */
  ats: number;
  /**
   * custom backlash
   */
  cbl: boolean;
  /**
   * curve speed limit
   */
  csl: number;
  curve_engraving: {
    acceleration?: number;
    bbox: BBox;
    gap: [number, number];
    points: Array<[number, number, null | number]>;
    safe_height?: number;
  };
  /**
   * diode offset
   */
  diode: [number, number];
  /**
   * diode one way engraving
   */
  diode_owe: boolean;
  /**
   * erode engraving, in mm
   */
  engraving_erode?: number;
  expected_module?: number;
  fg: boolean;
  gc: boolean; // output gcode
  job_origin: [number, number];
  loop_compensation: number;
  /**
   * json string, current storing data for beamo 2 sliding table
   */
  machine_limit_position: string;
  /**
   * clipping mask in [top right bottom left]
   */
  mask: [number, number, number, number];
  /**
   * min engraving padding in mm
   */
  mep: number;
  /**
   * mock fg, used for generating path preview gcode
   */
  mfg: boolean;
  min_speed: number;
  /**
   * module offset
   */
  mof: { [key: number]: [number, number] };
  /**
   * multipass compensation
   */
  mpc: boolean;
  /**
   * min printing padding in mm
   */
  mpp: number;
  no_pwm: boolean;
  npw: number; // nozzle pulse width
  nv: number; // nozzle votage
  /**
   * one way printing
   */
  owp: boolean;
  /**
   * printing bottom padding
   */
  pbp: number;
  prespray: [number, number, number, number];
  /**
   * printing slice height
   */
  psh: number;
  /**
   * printing slice width
   */
  psw: number;
  /**
   *  printing top padding
   */
  ptp: number;
  /**
   * path travel speed
   */
  pts: number; //
  rev: boolean; // reverse engraving
  /**
   * rotary split overlap, mm
   */
  rotary_overlap?: number;
  /**
   * rotary split height, mm
   */
  rotary_split?: number;
  rotary_y_ratio: number;
  /**
   * whether to move z axis in rotary task to avoid collision, default is true in backend
   */
  rotary_z_motion?: boolean;
  /**
   * whether to split bitmap into segments, default is true in backend
   */
  segment?: boolean;
  /**
   * whether to skip prespray scripts, for fbm2 only now
   */
  skip_prespray: boolean;
  /**
   * rotary position, px
   */
  spin: number;
  /**
   * travel speed
   */
  ts: number;
  /**
   * with vector speed constraint, used for ghost 2.3.4 and before
   */
  vsc: boolean;
  /**
   * vector speed limit
   */
  vsl: number;
  /**
   * selected laser wattage
   */
  watt: number;
  z_offset: number;
}>;

export interface IFcodeConfig extends TFcodeOptionalConfig {
  hardware_name: 'ado1' | 'beambox' | 'beamo' | 'fbb2' | 'hexa' | 'pro' | WorkAreaModel;
  model: WorkAreaModel;
}
