// eslint-disable-next-line import/no-extraneous-dependencies
import { app, BrowserWindow, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';

import events from './ipc-events';

class UpdateManager {
  mainWindow: BrowserWindow | null;

  isDownloading: boolean;

  constructor() {
    this.mainWindow = null;
    this.isDownloading = false;
    autoUpdater.autoDownload = false;
    autoUpdater.allowDowngrade = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.on('checking-for-update', () => {
    });
    autoUpdater.on('update-available', (info) => {
      console.log('Update Available, Info:', info);
      const res = { info, isUpdateAvailable: true };
      if (this.mainWindow) {
        this.mainWindow.webContents.send(events.UPDATE_AVAILABLE, res);
      } else {
        BrowserWindow.getFocusedWindow()?.webContents.send(events.UPDATE_AVAILABLE, res);
      }
    });
    autoUpdater.on('update-not-available', (info) => {
      console.log('Update Not Available, Info:', info);
      this.isDownloading = false;
      const res = { info, isUpdateAvailable: false };
      if (this.mainWindow) {
        this.mainWindow.webContents.send(events.UPDATE_AVAILABLE, res);
      } else {
        BrowserWindow.getFocusedWindow()?.webContents.send(events.UPDATE_AVAILABLE, res);
      }
    });
    autoUpdater.on('update-downloaded', (info) => {
      console.log('Update Downloaded, Info:', info);
      this.isDownloading = false;
      if (this.mainWindow) {
        this.mainWindow.webContents.send(events.UPDATE_DOWNLOADED, info);
      } else {
        BrowserWindow.getFocusedWindow()?.webContents.send(events.UPDATE_DOWNLOADED, info);
      }
    });
    autoUpdater.on('download-progress', (progress) => {
      console.log(progress);
      if (this.mainWindow) {
        this.mainWindow.webContents.send(events.DOWNLOAD_PROGRESS, progress);
      } else {
        BrowserWindow.getFocusedWindow()?.webContents.send(events.DOWNLOAD_PROGRESS, progress);
      }
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
    if (this.mainWindow) {
      this.mainWindow.webContents.send(events.UPDATE_AVAILABLE, res);
    } else {
      BrowserWindow.getFocusedWindow()?.webContents.send(events.UPDATE_AVAILABLE, res);
    }
  };

  setMainWindow = (mainWindow: BrowserWindow): void => {
    this.mainWindow = mainWindow;
  };
}

export default UpdateManager;
