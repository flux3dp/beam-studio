import { PreviewSpeedLevel } from '@core/app/actions/beambox/constant';
import constant from '@core/app/actions/beambox/constant';
import { CHUCK_ROTARY_DIAMETER, RotaryType } from '@core/app/constants/add-on';
import LayerModule from '@core/app/constants/layer-module/layer-modules';
import moduleOffsets from '@core/app/constants/layer-module/module-offsets';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import storage from '@core/implementations/storage';
import type { Prettify } from '@core/interfaces/utils';

export type BeamboxPreference = {
  'af-offset': number;
  'anti-aliasing': boolean;
  'auto-feeder': boolean;
  'auto-feeder-height'?: number;
  'auto-switch-tab': boolean;
  auto_align: boolean;
  blade_precut: boolean;
  blade_radius: number;
  borderless: boolean;
  continuous_drawing: boolean;
  curve_engraving_speed_limit: boolean;
  'customized-dimension': Partial<Record<WorkAreaModel, { height: number; width: number }>>;
  'default-autofocus': boolean;
  'default-borderless': boolean;
  'default-diode': boolean;
  'default-laser-module': LayerModule;
  'diode-one-way-engraving': boolean;
  diode_offset_x: number;
  diode_offset_y: number;
  'enable-autofocus'?: boolean;
  'enable-custom-backlash': boolean;
  'enable-custom-preview-height': boolean;
  'enable-diode'?: boolean;
  'enable-job-origin': boolean;
  enable_mask: boolean;
  engrave_dpi: 'high' | 'low' | 'medium';
  'extend-rotary-workarea': boolean;
  fast_gradient: boolean;
  'font-convert': '1.0' | '2.0';
  'font-substitute': boolean;
  'frame-before-start': boolean;
  guide_x0: number;
  guide_y0: number;
  image_downsampling: boolean;
  'import-module'?: LayerModule;
  'job-origin': number;
  'keep-preview-result': boolean;
  low_power: number;
  // model is default workarea model
  model: WorkAreaModel;
  'module-offsets': Record<LayerModule, [number, number]>;
  mouse_input_device: 'MOUSE' | 'TOUCHPAD';
  'multipass-compensation': boolean;
  'one-way-printing': boolean;
  padding_accel: number;
  padding_accel_diode: number;
  'pass-through': boolean;
  'pass-through-height'?: number;
  'path-engine': 'fluxghost' | 'swiftray';
  precut_x: number;
  precut_y: number;
  preview_movement_speed_level: PreviewSpeedLevel;
  'print-advanced-mode': boolean;
  'promark-start-button': boolean;
  'reverse-engraving': boolean;
  'rotary-chuck-obj-d': number;
  'rotary-mirror': boolean;
  'rotary-type': RotaryType;
  'rotary-y': null | number;
  rotary_mode: boolean;
  rotary_y_coord: number;
  should_remind_calibrate_camera: boolean;
  show_grids: boolean;
  show_guides: boolean;
  show_rulers: boolean;
  simplify_clipper_path: boolean;
  use_layer_color: boolean;
  vector_speed_constraint: boolean;
  workarea: WorkAreaModel;
  zoom_with_window: boolean;
};

export type BeamboxPreferenceKey = Prettify<keyof BeamboxPreference>;
export type BeamboxPreferenceValue<T extends BeamboxPreferenceKey> = BeamboxPreference[T];

