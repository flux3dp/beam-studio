const {ipcMain, BrowserWindow} = require('electron');
const events = require('./ipc-events');
const { autoUpdater, UpdaterSignal } = require("electron-updater");


class AutoUpdateManager {
    constructor () {
        autoUpdater.autoDownload = false;
        autoUpdater.on('checking-for-update', () => {
        });
        autoUpdater.on('update-available', info => {
            console.log('Update Available, Info:', info);
            let res = {
                info,
                isUpdateAvailable: true
            }
            BrowserWindow.getFocusedWindow().webContents.send(events.UPDATE_AVAILABLE, res);
        });
        autoUpdater.on('update-not-available', info => {
            console.log('Update Not Available, Info:', info);
            let res = {
                info,
                isUpdateAvailable: false
            };
            BrowserWindow.getFocusedWindow().webContents.send(events.UPDATE_AVAILABLE, res);
        });
        autoUpdater.on('update-downloaded', info => {
            console.log('Update Downloaded, Info:', info);
            BrowserWindow.getFocusedWindow().webContents.send(events.UPDATE_DOWNLOADED, info);
        });
        autoUpdater.on('download-progress', (progress) => {
            console.log(progress);
            BrowserWindow.getFocusedWindow().webContents.send(events.DOWNLOAD_PROGRESS, progress);
        });
        ipcMain.on(events.CHECK_FOR_UPDATE, () => {
            this.checkForUpdates();
        });
        ipcMain.on(events.DOWNLOAD_UPDATE, ()=> {
            autoUpdater.downloadUpdate();
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
        BrowserWindow.getFocusedWindow().webContents.send(events.UPDATE_AVAILABLE, res);
    }
}

module.exports = AutoUpdateManager;