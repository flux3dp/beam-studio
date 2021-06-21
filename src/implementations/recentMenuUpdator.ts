import electron from 'electron';

import FileExportHelper from 'helpers/file-export-helper';
import i18n from 'helpers/i18n';
import { IRecentMenuUpdator } from 'interfaces/IRecentMenuUpdator';

import storage from './storage';

const { Menu, MenuItem } = electron.remote;

export default {
  update() {
    const recentFiles = storage.get('recent_files') || [];
    const recentMenu = Menu.getApplicationMenu().items.filter((i) => i.id === '_file')[0].submenu.items.filter((i) => i.id === 'RECENT')[0].submenu;
    recentMenu.items = [];
    recentMenu.clear();
    recentFiles.forEach((filePath) => {
      let label = filePath;
      if (window.os !== 'Windows') {
        label = filePath.replace(':', '/');
      }
      recentMenu.append(new MenuItem({
        id: label,
        label,
        click: async () => {
          const res = await FileExportHelper.toggleUnsavedChangedDialog();
          if (res) this.loadRecentFile(filePath);
        },
      }));
    });
    recentMenu.append(new MenuItem({ type: 'separator' }));
    recentMenu.append(new MenuItem({
      id: 'CLEAR_RECENT',
      label: i18n.lang.topmenu.file.clear_recent,
      click: () => { this.cleanRecentFiles(); },
    }));
    Menu.setApplicationMenu(Menu.getApplicationMenu());
    if (window.os === 'Windows' && window.titlebar) {
      window.titlebar.updateMenu(Menu.getApplicationMenu());
    }
  },
} as IRecentMenuUpdator;
