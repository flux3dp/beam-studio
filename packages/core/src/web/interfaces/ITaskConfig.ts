import { BBox } from 'interfaces/ICurveEngraving';
import { WorkAreaModel } from 'app/constants/workarea-constants';

export interface IBaseConfig {
  model: WorkAreaModel;
  isPromark?: boolean;
  travelSpeed?: number;
  enableAutoFocus?: boolean;
  enableDiode?: boolean;
  shouldUseFastGradient?: boolean;
  shouldMockFastGradient?: boolean;
  vectorSpeedConstraint?: boolean;
  paddingAccel?: number | null;
  codeType?: 'fcode' | 'gcode';
  supportPwm?: boolean;
  supportJobOrigin?: boolean;
}

export type TFcodeOptionalConfig = Partial<{
  acc: number;
  gc: boolean; // output gcode
  spin: number; // rotary position
  rotary_y_ratio: number;
  prespray: [number, number, number, number];
  mpc: boolean; // multipass compensation
  owp: boolean; // one way printing
  blade: number; // blade radius
  precut: [number, number]; // precut position
  af: boolean;
  z_offset: number;
  diode: [number, number]; // diode offset
  diode_owe: boolean; // diode one way engraving
  mask: [number, number, number, number]; // top right bottom left
  fg: boolean;
  mfg: boolean; // mock fg
  vsc: boolean; // with vector speed constraint, used for ghost 2.3.4 and before
  vsl: number; // vector speed limit
  no_pwm: boolean;
  min_speed: number;
  rev: boolean; // reverse engraving
  cbl: boolean; // custom backlash
  mep: number; // min engraving padding in mm
  mpp: number; // min printing padding in mm
  nv: number; // nozzle votage
  npw: number; // nozzle pulse width
  ts: number; // travel speed
  pts: number; // path travel speed
  ats: number; // a travel speed
  ptp: number; // printing top padding
  pbp: number; // printing bottom padding
  mof: { [key: number]: [number, number] }; // manual offset
  loop_compensation: number;
  curve_engraving: {
    bbox: BBox;
    points: [number, number, number][];
    gap: [number, number];
    safe_height?: number;
  };
  job_origin: [number, number];
}>;

export interface IFcodeConfig extends TFcodeOptionalConfig {
  model: WorkAreaModel;
  hardware_name: 'hexa' | 'beambox' | 'pro' | 'beamo' | 'ado1' | 'fbb2' | WorkAreaModel;
}
