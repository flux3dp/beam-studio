/* eslint-disable @typescript-eslint/ban-types */
import electron from 'electron';
import { Color, Titlebar } from 'custom-electron-titlebar';

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
  createTitleBar() {
    return new Titlebar({
      backgroundColor: Color.fromHex('#333'),
      shadow: false,
      icon: 'win-title-icon.png',
    });
  },
} as IMenu;
