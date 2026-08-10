import { INITIALLY_DISABLED_MENU_ITEMS } from '@core/helpers/menubar/menuItemStatus';

import { useMenuItemStatusStore } from './menuItemStatusStore';

describe('menuItemStatusStore', () => {
  test('starts with the items disabled in the electron menu template', () => {
    const { disabledKeys } = useMenuItemStatusStore.getState();

    expect(disabledKeys.size).toBe(INITIALLY_DISABLED_MENU_ITEMS.length);
    expect(disabledKeys.has('START_CURVE_ENGRAVING_MODE')).toBe(true);
    expect(disabledKeys.has('DECOMPOSE_PATH')).toBe(true);
    // always enabled items are not listed
    expect(disabledKeys.has('ADD_NEW_MACHINE')).toBe(false);
  });

  test('enable removes ids and disable adds them back', () => {
    const { disable, enable } = useMenuItemStatusStore.getState();

    enable(['DUPLICATE', 'GROUP']);
    expect(useMenuItemStatusStore.getState().disabledKeys.has('DUPLICATE')).toBe(false);
    expect(useMenuItemStatusStore.getState().disabledKeys.has('GROUP')).toBe(false);
    // untouched ids keep their status
    expect(useMenuItemStatusStore.getState().disabledKeys.has('UNGROUP')).toBe(true);

    disable(['DUPLICATE']);
    expect(useMenuItemStatusStore.getState().disabledKeys.has('DUPLICATE')).toBe(true);
    expect(useMenuItemStatusStore.getState().disabledKeys.has('GROUP')).toBe(false);
  });

  test('accepts ids that are not initially disabled', () => {
    useMenuItemStatusStore.getState().disable(['ADD_NEW_MACHINE']);
    expect(useMenuItemStatusStore.getState().disabledKeys.has('ADD_NEW_MACHINE')).toBe(true);
  });

  test('keeps the same set reference when nothing changes', () => {
    const { disabledKeys: before } = useMenuItemStatusStore.getState();

    // already disabled
    useMenuItemStatusStore.getState().disable(['DUPLICATE']);
    expect(useMenuItemStatusStore.getState().disabledKeys).toBe(before);

    // never disabled
    useMenuItemStatusStore.getState().enable(['ADD_NEW_MACHINE']);
    expect(useMenuItemStatusStore.getState().disabledKeys).toBe(before);
  });
});
