import type { PreviewSpeedLevelType } from '@core/app/actions/beambox/constant';
import type { RotaryType } from '@core/app/constants/addOn';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import type { ModuleOffsets } from '@core/app/constants/layer-module/module-offsets';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';

import type { Prettify } from './utils';

export type DocumentState = {
  'auto-feeder': boolean;
  'auto-feeder-height'?: number;
  'auto-feeder-scale': number;
  auto_shrink: boolean;
  borderless: boolean;
  'customized-dimension': Partial<Record<WorkAreaModel, { height: number; width: number }>>;
  'enable-autofocus'?: boolean;
  'enable-diode'?: boolean;
  'enable-job-origin': boolean;
  engrave_dpi: 'high' | 'low' | 'medium' | 'ultra';
  'extend-rotary-workarea': boolean;
  'frame-before-start': boolean;
  'job-origin': number;
  'pass-through': boolean;
  'pass-through-height'?: number;
  'promark-safety-door': boolean;
  'promark-start-button': boolean;
  'rotary-chuck-obj-d': number;
  'rotary-mirror': boolean;
  'rotary-overlap': number;
  'rotary-scale': number; // extra rotary scale when exporting
  'rotary-split': number;
  'rotary-type': RotaryType;
  'rotary-y': null | number;
  rotary_mode: boolean;
  skip_prespray: boolean;
  workarea: WorkAreaModel;
};
export type DocumentStateKey = keyof DocumentState;

/**
 * Global Preference Store
 * Use useGlobalPreferenceStore.subscribe to subscribe to changes outside of React components if needed.
 */
export type GlobalPreference = {
  'af-offset': number;
  'anti-aliasing': boolean;
  'auto-switch-tab': boolean;
  auto_align: boolean;
  blade_precut: boolean;
  blade_radius: number;
  continuous_drawing: boolean;
  'crop-task-thumbnail': boolean;
  curve_engraving_speed_limit: boolean;
  'default-autofocus': boolean;
  'default-borderless': boolean;
  'default-diode': boolean;
  'default-laser-module': LayerModuleType;
  'diode-one-way-engraving': boolean;
  diode_offset_x: number;
  diode_offset_y: number;
  'enable-custom-backlash': boolean;
  'enable-custom-preview-height': boolean;
  'enable-uv-print-file': boolean;
  enable_mask: boolean;
  fast_gradient: boolean;
  'font-convert': '1.0' | '2.0';
  'font-substitute': boolean;
  guide_x0: number;
  guide_y0: number;
  image_downsampling: boolean;
  'import-module'?: LayerModuleType;
  'keep-preview-result': boolean;
  low_power: number;
  /** model: default workarea model */
  model: WorkAreaModel;
  'module-offsets': ModuleOffsets;
  mouse_input_device: 'MOUSE' | 'TOUCHPAD';
  'multipass-compensation': boolean;
  'one-way-printing': boolean;
  padding_accel: number;
  padding_accel_diode: number;
  'path-engine': 'fluxghost' | 'swiftray';
  precut_x: number;
  precut_y: number;
  preview_movement_speed_level: PreviewSpeedLevelType;
  'print-advanced-mode': boolean;
  'reverse-engraving': boolean;
  'segmented-engraving': boolean;
  should_remind_calibrate_camera: boolean;
  show_grids: boolean;
  show_guides: boolean;
  show_rulers: boolean;
  simplify_clipper_path: boolean;
  'use-real-boundary': boolean;
  'use-union-boundary': boolean;
  use_layer_color: boolean;
  vector_speed_constraint: boolean;
  zoom_with_window: boolean;
};
export type GlobalPreferenceKey = keyof GlobalPreference;

export type BeamboxPreference = DocumentState & GlobalPreference;
export type BeamboxPreferenceKey = Prettify<keyof BeamboxPreference>;
export type BeamboxPreferenceValue<T extends BeamboxPreferenceKey> = BeamboxPreference[T];
