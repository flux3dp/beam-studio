import type { GalvoBlendProfile, GalvoRunEmission, GalvoStrategy } from '@core/app/constants/galvo-dev-settings';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import type { GalvoWorkarea } from '@core/helpers/device/galvoConfig';
import type { BBox } from '@core/interfaces/ICurveEngraving';

import type { IDeviceInfo } from './IDevice';

export interface IBaseConfig {
  codeType?: 'fcode' | 'gcode' | 'preview';
  device?: IDeviceInfo | null;
  enableAutoFocus?: boolean;
  enableDiode?: boolean;
  /** place the job around this point instead of deriving one from the document */
  forceJobOrigin?: [number, number];
  /**
   * Ignore the document's add-ons -- rotary, pass-through, auto feeder, curve engraving and
   * auto shrink. A synthetic scene has no business inheriting transforms meant for the canvas.
   */
  ignoreDocumentAddOns?: boolean;
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
  /** whether to use firmware burst refresh for 4C printing */
  burst_refresh: boolean;
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
  /**
   * HEXA II galvo only, and only read when the model is `fhx2galvo`. Every key below is a
   * developer override with a default inside swiftray's exporter, so leaving one out is not
   * the same as sending its default -- it is what lets the two sides stay in step. See
   * `@core/app/constants/galvo-dev-settings` for what each one does.
   */
  galvo_block: [number, number];
  galvo_debug_image: string;
  galvo_dot_blend_line_core: boolean;
  galvo_dot_blend_overlap: number;
  galvo_dot_blend_profile: GalvoBlendProfile;
  /**
   * Field lens size in mm, from the mounted head's own config on the machine. Not a developer
   * override: it decides how far the galvo reaches, the block size and whether the drawing is
   * split at all, so it has to be the lens that is actually fitted.
   */
  galvo_field: GalvoWorkarea;
  galvo_jump_speed: number;
  galvo_laser_off_delay: number;
  galvo_laser_on_delay: number;
  galvo_line_blend_emission: GalvoRunEmission;
  galvo_line_blend_overlap: number;
  galvo_line_blend_profile: GalvoBlendProfile;
  galvo_line_blend_segment: number;
  galvo_max_list_commands: number;
  galvo_mopa_pulse_length: number;
  galvo_process_dot_jump_speed: number;
  galvo_process_dot_laser_off_delay: number;
  galvo_process_dot_laser_on_delay: number;
  galvo_process_dot_pitch: number;
  galvo_process_dot_power: number;
  galvo_process_dot_pulse_on_time: number;
  galvo_process_dot_pulse_period: number;
  galvo_scanner_mark_delay: number;
  galvo_scanner_polygon_delay: number;
  galvo_standby: boolean;
  galvo_standby_period: number;
  galvo_standby_width: number;
  /**
   * One of laser-phy-simulator's own strategy ids, which settles the whole seam at once.
   * Read before the individual keys above, so one of them still overrides it.
   */
  galvo_strategy: GalvoStrategy;
  /** gantry travel speed while a galvo layer runs, mm/min; ordinary layers keep using `ts` */
  galvo_ts: number;
  gc: boolean; // output gcode
  /**
   * 4C ink color order by cartridge slot, e.g. 'cymk' (default cmyk)
   */
  ico: string;
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
  /** prespray times for beamo2 4C module */
  prespray_times: number;
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
  /** s-curve acceleration */
  s_curve: boolean;
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
   * Whether to use GA optimize cutting order in swiftray, default is true in backend
   */
  use_ga_reorder: boolean;
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
