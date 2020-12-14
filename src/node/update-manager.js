const {app, ipcMain, BrowserWindow} = require('electron');
const events = require('./ipc-events');
const { autoUpdater, UpdaterSignal } = require("electron-updater");


class AutoUpdateManager {
    constructor () {
        this.mainWindow = null;
        this.isDownloading = false;
        autoUpdater.autoDownload = false;
        autoUpdater.allowDowngrade = true;
        autoUpdater.autoInstallOnAppQuit = true;
        autoUpdater.on('checking-for-update', () => {
        });
        autoUpdater.on('update-available', info => {
            console.log('Update Available, Info:', info);
            let res = {
                info,
                isUpdateAvailable: true
            }
            if (this.mainWindow) {
                this.mainWindow.webContents.send(events.UPDATE_AVAILABLE, res);
            } else {
                BrowserWindow.getFocusedWindow().webContents.send(events.UPDATE_AVAILABLE, res);
            }
        });
        autoUpdater.on('update-not-available', info => {
            console.log('Update Not Available, Info:', info);
            this.isDownloading = false;
            let res = {
                info,
                isUpdateAvailable: false
            };
            if (this.mainWindow) {
                this.mainWindow.webContents.send(events.UPDATE_AVAILABLE, res);
            } else {
                BrowserWindow.getFocusedWindow().webContents.send(events.UPDATE_AVAILABLE, res);
            }
        });
        autoUpdater.on('update-downloaded', info => {
            console.log('Update Downloaded, Info:', info);
            this.isDownloading = false;
            if (this.mainWindow) {
                this.mainWindow.webContents.send(events.UPDATE_DOWNLOADED, info);
            } else {
                BrowserWindow.getFocusedWindow().webContents.send(events.UPDATE_DOWNLOADED, info);
            }
        });
        autoUpdater.on('download-progress', (progress) => {
            console.log(progress);
            if (this.mainWindow) {
                this.mainWindow.webContents.send(events.DOWNLOAD_PROGRESS, progress);
            } else {
                BrowserWindow.getFocusedWindow().webContents.send(events.DOWNLOAD_PROGRESS, progress);
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
        ipcMain.on(events.DOWNLOAD_UPDATE, ()=> {
            if (!this.isDownloading) {
                autoUpdater.downloadUpdate();
                this.isDownloading = true;
            }
        });
        ipcMain.on(events.QUIT_AND_INSTALL, ()=> {
            autoUpdater.quitAndInstall();
        });
    }

    checkForUpdates = async () => {
        let res;
        try {
            res = await autoUpdater.checkForUpdates();
        } catch (error) {
            console.log(error)
            res = {
                error,
                isUpdateAvailable: true
            }
        }
        if (this.mainWindow) {
            this.mainWindow.webContents.send(events.UPDATE_AVAILABLE, res);
        } else {
            BrowserWindow.getFocusedWindow().webContents.send(events.UPDATE_AVAILABLE, res);
        }
    }

    setMainWindow = (mainWindow) => {
        this.mainWindow = mainWindow;
    }
}

module.exports = AutoUpdateManager;