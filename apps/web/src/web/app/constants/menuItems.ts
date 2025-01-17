import { isMac } from 'helpers/system-helper';

export interface MenuItem {
  action: string;
  shortcut: Array<string>;
  representation: string;
  splitKey: string;
}

const capitalize = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1);

const keyToPresentationMap: Record<string, string> = {
  Fnkey: '⌘',
  Alt: '⌥',
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

const createShortcut = (action: string, shortcut: Array<string>, splitKey = '+'): MenuItem => ({
  action,
  shortcut,
  representation: parseKeysToPresentation(shortcut[0].split(splitKey)),
  splitKey,
});

export const menuItems: Record<string, MenuItem> = {
  // mac option + m would be µ
  add_new_machine: createShortcut('ADD_NEW_MACHINE', ['Alt+m', 'Alt+µ']),
  cut: createShortcut('CUT', ['Fnkey+x']),
  copy: createShortcut('COPY', ['Fnkey+c']),
  paste: createShortcut('PASTE', ['Fnkey+v']),
  paste_in_place: createShortcut('PASTE_IN_PLACE', ['Shift+Fnkey+v']),
  duplicate: createShortcut('DUPLICATE', ['Fnkey+d']),
  // mac option + n would be Dead
  clear_scene: createShortcut('CLEAR_SCENE', ['Alt+n', 'Alt+Dead']),
  // for numpad, it should use the '+' key
  zoom_in: createShortcut('ZOOM_IN', ['Fnkey-+', 'Fnkey-='], '-'),
  zoom_out: createShortcut('ZOOM_OUT', ['Fnkey+-']),
  undo: createShortcut('UNDO', ['Fnkey+z']),
  redo: createShortcut('REDO', ['Shift+Fnkey+z']),
  group: createShortcut('GROUP', ['Fnkey+g']),
  ungroup: createShortcut('UNGROUP', ['Shift+Fnkey+g']),
  preferences: createShortcut('PREFERENCE', ['Fnkey+k']),
  save_scene: createShortcut('SAVE_SCENE', ['Fnkey+s']),
  save_as: createShortcut('SAVE_AS', ['Shift+Fnkey+s']),
  export_flux_task: createShortcut('EXPORT_FLUX_TASK', ['Fnkey+e']),
};
