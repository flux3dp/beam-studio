// eslint-disable-next-line import/order
import { app, BaseWindow, BrowserWindow, ipcMain, systemPreferences } from 'electron';

app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.commandLine.appendSwitch('--no-sandbox');

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // If we failed to get the lock, another instance is already running.
  // Quit this new instance immediately. The primary instance will handle the file opening.
  app.quit();
}

import fs from 'fs';
import os from 'os';
import path from 'path';
import { pathToFileURL } from 'url';

import * as electronRemote from '@electron/remote/main';
import { captureMessage, init as SentryInit } from '@sentry/electron/main';
import { setupTitlebar } from 'custom-electron-titlebar/main';
import { pick } from 'remeda';

import { BackendEvents, MenuEvents, MiscEvents, SvgEvents } from '@core/app/constants/ipcEvents';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import BackendManager from './backend-manager';
import bootstrap from './bootstrap';
import { getDeepLinkUrl, handleDeepLinkUrl } from './deep-link-helper';
import fontHelper from './font-helper';
import checkMacOsBuild from './helpers/checkMacOsBuild';
import { setTabManager } from './helpers/tabHelper';
import MenuManager from './menu-manager';
import MonitorManager from './monitor-manager';
import networkHelper from './network-helper';
import TabManager from './tabManager';
import { UpdateManager } from './updateManager';

electronRemote.initialize();

SentryInit({ dsn: 'https://bbd96134db9147658677dcf024ae5a83@o28957.ingest.sentry.io/5617300' });
captureMessage('User Census', { level: 'info', tags: { census: 'v1', from: 'backend' } });
setupTitlebar();

let mainWindow: BaseWindow | null;
let menuManager: MenuManager | null;
let tabManager: null | TabManager;
let DEBUG = false;
let fileToOpenOnLaunch: null | string = null;

const globalData: {
  backend: { alive: boolean; logFile?: string; port?: number };
  devices: { [key: string]: IDeviceInfo };
} = { backend: { alive: false }, devices: {} };
let logger: { write: (data: string) => void };

const getFilePathFromArgv = (argv: string[]): null | string => {
  const potentialPath = argv.find((arg) => {
    if (!arg.startsWith('--') && arg !== process.execPath && !arg.startsWith('beam-studio://')) {
      try {
        // Check if the path exists and is a file.
        return fs.existsSync(arg) && fs.lstatSync(arg).isFile();
      } catch {
        return false;
      }
    }

    return false;
  });

  return potentialPath || null;
};

function createLogFile() {
  const storageDir = app.getPath('userData');

  const checkDir = (target: string) => {
    if (fs.existsSync(target)) return;

    checkDir(path.dirname(target));
    fs.mkdirSync(target);
  };

  checkDir(storageDir);

  const filename = path.join(app.getPath('userData'), 'backend.log');

  globalData.backend.logFile = filename;

  let writeStream = fs.createWriteStream(filename, { flags: 'w' });

  logger = writeStream;
  console.log = (...args) => writeStream.write(`${args.join(' ')}\n`);
  console.error = console.log;

  const setCloseEventHandler = () => {
    writeStream.on('close', () => {
      writeStream = fs.createWriteStream(filename, { flags: 'a' });
      logger = writeStream;
      console.log = (...args) => writeStream.write(`${args.join(' ')}\n`);
      console.error = console.log;
      setCloseEventHandler();
    });
  };

  setCloseEventHandler();

  return writeStream;
}

logger = process.stderr.isTTY ? process.stderr : createLogFile();

if (process.argv.includes('--debug-mode') || process.env.DEBUG) {
  DEBUG = true;
  console.log('DEBUG Mode');
}

// Solve transparent window issue
if (process.platform === 'linux') {
  app.disableHardwareAcceleration();
}

function onGhostUp(data: { port: number }) {
  globalData.backend.alive = true;
  globalData.backend.port = data.port;
  tabManager?.sendToAllViews(BackendEvents.BackendUp, globalData.backend);
}

function onGhostDown() {
  globalData.backend.alive = false;
  globalData.backend.port = undefined;
}

function onDeviceUpdated(deviceInfo: IDeviceInfo) {
  const { alive, serial, source, uuid } = deviceInfo;
  const deviceID = `${source}:${uuid}`;

  if (alive) {
    if (menuManager) {
      if (
        globalData.devices[deviceID] &&
        (globalData.devices[deviceID].serial !== serial || globalData.devices[deviceID].version !== deviceInfo.version)
      ) {
        menuManager.removeDevice(uuid, globalData.devices[deviceID]);
      }

      const didUpdated = menuManager.updateDevice(uuid, deviceInfo);

      if (didUpdated) {
        tabManager?.sendToAllViews(MenuEvents.UpdateMenu);
      }
    }
  } else if (globalData.devices[deviceID]) {
    if (menuManager) {
      menuManager.removeDevice(uuid, globalData.devices[deviceID]);
      tabManager?.sendToAllViews(MenuEvents.UpdateMenu);
    }

    delete globalData.devices[deviceID];
  }

  globalData.devices[deviceID] = deviceInfo;
}

