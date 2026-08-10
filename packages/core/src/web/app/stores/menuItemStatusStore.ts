import { create } from 'zustand';

import { INITIALLY_DISABLED_MENU_ITEMS } from '@core/helpers/menubar/menuItemStatus';

export type MenuItemStatusState = {
  disable: (ids: string[]) => void;
  /** ids of the menu items that should be rendered as disabled */
  disabledKeys: Set<string>;
  enable: (ids: string[]) => void;
};

const updateDisabledKeys = (current: Set<string>, ids: string[], disabled: boolean): Set<string> => {
  // keep the same reference when nothing changes, enable/disable is called on every selection change
  if (!ids.some((id) => current.has(id) !== disabled)) return current;

  const next = new Set(current);

  for (const id of ids) {
    if (disabled) next.add(id);
    else next.delete(id);
  }

  return next;
};

/**
 * Disabled status of the web menu items, mirroring the `enabled` flag of the electron menu.
 *
 * It lives outside React so that enable/disable calls made before (or between) mounts of the
 * top bar menu are not lost. The electron app updates its native menu instead and does not use it.
 */
export const useMenuItemStatusStore = create<MenuItemStatusState>((set) => ({
  disable: (ids) => set(({ disabledKeys }) => ({ disabledKeys: updateDisabledKeys(disabledKeys, ids, true) })),
  disabledKeys: new Set(INITIALLY_DISABLED_MENU_ITEMS),
  enable: (ids) => set(({ disabledKeys }) => ({ disabledKeys: updateDisabledKeys(disabledKeys, ids, false) })),
}));
