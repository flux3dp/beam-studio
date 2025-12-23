import os from 'os';

import type { BaseWindow } from 'electron';
import { app, dialog, shell } from 'electron';

import i18n from './i18n';

export const checkMacOsBuild = async (mainWindow: BaseWindow): Promise<void> => {
  if (process.platform !== 'darwin') {
    return;
  }

  const arch = os.arch();
  const cpus = os.cpus();

  if (arch === 'x64' && cpus.some((cpu) => cpu.model.includes('Apple'))) {
    const lang = i18n.getNativeLang();

    const t = lang.message.mac_os_arch_mismatch;
    const { response } = await dialog.showMessageBox(mainWindow, {
      buttons: [t.download_center, lang.global.cancel],
      cancelId: 1,
      defaultId: 0,
      message: t.message,
      title: t.caption,
    });

    if (response === 0) {
      shell.openExternal(i18n.lang.topbar.menu.link.downloads);
      app.exit(0);
    }
  }

  return;
};

export default checkMacOsBuild;