bootstrap();
UpdateManager.init();

const backendManager = new BackendManager({
  debug: DEBUG,
  location: process.env.BACKEND,
  on_ready: onGhostUp,
  on_stderr: (data) => logger.write(`${data}`),
  on_stopped: onGhostDown,
  server: process.argv.includes('--server'),
  trace_pid: process.pid,
});

backendManager.start();

// Run monitorexe api
let monitorManager: MonitorManager | null = null;

if (process.argv.includes('--monitor')) {
  console.log('Starting Monitor');
  monitorManager = new MonitorManager({ location: process.env.BACKEND || '' });
  // kill process first, in case last time shut down
  monitorManager.killProcSync();
  monitorManager.startProc();
}

let shadowWindow: BrowserWindow;
let shouldCloseShadowWindow = false;

const createShadowWindow = () => {
  if (shadowWindow) {
    return;
  }

  shadowWindow = new BrowserWindow({ show: false, webPreferences: { contextIsolation: false, nodeIntegration: true } });

  // shadowWindow.webContents.openDevTools();
  shadowWindow?.loadURL(pathToFileURL(path.join(__dirname, '../../shadow-index.html')).toString());

  shadowWindow.on('close', (e) => {
    if (!shouldCloseShadowWindow) {
      e.preventDefault();

      return;
    }

    console.log('Shadow window closed');
  });
};

function createMainWindow() {
  console.log('Creating main window');

  mainWindow = new BaseWindow({
    frame: process.platform !== 'win32',
    height: 650,
    minHeight: 400,
    minWidth: 800,
    title: `Beam Studio - ${app.getVersion()}`,
    titleBarStyle: process.platform === 'darwin' ? 'hidden' : 'default',
    trafficLightPosition: { x: 12, y: 14 },
    width: 1300,
  });

  tabManager = new TabManager(mainWindow, { isDebug: DEBUG });
  tabManager.addNewTab();
  setTabManager(tabManager);

  let isCloseConfirmed = false;

  const doClose = () => {
    monitorManager?.killProc();
    backendManager.stop();
    shouldCloseShadowWindow = true;

    try {
      shadowWindow.close();
    } catch (error) {
      console.log(error);
    }
  };

  mainWindow.on('close', async (evt) => {
    console.log('Main window close event', isCloseConfirmed);

    if (isCloseConfirmed) {
      doClose();

      return;
    }

    evt.preventDefault();

    if (tabManager) {
      const res = await tabManager.closeAllTabs();

      if (!res) return;
    }

    isCloseConfirmed = true;
    mainWindow?.close();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;

    if (process.platform === 'darwin' && DEBUG) {
      console.log('Main window closed.');
    } else {
      app.quit();
    }
  });

  menuManager?.on('DEBUG-RELOAD', () => {
    tabManager
      ?.getFocusedView()
      ?.webContents.loadURL(pathToFileURL(path.join(__dirname, '../../index.html')).toString());
  });

  mainWindow.on('new-window-for-tab', () => {
    tabManager?.addNewTab();
  });

  menuManager?.on(MiscEvents.DebugInspect, () => {
    tabManager?.getFocusedView()?.webContents.openDevTools();
  });

  ipcMain.on(MiscEvents.DebugInspect, (evt) => {
    evt.sender.openDevTools();
  });

  networkHelper.registerEvents();

  // see https://github.com/AlexTorresDev/custom-electron-titlebar/blob/2471c5a4df6c9146f7f8d8598e503789cfc1190c/src/main/attach-titlebar-to-window.ts
  mainWindow.on('enter-full-screen', () => {
    tabManager?.sendToAllViews(MiscEvents.WindowFullscreen, true);
  });
  mainWindow.on('leave-full-screen', () => {
    tabManager?.sendToAllViews(MiscEvents.WindowFullscreen, false);
  });

  if (process.platform === 'win32') {
    // original attachTitlebarToWindow for windows
    mainWindow.on('focus', () => {
      tabManager?.sendToFocusedView(MiscEvents.WindowFocus, true);
    });
    mainWindow.on('blur', () => {
      tabManager?.sendToFocusedView(MiscEvents.WindowFocus, false);
    });
    mainWindow.on('maximize', () => {
      tabManager?.sendToAllViews(MiscEvents.WindowMaximize, true);
    });
    mainWindow.on('unmaximize', () => {
      tabManager?.sendToAllViews(MiscEvents.WindowMaximize, false);
    });
  }

  checkMacOsBuild(mainWindow);
}

app.on('open-file', (event, filePath) => {
  console.log('App opened with file:', filePath, event);

  event.preventDefault();

  fileToOpenOnLaunch = filePath;

  if (app.isReady() && tabManager) {
    // Send the file path to the focused renderer process
    tabManager.sendToFocusedView(MiscEvents.OpenFile, filePath);
  }
});

