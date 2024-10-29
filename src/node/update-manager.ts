// eslint-disable-next-line import/no-extraneous-dependencies
import { app, ipcMain, WebContents } from 'electron';
import { autoUpdater } from 'electron-updater';

import events from './ipc-events';

class UpdateManager {
  webContents: WebContents | null;

  isDownloading: boolean;

  constructor() {
    this.webContents = null;
    this.isDownloading = false;
    autoUpdater.autoDownload = false;
    autoUpdater.allowDowngrade = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.on('checking-for-update', () => {
    });
    autoUpdater.on('update-available', (info) => {
      console.log('Update Available, Info:', info);
      const res = { info, isUpdateAvailable: true };
      this.webContents?.send(events.UPDATE_AVAILABLE, res);
    });
    autoUpdater.on('update-not-available', (info) => {
      console.log('Update Not Available, Info:', info);
      this.isDownloading = false;
      const res = { info, isUpdateAvailable: false };
      this.webContents?.send(events.UPDATE_AVAILABLE, res);
    });
    autoUpdater.on('update-downloaded', (info) => {
      console.log('Update Downloaded, Info:', info);
      this.isDownloading = false;
      this.webContents?.send(events.UPDATE_DOWNLOADED, info);
    });
    autoUpdater.on('download-progress', (progress) => {
      console.log(progress);
      this.webContents?.send(events.DOWNLOAD_PROGRESS, progress);
    });
    ipcMain.on(events.CHECK_FOR_UPDATE, (event, channel) => {
      if (channel) {
        autoUpdater.channel = channel;
      } else {
        autoUpdater.channel = app.getVersion().split('-')[1] || 'latest';
      }
      this.checkForUpdates();
    });
    ipcMain.on(events.DOWNLOAD_UPDATE, () => {
      if (!this.isDownloading) {
        autoUpdater.downloadUpdate();
        this.isDownloading = true;
      }
    });
    ipcMain.on(events.QUIT_AND_INSTALL, () => {
      autoUpdater.quitAndInstall();
    });
  }

  checkForUpdates = async (): Promise<void> => {
    let res;
    try {
      res = await autoUpdater.checkForUpdates();
    } catch (error) {
      console.error(error);
      res = { error, isUpdateAvailable: true };
    }
    this.webContents?.send(events.UPDATE_AVAILABLE, res);
  };

  setWebContents = (webContents: WebContents): void => {
    this.webContents = webContents;
  };
}

export default UpdateManager;
