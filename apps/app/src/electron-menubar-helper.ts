import { Menu } from '@electron/remote';

export const getOneMenuItem = (id: string): Electron.MenuItem =>
  Menu.getApplicationMenu()?.getMenuItemById(id) as Electron.MenuItem;

export const getManyMenuItems = (ids: string[]): Electron.MenuItem[] => {
  let currentItem: Electron.MenuItem = getOneMenuItem('_file');

  for (let i = 0; i < ids.length - 1; i += 1) {
    const targetItem = getOneMenuItem(ids[i]);

    if (!targetItem) {
      return [];
    }

    currentItem = targetItem;
  }

  return ids[ids.length - 1] === '*' ? (currentItem.submenu?.items ?? []) : [getOneMenuItem(ids[ids.length - 1])];
};

export const changeMenuItemChecked = (ids: string[], checked = true): void => {
  const menuItems = getManyMenuItems(ids);

  if (menuItems.length) {
    menuItems.forEach((item) => {
      item.checked = checked;
    });
  }
};

export const changeMenuItemVisible = (ids: string[], visible = true): void => {
  const menuItems = getManyMenuItems(ids);

  if (menuItems.length) {
    menuItems.forEach((item) => {
      item.visible = visible;
    });
  }
};

export const changeVisibilityByIsBb2 = (isBb2: boolean): void => {
  changeMenuItemVisible(['IMPORT_EXAMPLE_BEAMBOX_2'], isBb2);
  changeMenuItemVisible(['IMPORT_MATERIAL_TESTING_ENGRAVE_BEAMBOX_2'], isBb2);
  changeMenuItemVisible(['IMPORT_MATERIAL_TESTING_CUT_BEAMBOX_2'], isBb2);
  changeMenuItemVisible(['IMPORT_BEAMBOX_2_FOCUS_PROBE'], isBb2);

  changeMenuItemVisible(['IMPORT_MATERIAL_TESTING_ENGRAVE'], !isBb2);
  changeMenuItemVisible(['IMPORT_MATERIAL_TESTING_OLD'], !isBb2);
  changeMenuItemVisible(['IMPORT_MATERIAL_TESTING_CUT'], !isBb2);
  changeMenuItemVisible(['IMPORT_MATERIAL_TESTING_SIMPLECUT'], !isBb2);
};

export const changeVisibilityByIsPromark = (isPromark: boolean): void => {
  changeMenuItemVisible(['IMPORT_EXAMPLE_PROMARK'], isPromark);

  changeMenuItemVisible(['PROMARK_COLOR_TEST'], isPromark);
  changeMenuItemVisible(['PROMARK_COLOR_TEST', '*'], isPromark);
};
