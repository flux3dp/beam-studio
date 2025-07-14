import { Menu } from '@electron/remote';

export const getOneMenuItem = (id: string): Electron.MenuItem =>
  Menu.getApplicationMenu()?.getMenuItemById(id) as Electron.MenuItem;

export const getManyMenuItems = (ids: string[]): Electron.MenuItem[] => {
  let currentItem: Electron.MenuItem = getOneMenuItem('_file');

  for (const id of ids) {
    const targetItem = getOneMenuItem(id);

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

export const changeMenuItemEnabled = (ids: string[], enabled = true): void => {
  const menuItems = getManyMenuItems(ids);

  if (menuItems.length) {
    menuItems.forEach((item) => {
      item.enabled = enabled;
    });
  }
};
