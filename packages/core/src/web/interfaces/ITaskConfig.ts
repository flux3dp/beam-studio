import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import type { BBox } from '@core/interfaces/ICurveEngraving';

export interface IBaseConfig {
  codeType?: 'fcode' | 'gcode' | 'preview';
  enableAutoFocus?: boolean;
  enableDiode?: boolean;
  isPromark?: boolean;
  model: WorkAreaModel;
  paddingAccel?: null | number;
  shouldMockFastGradient?: boolean;
  shouldUseFastGradient?: boolean;
  supportJobOrigin?: boolean;
  supportPwm?: boolean;
  travelSpeed?: number;
}

export type TFcodeOptionalConfig = Partial<{
  acc: number; // acceleration to calculate task time, not real acceleration used in machine
  acc_override: Partial<Record<'fill' | 'path', Partial<{ a: number; x: number; y: number; z: number }>>>; // set acceleration for real task
  af: boolean;
  ats: number; // a travel speed
  blade: number; // blade radius
  cbl: boolean; // custom backlash
  csl: number; // curve speed limit
  curve_engraving: {
    bbox: BBox;
    gap: [number, number];
    points: Array<[number, number, null | number]>;
    safe_height?: number;
  };
  diode: [number, number]; // diode offset
  diode_owe: boolean; // diode one way engraving
  fg: boolean;
  gc: boolean; // output gcode
  job_origin: [number, number];
  loop_compensation: number;
  mask: [number, number, number, number]; // top right bottom left
  mep: number; // min engraving padding in mm
  mfg: boolean; // mock fg
  min_speed: number;
  mof: { [key: number]: [number, number] }; // manual offset
  mpc: boolean; // multipass compensation
  mpp: number; // min printing padding in mm
  no_pwm: boolean;
  npw: number; // nozzle pulse width
  nv: number; // nozzle votage
  owp: boolean; // one way printing
  pbp: number; // printing bottom padding
  precut: [number, number]; // precut position
  prespray: [number, number, number, number];
  ptp: number; // printing top padding
  pts: number; // path travel speed
  rev: boolean; // reverse engraving
  rotary_y_ratio: number;
  spin: number; // rotary position, px
  ts: number; // travel speed
  vsc: boolean; // with vector speed constraint, used for ghost 2.3.4 and before
  vsl: number; // vector speed limit
  z_offset: number;
}>;

export interface IFcodeConfig extends TFcodeOptionalConfig {
  hardware_name: 'ado1' | 'beambox' | 'beamo' | 'fbb2' | 'hexa' | 'pro' | WorkAreaModel;
  model: WorkAreaModel;
}
