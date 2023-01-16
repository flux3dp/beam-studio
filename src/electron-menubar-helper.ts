import { Menu } from '@electron/remote';

export const getMenuItem = (ids: string[]): Electron.MenuItem => {
  const applicationMenu = Menu.getApplicationMenu();
  let currentItem: Electron.MenuItem;
  for (let i = 0; i < ids.length; i += 1) {
    if (i === 0) {
      currentItem = applicationMenu.items.find((item) => item.id === ids[i]);
    } else {
      currentItem = currentItem.submenu.items.find((item) => item.id === ids[i]);
    }
  }
  return currentItem;
};

export const updateCheckbox = (ids: string[], checked: boolean): void => {
  const menuItem = getMenuItem(ids);
  if (menuItem) menuItem.checked = checked;
};
