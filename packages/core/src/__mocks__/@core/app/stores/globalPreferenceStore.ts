import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import type { GlobalPreference } from '@core/interfaces/Preference';
import moduleOffsets from '@core/app/constants/layer-module/module-offsets';
import { PreviewSpeedLevel } from '@core/app/actions/beambox/constant';

const state: GlobalPreference = {
  'af-offset': 0,
  'anti-aliasing': true,
  'auto-switch-tab': false,
  auto_align: true,
  blade_precut: false,
  blade_radius: 0,
  continuous_drawing: false,
  'crop-task-thumbnail': false,
  curve_engraving_speed_limit: true,
  'default-autofocus': false,
  'default-borderless': false,
  'default-diode': false,
  'default-laser-module': LayerModule.LASER_20W_DIODE,
  'diode-one-way-engraving': true,
  diode_offset_x: 70,
  diode_offset_y: 7,
  'enable-custom-backlash': false,
  'enable-custom-preview-height': false,
  'enable-uv-print-file': false,
  enable_mask: false,
  fast_gradient: true,
  'font-convert': '2.0',
  'font-substitute': true,
  guide_x0: 0,
  guide_y0: 0,
  image_downsampling: true,
  'keep-preview-result': false,
  low_power: 10,
  model: 'fbb1b',
  'module-offsets': moduleOffsets,
  mouse_input_device: window.os === 'MacOS' ? 'TOUCHPAD' : 'MOUSE',
  'multipass-compensation': true,
  'one-way-printing': true,
  padding_accel: 5000,
  padding_accel_diode: 4500,
  'path-engine': 'fluxghost',
  precut_x: 0,
  precut_y: 0,
  preview_movement_speed_level: PreviewSpeedLevel.SLOW,
  'print-advanced-mode': false,
  'reverse-engraving': false,
  'segmented-engraving': true,
  should_remind_calibrate_camera: true,
  show_grids: true,
  show_guides: false,
  show_rulers: false,
  simplify_clipper_path: false,
  'use-real-boundary': false,
  'use-union-boundary': false,
  use_layer_color: true,
  vector_speed_constraint: true,
  zoom_with_window: false,
};

const set = <K extends keyof GlobalPreference>(key: K, value: GlobalPreference[K]) => {
  state[key] = value;
};

const update = (payload: Partial<GlobalPreference>) => {
  Object.assign(state, payload);
};

export const useGlobalPreferenceStore = (selector?: (state: GlobalPreference) => Partial<GlobalPreference>) => {
  const allStates = { ...state, set, update };

  return selector ? selector(allStates) : allStates;
};

useGlobalPreferenceStore.getState = () => ({ ...state, set, update });
