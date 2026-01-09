import { PreviewSpeedLevel } from '@core/app/actions/beambox/constant';
import constant from '@core/app/actions/beambox/constant';
import { CHUCK_ROTARY_DIAMETER, RotaryType } from '@core/app/constants/addOn';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import type { ModuleOffsets } from '@core/app/constants/layer-module/module-offsets';
import moduleOffsets from '@core/app/constants/layer-module/module-offsets';
import { TabEvents } from '@core/app/constants/tabConstants';
import { getOS } from '@core/helpers/getOS';
import communicator from '@core/implementations/communicator';
import storage from '@core/implementations/storage';
import type { BeamboxPreference, BeamboxPreferenceKey, BeamboxPreferenceValue } from '@core/interfaces/Preference';

const DEFAULT_PREFERENCE: BeamboxPreference = {
  'af-offset': 0,
  'anti-aliasing': true,
  'auto-feeder': false,
  'auto-feeder-scale': 1,
  'auto-switch-tab': true,
  auto_align: true,
  auto_shrink: false,
  borderless: false,
  continuous_drawing: false,
  'crop-task-thumbnail': false,
  curve_engraving_speed_limit: true,
  'customized-dimension': { fpm1: { height: 150, width: 150 } },
  'default-autofocus': false,
  'default-borderless': false,
  'default-diode': false,
  'default-laser-module': LayerModule.LASER_20W_DIODE,
  'diode-one-way-engraving': true,
  diode_offset_x: constant.diode.defaultOffsetX,
  diode_offset_y: constant.diode.defaultOffsetY,
  'enable-4c': false,
  'enable-4c-prespray-area': true,
  'enable-1064': false,
  'enable-custom-backlash': false,
  'enable-custom-preview-height': false,
  'enable-job-origin': false,
  'enable-uv-print-file': false,
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
  mouse_input_device: getOS() === 'MacOS' ? 'TOUCHPAD' : 'MOUSE',
  'multipass-compensation': true,
  'one-way-printing': true,
  padding_accel: 5000,
  padding_accel_diode: 4500,
  'pass-through': false,
  'path-engine': 'fluxghost',
  preview_movement_speed_level: PreviewSpeedLevel.SLOW,
  'print-advanced-mode': false,
  'promark-safety-door': false,
  'promark-start-button': false,
  'reverse-engraving': false,
  'rotary-chuck-obj-d': CHUCK_ROTARY_DIAMETER,
  'rotary-mirror': false,
  'rotary-overlap': 0,
  'rotary-scale': 1,
  'rotary-split': 0.05,
  'rotary-type': RotaryType.Roller,
  'rotary-y': null,
  rotary_mode: false,
  'segmented-engraving': true,
  should_remind_calibrate_camera: true,
  show_grids: true,
  show_guides: false,
  show_rulers: false,
  simplify_clipper_path: false,
  skip_prespray: false,
  'use-real-boundary': false,
  'use-union-boundary': true,
  use_layer_color: true,
  vector_speed_constraint: true,
  workarea: 'fbb1b',
  zoom_with_window: false,
};

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
          !preference['module-offsets'].fbm2[LayerModule.LASER_UNIVERSAL]?.[2] &&
          moduleOffsets.fbm2?.[LayerModule.LASER_UNIVERSAL]?.[2]
        ) {
          // remove legacy default offsets from development builds
          delete preference['module-offsets'].fbm2;
        } else if (preference['module-offsets'].fbm2?.[LayerModule.LASER_UNIVERSAL]) {
          // This is for dev, can be removed after setting default
          delete preference['module-offsets'].fbm2[LayerModule.LASER_UNIVERSAL];
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

  write<Key extends BeamboxPreferenceKey>(
    key: Key,
    value: BeamboxPreferenceValue<Key>,
    shouldNotifyChanges: boolean = true,
  ): void {
    const preference = storage.get('beambox-preference');

    try {
      preference[key] = value;
      storage.set('beambox-preference', preference);
    } catch (error) {
      console.trace('Error writing beambox preference', preference, key, value, error);
    }

    if (shouldNotifyChanges) communicator.send(TabEvents.GlobalPreferenceChanged, key, value);
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
