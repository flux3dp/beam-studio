import type { PreviewSpeedLevelType } from '@core/app/actions/beambox/constant';
import { PreviewSpeedLevel } from '@core/app/actions/beambox/constant';
import constant from '@core/app/actions/beambox/constant';
import { CHUCK_ROTARY_DIAMETER, RotaryType } from '@core/app/constants/addOn';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import type { ModuleOffsets } from '@core/app/constants/layer-module/module-offsets';
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
  'auto-feeder-scale': number;
  'auto-switch-tab': boolean;
  auto_align: boolean;
  auto_shrink: boolean;
  blade_precut: boolean;
  blade_radius: number;
  borderless: boolean;
  continuous_drawing: boolean;
  curve_engraving_speed_limit: boolean;
  'customized-dimension': Partial<Record<WorkAreaModel, { height: number; width: number }>>;
  'default-autofocus': boolean;
  'default-borderless': boolean;
  'default-diode': boolean;
  'default-laser-module': LayerModuleType;
  'diode-one-way-engraving': boolean;
  diode_offset_x: number;
  diode_offset_y: number;
  'enable-autofocus'?: boolean;
  'enable-custom-backlash': boolean;
  'enable-custom-preview-height': boolean;
  'enable-diode'?: boolean;
  'enable-job-origin': boolean;
  'enable-uv-print-file': boolean;
  enable_mask: boolean;
  engrave_dpi: 'high' | 'low' | 'medium' | 'ultra';
  'extend-rotary-workarea': boolean;
  fast_gradient: boolean;
  'font-convert': '1.0' | '2.0';
  'font-substitute': boolean;
  'frame-before-start': boolean;
  guide_x0: number;
  guide_y0: number;
  image_downsampling: boolean;
  'import-module'?: LayerModuleType;
  'job-origin': number;
  'keep-preview-result': boolean;
  low_power: number;
  // model is default workarea model
  model: WorkAreaModel;
  'module-offsets': ModuleOffsets;
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
  preview_movement_speed_level: PreviewSpeedLevelType;
  'print-advanced-mode': boolean;
  'promark-safety-door': boolean;
  'promark-start-button': boolean;
  'reverse-engraving': boolean;
  'rotary-chuck-obj-d': number;
  'rotary-mirror': boolean;
  'rotary-overlap': number;
  'rotary-scale': number; // extra rotary scale when exporting
  'rotary-split': number;
  'rotary-type': RotaryType;
  'rotary-y': null | number;
  rotary_mode: boolean;
  rotary_y_coord: number;
  'segmented-engraving': boolean;
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
  'auto-feeder-scale': 1,
  'auto-switch-tab': false,
  auto_align: true,
  auto_shrink: false,
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
  'enable-uv-print-file': false,
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
  'promark-safety-door': false,
  'promark-start-button': false,
  'reverse-engraving': false,
  'rotary-chuck-obj-d': CHUCK_ROTARY_DIAMETER,
  'rotary-mirror': false,
  'rotary-overlap': 0,
  'rotary-scale': 1,
  'rotary-split': 0.5,
  'rotary-type': RotaryType.Roller,
  'rotary-y': null,
  rotary_mode: false,
  rotary_y_coord: 5,
  'segmented-engraving': true,
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

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? (T[K] extends Function ? T[K] : DeepPartial<T[K]>) : T[K];
};

function deepApplyDefaults<T extends { [key: string]: any }>(target: DeepPartial<T>, defaults: T) {
  const keys = Object.keys(defaults) as Array<keyof T>;

  for (const key of keys) {
    const defaultVal = defaults[key];

    if (!(key in target)) {
      target[key] = defaultVal;
    } else if (typeof defaultVal === 'object' && defaultVal !== null && !Array.isArray(defaultVal)) {
      deepApplyDefaults(target[key]!, defaultVal);
    }
  }
}

class BeamboxPreferenceClass {
  constructor() {
    let preference: BeamboxPreference | null = storage.get('beambox-preference');

    if (preference) {
      // migrate renamed key
      const oldValue = preference['vector_speed_contraint' as BeamboxPreferenceKey];

      if (oldValue !== undefined) {
        preference['vector_speed_constraint'] = oldValue as boolean;
        // @ts-expect-error key is former keyof BeamboxPreference
        delete preference['vector_speed_contraint'];
      }

      if (preference['module-offsets']) {
        if (!preference['module-offsets'].ado1) {
          // migrate module-offsets from one level (ador only) to two levels
          preference['module-offsets'] = { ado1: preference['module-offsets'] as ModuleOffsets['ado1'] };
        } else if (
          preference['module-offsets'].fbm2 &&
          !preference['module-offsets'].fbm2[LayerModule.LASER_UNIVERSAL]?.[2]
        ) {
          // remove legacy default offsets from development builds
          delete preference['module-offsets'].fbm2;
        }
      }

      // update preference from old version (allowing missing fields and used defaults directly)
      // and handle new keys in nested objects
      deepApplyDefaults(preference, DEFAULT_PREFERENCE);
    } else {
      // init beambox-preference
      preference = DEFAULT_PREFERENCE;
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
