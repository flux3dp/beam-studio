import { isMac } from '@core/helpers/system-helper';

export interface MenuItem {
  action: string;
  representation: string;
  shortcut: string[];
  splitKey: string;
}

const capitalize = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1);

const keyToPresentationMap: Record<string, string> = {
  Alt: '⌥',
  Fnkey: '⌘',
  Shift: '⇧',
};

// Helper to join keys for representation
const parseKeysToPresentation = (keys: string[]): string =>
  keys
    .map((key) => {
      if (key.length === 1) {
        return key.toUpperCase();
      }

      if (!isMac()) {
        return key === 'Fnkey' ? 'Ctrl' : capitalize(key);
      }

      return keyToPresentationMap[key] || key;
    })
    .join(isMac() ? '' : '+');

const createShortcut = (action: string, shortcut: string[], splitKey = '+'): MenuItem => ({
  action,
  representation: parseKeysToPresentation(shortcut[0].split(splitKey)),
  shortcut,
  splitKey,
});

export const menuItems: Record<string, MenuItem> = {
  // mac option + m would be µ
  add_new_machine: createShortcut('ADD_NEW_MACHINE', ['Alt+m', 'Alt+µ']),
  // mac option + n would be Dead
  clear_scene: createShortcut('CLEAR_SCENE', ['Alt+n', 'Alt+Dead']),
  copy: createShortcut('COPY', ['Fnkey+c']),
  cut: createShortcut('CUT', ['Fnkey+x']),
  duplicate: createShortcut('DUPLICATE', ['Fnkey+d']),
  export_flux_task: createShortcut('EXPORT_FLUX_TASK', ['Fnkey+e']),
  group: createShortcut('GROUP', ['Fnkey+g']),
  paste: createShortcut('PASTE', ['Fnkey+v']),
  paste_in_place: createShortcut('PASTE_IN_PLACE', ['Shift+Fnkey+v']),
  preferences: createShortcut('PREFERENCE', ['Fnkey+k']),
  redo: createShortcut('REDO', ['Shift+Fnkey+z']),
  save_as: createShortcut('SAVE_AS', ['Shift+Fnkey+s']),
  save_scene: createShortcut('SAVE_SCENE', ['Fnkey+s']),
  show_layer_controls_panel: createShortcut('SHOW_LAYER_CONTROLS_PANEL', ['l']),
  show_object_properties_panel: createShortcut('SHOW_OBJECT_CONTROLS_PANEL', ['o']),
  undo: createShortcut('UNDO', ['Fnkey+z']),
  ungroup: createShortcut('UNGROUP', ['Shift+Fnkey+g']),
  // for numpad, it should use the '+' key
  zoom_in: createShortcut('ZOOM_IN', ['Fnkey-+', 'Fnkey-='], '-'),
  zoom_out: createShortcut('ZOOM_OUT', ['Fnkey+-']),
};
