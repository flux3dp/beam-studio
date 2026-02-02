import { create } from 'zustand';
import { combine, subscribeWithSelector } from 'zustand/middleware';

import { TabEvents } from '@core/app/constants/ipcEvents';
import communicator from '@core/implementations/communicator';
import storage from '@core/implementations/storage';
import type { BeamboxPreference, GlobalPreference, GlobalPreferenceKey } from '@core/interfaces/Preference';

import beamboxPreference from '../actions/beambox/beambox-preference';

export type GlobalPreferenceStore = GlobalPreference & {
  reload: () => void;
  set: <K extends keyof GlobalPreference>(key: K, value: GlobalPreference[K], shouldNotifyChanges?: boolean) => void;
  update: (payload: Partial<GlobalPreference>) => void;
};

const getInitStore = (): GlobalPreference => {
  const preference = storage.get('beambox-preference', false) as BeamboxPreference;

  return {
    'af-offset': preference['af-offset'],
    'anti-aliasing': preference['anti-aliasing'],
    'auto-switch-tab': preference['auto-switch-tab'],
    auto_align: preference.auto_align,
    continuous_drawing: preference.continuous_drawing,
    'crop-task-thumbnail': preference['crop-task-thumbnail'],
    curve_engraving_speed_limit: preference.curve_engraving_speed_limit,
    'default-autofocus': preference['default-autofocus'],
    'default-borderless': preference['default-borderless'],
    'default-diode': preference['default-diode'],
    'default-laser-module': preference['default-laser-module'],
    'diode-one-way-engraving': preference['diode-one-way-engraving'],
    diode_offset_x: preference.diode_offset_x,
    diode_offset_y: preference.diode_offset_y,
    'enable-custom-backlash': preference['enable-custom-backlash'],
    'enable-custom-preview-height': preference['enable-custom-preview-height'],
    'enable-uv-print-file': preference['enable-uv-print-file'],
    engrave_dpi: preference.engrave_dpi,
    fast_gradient: preference.fast_gradient,
    'font-convert': preference['font-convert'],
    'font-substitute': preference['font-substitute'],
    guide_x0: preference.guide_x0,
    guide_y0: preference.guide_y0,
    image_downsampling: preference.image_downsampling,
    'import-module': preference['import-module'],
    'keep-preview-result': preference['keep-preview-result'],
    low_power: preference.low_power,
    model: preference.model,
    'module-offsets': preference['module-offsets'],
    mouse_input_device: preference.mouse_input_device,
    'multipass-compensation': preference['multipass-compensation'],
    'one-way-printing': preference['one-way-printing'],
    padding_accel: preference.padding_accel,
    padding_accel_diode: preference.padding_accel_diode,
    'path-engine': preference['path-engine'],
    preview_movement_speed_level: preference.preview_movement_speed_level,
    'print-advanced-mode': preference['print-advanced-mode'],
    'reverse-engraving': preference['reverse-engraving'],
    'segmented-engraving': preference['segmented-engraving'],
    should_remind_calibrate_camera: preference.should_remind_calibrate_camera,
    show_grids: preference.show_grids,
    show_guides: preference.show_guides,
    show_rulers: preference.show_rulers,
    simplify_clipper_path: preference.simplify_clipper_path,
    'use-auto-exposure': preference['use-auto-exposure'],
    'use-real-boundary': preference['use-real-boundary'],
    'use-union-boundary': preference['use-union-boundary'],
    use_layer_color: preference.use_layer_color,
    vector_speed_constraint: preference.vector_speed_constraint,
    zoom_with_window: preference.zoom_with_window,
  };
};

/**
 * Global Preference Store stores the states in BeamboxPreference that are shared by all tabs.
 */
export const useGlobalPreferenceStore = create(
  subscribeWithSelector<GlobalPreferenceStore>(
    combine(getInitStore(), (set) => ({
      reload: () => {
        set(getInitStore());
      },

      set: <K extends keyof GlobalPreference>(key: K, value: GlobalPreference[K], shouldNotifyChanges = true) => {
        set(() => {
          beamboxPreference.write(key, value as any, shouldNotifyChanges);

          return { [key]: value };
        });
      },

      update: (payload: Partial<GlobalPreference>) => {
        set(() => {
          for (const [key, value] of Object.entries(payload)) {
            beamboxPreference.write(key as GlobalPreferenceKey, value as any);
          }

          return payload;
        });
      },
    })),
  ),
);

communicator.on(
  TabEvents.GlobalPreferenceChanged,
  <K extends keyof GlobalPreference>(_: unknown, key: K, value: GlobalPreference[K]) => {
    // use setState to avoid writing to storage multiple times
    useGlobalPreferenceStore.setState({ [key]: value });
  },
);
