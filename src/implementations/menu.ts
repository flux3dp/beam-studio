/* eslint-disable @typescript-eslint/ban-types */
import electron from 'electron';
import {
  IMenu,
  MenuItemOptions,
} from 'interfaces/IMenu';

const { Menu, MenuItem } = electron.remote;
export default {
  getApplicationMenu(): electron.Menu {
    return Menu.getApplicationMenu();
  },
  setApplicationMenu(menu: electron.Menu) {
    Menu.setApplicationMenu(menu);
  },
  appendMenuItem(menu: electron.Menu, options: MenuItemOptions): void {
    menu.append(new MenuItem(options));
  },
} as IMenu;