const DEFAULT_PREFERENCE: BeamboxPreference = {
  'af-offset': 0,
  'anti-aliasing': true,
  'auto-feeder': false,
  'auto-switch-tab': false,
  auto_align: true,
  blade_precut: false,
  blade_radius: 0,
  borderless: false,
  continuous_drawing: false,
  curve_engraving_speed_limit: true,
  'customized-dimension': { fpm1: { height: 150, width: 150 } },
  'default-autofocus': false,
  'default-borderless': false,
  'default-diode': false,
  'default-laser-module': LayerModule.LASER_20W_DIODE,
  'diode-one-way-engraving': true,
  diode_offset_x: constant.diode.defaultOffsetX,
  diode_offset_y: constant.diode.defaultOffsetY,
  'enable-custom-backlash': false,
  'enable-custom-preview-height': false,
  'enable-job-origin': false,
  enable_mask: false,
  engrave_dpi: 'medium',
  'extend-rotary-workarea': false,
  fast_gradient: true,
  'font-convert': '2.0',
  'font-substitute': true,
  'frame-before-start': false,
  guide_x0: 0,
  guide_y0: 0,
  image_downsampling: true,
  'job-origin': 1,
  'keep-preview-result': false,
  low_power: 10,
  model: 'fbb1b',
  'module-offsets': moduleOffsets,
  mouse_input_device: window.os === 'MacOS' ? 'TOUCHPAD' : 'MOUSE',
  'multipass-compensation': true,
  'one-way-printing': true,
  padding_accel: 5000,
  padding_accel_diode: 4500,
  'pass-through': false,
  'path-engine': 'fluxghost',
  precut_x: 0,
  precut_y: 0,
  preview_movement_speed_level: PreviewSpeedLevel.SLOW,
  'print-advanced-mode': false,
  'promark-start-button': false,
  'reverse-engraving': false,
  'rotary-chuck-obj-d': CHUCK_ROTARY_DIAMETER,
  'rotary-mirror': false,
  'rotary-type': RotaryType.Roller,
  'rotary-y': null,
  rotary_mode: false,
  rotary_y_coord: 5,
  should_remind_calibrate_camera: true,
  show_grids: true,
  show_guides: false,
  show_rulers: false,
  simplify_clipper_path: false,
  use_layer_color: true,
  vector_speed_constraint: true,
  workarea: 'fbb1b',
  zoom_with_window: false,
};

const eventEmitter = eventEmitterFactory.createEventEmitter('beambox-preference');

const objectKeys = ['customized-dimension', 'module-offsets'] as const;

class BeamboxPreferenceClass {
  constructor() {
    // set default preference if key or even beambox-preference doesn't exist
    const preference: BeamboxPreference = storage.get('beambox-preference') || DEFAULT_PREFERENCE;

    // migrate renamed key
    const oldValue = preference['vector_speed_contraint' as BeamboxPreferenceKey];

    if (oldValue !== undefined) {
      preference['vector_speed_constraint'] = oldValue as boolean;
      delete preference['vector_speed_contraint' as BeamboxPreferenceKey];
    }

    // to migrate preference of old version
    for (const key in DEFAULT_PREFERENCE) {
      if (!(key in preference)) {
        // @ts-expect-error key is keyof BeamboxPreference
        preference[key] = DEFAULT_PREFERENCE[key];
      } else if (objectKeys.includes(key)) {
        // @ts-expect-error key is keyof BeamboxPreference
        preference[key] = { ...DEFAULT_PREFERENCE[key], ...preference[key] };
      }
    }

    console.log('startup preference', preference);

    storage.set('beambox-preference', preference);
  }

  read<Key extends BeamboxPreferenceKey>(key: Key): BeamboxPreferenceValue<Key> {
    return storage.get('beambox-preference')[key];
  }

  write<Key extends BeamboxPreferenceKey>(key: Key, value: BeamboxPreferenceValue<Key>): void {
    const preference = storage.get('beambox-preference');

    preference[key] = value;
    storage.set('beambox-preference', preference);
    eventEmitter.emit(key, value);
  }
}

const beamboxPreference = new BeamboxPreferenceClass();

export const migrate = (): void => {
  // Migrate from 0/1 to boolean
  (['rotary_mode', 'enable-job-origin', 'frame-before-start', 'promark-start-button'] as const).forEach((key) => {
    const oldValue = beamboxPreference.read(key);

    if (typeof oldValue === 'number') {
      beamboxPreference.write(key, Boolean(oldValue));
    }
  });
};

export default beamboxPreference;
