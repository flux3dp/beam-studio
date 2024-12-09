// eslint-disable-next-line import/no-extraneous-dependencies
import { app, ipcMain, WebContents } from 'electron';
import { autoUpdater } from 'electron-updater';

import events from './ipc-events';
import { getFocusedView } from './helpers/tabHelper';

export class UpdateManager {
  isDownloading: boolean;

  static instance: UpdateManager;

  static init = (): void => {
    UpdateManager.instance = new UpdateManager();
  };

  static getInstance = (): UpdateManager => UpdateManager.instance;

  constructor() {
    this.isDownloading = false;
    autoUpdater.autoDownload = false;
    autoUpdater.allowDowngrade = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.on('checking-for-update', () => {});
    autoUpdater.on('update-available', (info) => {
      console.log('Update Available, Info:', info);
      const res = { info, isUpdateAvailable: true };
      this.send(events.UPDATE_AVAILABLE, res);
    });
    autoUpdater.on('update-not-available', (info) => {
      console.log('Update Not Available, Info:', info);
      this.isDownloading = false;
      const res = { info, isUpdateAvailable: false };
      this.send(events.UPDATE_AVAILABLE, res);
    });
    autoUpdater.on('update-downloaded', (info) => {
      console.log('Update Downloaded, Info:', info);
      this.isDownloading = false;
      this.send(events.UPDATE_DOWNLOADED, info);
    });
    autoUpdater.on('download-progress', (progress) => {
      console.log(progress);
      this.send(events.DOWNLOAD_PROGRESS, progress);
    });
    ipcMain.on(events.CHECK_FOR_UPDATE, (event, channel) => {
      if (channel) {
        autoUpdater.channel = channel;
      } else {
        autoUpdater.channel = app.getVersion().split('-')[1] || 'latest';
      }
      this.checkForUpdates(event.sender);
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

  checkForUpdates = async (webContents: WebContents): Promise<void> => {
    let res;
    try {
      res = await autoUpdater.checkForUpdates();
    } catch (error) {
      console.error(error);
      res = { error, isUpdateAvailable: true };
    }
    if (webContents) webContents?.send(events.UPDATE_AVAILABLE, res);
    else this.send(events.UPDATE_AVAILABLE, res);
  };

  private send = (event: string, data: unknown): void => {
    getFocusedView()?.webContents.send(event, data);
  };
}

export default UpdateManager;