ipcMain.on(MiscEvents.AskForPermission, async (event, key: 'camera' | 'microphone') => {
  if (process.platform === 'darwin') {
    const res = await systemPreferences.askForMediaAccess(key);

    console.log('ask for permission', key, res);
    event.returnValue = res;

    return;
  }

  if (process.platform === 'win32') {
    const res = systemPreferences.getMediaAccessStatus(key);

    console.log('ask for permission', key, res);
    event.returnValue = res !== 'denied';

    return;
  }

  event.returnValue = true;
});

ipcMain.on(MiscEvents.DeviceUpdated, (_event, deviceInfo: IDeviceInfo) => {
  onDeviceUpdated(deviceInfo);
});

ipcMain.on(BackendEvents.CheckBackendStatus, (event) => {
  if (mainWindow) {
    event.sender.send(BackendEvents.NotifyBackendStatus, { backend: globalData.backend, devices: globalData.devices });
  } else {
    console.error('Recv async-status request but main window not exist');
  }
});

ipcMain.on(SvgEvents.SvgUrlToImgUrl, (event, data) => {
  const info = pick(data, ['bb', 'fullColor', 'id', 'imageRatio', 'strokeWidth']);
  const { imgHeight: height, imgWidth: width, svgUrl: url } = data;

  if (shadowWindow) {
    const senderId = event.sender.id;

    shadowWindow.webContents.send(SvgEvents.SvgUrlToImgUrl, { ...info, height, senderId, url, width });
  }
});

ipcMain.on(SvgEvents.SvgUrlToImgUrlDone, (_event, data) => {
  const { id, imageUrl, senderId } = data;

  tabManager?.sendToView(senderId, `${SvgEvents.SvgUrlToImgUrlDone}-${id}`, imageUrl);
});

fontHelper.registerEvents();

let editingStandardInput = false;

ipcMain.on(MiscEvents.SetEditingStandardInput, (_event, arg) => {
  editingStandardInput = arg;
  console.log('Set SET_EDITING_STANDARD_INPUT', arg);
});

ipcMain.on(MiscEvents.FrontendReady, (event) => {
  const webContents = event.sender;
  const webContentsId = webContents.id;

  // Check if we have a pending file for the window that just became ready
  if (webContentsId === tabManager?.welcomeTabId) {
    console.log(`WelcomeTab Id: ${webContentsId} is ready. Sending file: ${fileToOpenOnLaunch}`);

    // Send the file path
    webContents.send(MiscEvents.OpenFile, fileToOpenOnLaunch);

    // Clear the global variable
    fileToOpenOnLaunch = null;
  }
});

console.log('Running Beam Studio on ', os.arch());

app.setAsDefaultProtocolClient('beam-studio');

if (gotTheLock) {
  // win32 deep link handler
  app.on('second-instance', (event, argv) => {
    event.preventDefault();
    console.log(argv);

    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }

      mainWindow.focus();
    }

    const linkUrl = getDeepLinkUrl(argv);

    if (linkUrl) {
      handleDeepLinkUrl(tabManager?.getAllViews() || [], linkUrl);
    }

    const filePath = getFilePathFromArgv(argv);

    if (filePath && tabManager) {
      // Send the file path to the focused renderer process
      tabManager.sendToFocusedView(MiscEvents.OpenFile, filePath);
    }
  });

  // On non-macOS platforms, the initial file path comes from process arguments.
  if (process.platform !== 'darwin') {
    fileToOpenOnLaunch = getFilePathFromArgv(process.argv);
  }
}

// macOS deep link handler
app.on('will-finish-launching', () => {
  app.on('open-url', (_event, openUrl) => {
    handleDeepLinkUrl(tabManager?.getAllViews() || [], openUrl);
  });
});

app.commandLine.appendSwitch('js-flags', `--max-old-space-size=${['ia32', 'x32'].includes(os.arch()) ? 2048 : 4096}`);

const onMenuClick = (data: { id: string; machineName?: string; serial?: string; uuid?: string }) => {
  const info = pick(data, ['id', 'machineName', 'serial', 'uuid']);

  if (!editingStandardInput) {
    tabManager?.sendToFocusedView(MenuEvents.MenuClick, info);

    return;
  }

  if (info.id === 'REDO') {
    tabManager?.getFocusedView()?.webContents.redo();
  }

  if (info.id === 'UNDO') {
    tabManager?.getFocusedView()?.webContents.undo();
  }
};

const init = () => {
  menuManager = new MenuManager();
  menuManager.on(MenuEvents.MenuClick, onMenuClick);
  menuManager.on(MenuEvents.NewAppMenu, () => {
    tabManager?.sendToAllViews(MenuEvents.UpdateMenu);
    tabManager?.sendToFocusedView(MenuEvents.NewAppMenu);
  });

  if (!mainWindow) {
    createShadowWindow();
    createMainWindow();
  } else {
    console.log('MainWindow instance', mainWindow);
    mainWindow.focus();
  }
};

app.whenReady().then(() => {
  init();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {});
