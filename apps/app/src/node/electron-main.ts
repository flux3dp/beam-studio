// eslint-disable-next-line import/order
import { app, BaseWindow, BrowserWindow, ipcMain, systemPreferences } from 'electron';

app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.commandLine.appendSwitch('--no-sandbox');
// app.allowRendererProcessReuse = false;

import fs from 'fs';
import os from 'os';
import path from 'path';
import { pathToFileURL } from 'url';

import * as electronRemote from '@electron/remote/main';
import { captureMessage, init as SentryInit } from '@sentry/electron/main';
import { setupTitlebar } from 'custom-electron-titlebar/main';

import type { IDeviceInfo } from '@core/interfaces/IDevice';

import BackendManager from './backend-manager';
import bootstrap from './bootstrap';
import { getDeepLinkUrl, handleDeepLinkUrl } from './deep-link-helper';
import fontHelper from './font-helper';
import { setTabManager } from './helpers/tabHelper';
import events from './ipc-events';
import MenuManager from './menu-manager';
import MonitorManager from './monitor-manager';
import networkHelper from './network-helper';
import TabManager from './tabManager';
import { UpdateManager } from './updateManager';

electronRemote.initialize();

SentryInit({ dsn: 'https://bbd96134db9147658677dcf024ae5a83@o28957.ingest.sentry.io/5617300' });
captureMessage('User Census', {
  level: 'info',
  tags: {
    census: 'v1',
    from: 'backend',
  },
});

setupTitlebar();

let mainWindow: BaseWindow | null;
let menuManager: MenuManager | null;
let tabManager: null | TabManager;

const globalData: {
  backend: {
    alive: boolean;
    logfile?: string;
    port?: number;
  };
  devices: { [key: string]: IDeviceInfo };
} = {
  backend: {
    alive: false,
  },
  devices: {},
};

let logger: { write: (data: string) => void };

function createLogFile() {
  const storageDir = app.getPath('userData');

  function chkDir(target: string) {
    if (fs.existsSync(target)) {
      return;
    }

    chkDir(path.dirname(target));
    fs.mkdirSync(target);
  }
  chkDir(storageDir);

  const filename = path.join(app.getPath('userData'), 'backend.log');

  globalData.backend.logfile = filename;

  // global.backend.logfile = filename;
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

let DEBUG = false;

logger = process.stderr.isTTY ? process.stderr : createLogFile();

if (process.argv.indexOf('--debug-mode') > 0) {
  DEBUG = true;
  console.log('DEBUG Mode');
  // require('electron-reload')(__dirname);
}

// Solve transparent window issue
if (process.platform === 'linux') {
  app.disableHardwareAcceleration();
}

function onGhostUp(data: { port: number }) {
  globalData.backend.alive = true;
  globalData.backend.port = data.port;
  tabManager?.sendToAllViews(events.BACKEND_UP, globalData.backend);
}

function onGhostDown() {
  globalData.backend.alive = false;
  globalData.backend.port = undefined;
}

function onDeviceUpdated(deviceInfo: IDeviceInfo) {
  const { alive, serial, source, uuid } = deviceInfo;
  const deviceID = `${source}:${uuid}`;

  tabManager?.sendToFocusedView('device-status', deviceInfo);

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
        tabManager?.sendToAllViews('UPDATE_MENU');
      }
    }
  } else if (globalData.devices[deviceID]) {
    if (menuManager) {
      menuManager.removeDevice(uuid, globalData.devices[deviceID]);
      tabManager?.sendToAllViews('UPDATE_MENU');
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
  server: process.argv.indexOf('--server') > 0,
  trace_pid: process.pid,
});

backendManager.start();

// Run monitorexe api
let monitorManager: MonitorManager | null = null;

if (process.argv.includes('--monitor')) {
  console.log('Starting Monitor');
  monitorManager = new MonitorManager({
    location: process.env.BACKEND || '',
  });
  // kill process first, in case last time shut down
  monitorManager.killProcSync();
  monitorManager.startProc();
}

let shadowWindow: BrowserWindow;
let shouldCloseShadowWindow = false;

const loadShadowWindow = () => {
  shadowWindow?.loadURL(pathToFileURL(path.join(__dirname, '../../shadow-index.html')).toString());
};

const createShadowWindow = () => {
  if (!shadowWindow) {
    shadowWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        contextIsolation: false,
        nodeIntegration: true,
      },
    });
    // shadowWindow.webContents.openDevTools();
    loadShadowWindow();

    shadowWindow.on('close', (e) => {
      if (!shouldCloseShadowWindow) {
        e.preventDefault();
      } else {
        console.log('Shadow window closed');
      }
    });
  }
};

function createWindow() {
  // Create the browser window.
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

    if (!isCloseConfirmed) {
      evt.preventDefault();

      if (tabManager) {
        const res = await tabManager.closeAllTabs();

        if (!res) {
          return;
        }
      }

      isCloseConfirmed = true;
      mainWindow?.close();
    } else {
      doClose();
    }
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

  menuManager?.on('DEBUG-INSPECT', () => {
    tabManager?.getFocusedView()?.webContents.openDevTools();
  });
  ipcMain.on('DEBUG-INSPECT', (evt) => {
    evt.sender.openDevTools();
  });
  networkHelper.registerEvents();

  // see https://github.com/AlexTorresDev/custom-electron-titlebar/blob/2471c5a4df6c9146f7f8d8598e503789cfc1190c/src/main/attach-titlebar-to-window.ts
  mainWindow.on('enter-full-screen', () => {
    tabManager?.sendToAllViews('window-fullscreen', true);
  });
  mainWindow.on('leave-full-screen', () => {
    tabManager?.sendToAllViews('window-fullscreen', false);
  });

  if (process.platform === 'win32') {
    // original attachTitlebarToWindow for windows
    mainWindow.on('focus', () => {
      tabManager?.sendToFocusedView('window-focus', true);
    });
    mainWindow.on('blur', () => {
      tabManager?.sendToFocusedView('window-focus', false);
    });
    mainWindow.on('maximize', () => {
      tabManager?.sendToAllViews('window-maximize', true);
    });
    mainWindow.on('unmaximize', () => {
      tabManager?.sendToAllViews('window-maximize', false);
    });
  }
}

let didGetOpenFile = false;
let initOpenPath = '';

app.on('open-file', (event, filePath) => {
  initOpenPath = filePath;

  if (tabManager) {
    tabManager.sendToView(tabManager.welcomeTabId, 'open-file', filePath);
  }
});

ipcMain.on('GET_OPEN_FILE', (evt) => {
  if (!didGetOpenFile) {
    didGetOpenFile = true;

    if (process.platform === 'win32' && process.argv.length > 1) {
      [, initOpenPath] = process.argv;
    }

    if (initOpenPath && fs.existsSync(initOpenPath)) {
      evt.returnValue = initOpenPath;
    }
  }

  evt.returnValue = null;
});

ipcMain.on('ASK_FOR_PERMISSION', async (event, key: 'camera' | 'microphone') => {
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

ipcMain.on('DEVICE_UPDATED', (event, deviceInfo: IDeviceInfo) => {
  onDeviceUpdated(deviceInfo);
});

ipcMain.on(events.CHECK_BACKEND_STATUS, (evt) => {
  if (mainWindow) {
    evt.sender.send(events.NOTIFY_BACKEND_STATUS, {
      backend: globalData.backend,
      devices: globalData.devices,
    });
  } else {
    console.error('Recv async-status request but main window not exist');
  }
});

ipcMain.on(events.SVG_URL_TO_IMG_URL, (e, data) => {
  const { bb, fullColor, id, imageRatio, imgHeight: height, imgWidth: width, strokeWidth, svgUrl } = data;

  if (shadowWindow) {
    const senderId = e.sender.id;

    shadowWindow.webContents.send(events.SVG_URL_TO_IMG_URL, {
      bb,
      fullColor,
      height,
      id,
      imageRatio,
      senderId,
      strokeWidth,
      url: svgUrl,
      width,
    });
  }
});

ipcMain.on(events.SVG_URL_TO_IMG_URL_DONE, (e, data) => {
  const { id, imageUrl, senderId } = data;

  tabManager?.sendToView(senderId, `${events.SVG_URL_TO_IMG_URL_DONE}_${id}`, imageUrl);
});

fontHelper.registerEvents();

let editingStandardInput = false;

ipcMain.on(events.SET_EDITING_STANDARD_INPUT, (event, arg) => {
  editingStandardInput = arg;
  console.log('Set SET_EDITING_STANDARD_INPUT', arg);
});

console.log('Running Beam Studio on ', os.arch());

app.setAsDefaultProtocolClient('beam-studio');

const hasLock = app.requestSingleInstanceLock();

console.log('hasLock', hasLock);

if (process.platform === 'win32' && !hasLock && getDeepLinkUrl(process.argv)) {
  // if primary instance exists and open from deep link, return
  app.quit();
}

// win32 deep link handler
app.on('second-instance', (e, argv) => {
  e.preventDefault();
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
});

// macOS deep link handler
app.on('will-finish-launching', () => {
  app.on('open-url', (event, openUrl) => {
    handleDeepLinkUrl(tabManager?.getAllViews() || [], openUrl);
  });
});

if (os.arch() === 'ia32' || os.arch() === 'x32') {
  app.commandLine.appendSwitch('js-flags', '--max-old-space-size=2048');
} else {
  app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096');
}

const onMenuClick = (data: { id: string; machineName?: string; serial?: string; uuid?: string }) => {
  data = {
    id: data.id,
    machineName: data.machineName,
    serial: data.serial,
    uuid: data.uuid,
  };

  if (editingStandardInput) {
    if (data.id === 'REDO') {
      tabManager?.getFocusedView()?.webContents.redo();
    }

    if (data.id === 'UNDO') {
      tabManager?.getFocusedView()?.webContents.undo();
    }
  } else {
    tabManager?.sendToFocusedView(events.MENU_CLICK, data);
  }
};

const init = () => {
  menuManager = new MenuManager();
  menuManager.on(events.MENU_CLICK, onMenuClick);
  menuManager.on('NEW_APP_MENU', () => {
    tabManager?.sendToAllViews('UPDATE_MENU');
    tabManager?.sendToFocusedView('NEW_APP_MENU');
  });

  if (!mainWindow) {
    createShadowWindow();
    createWindow();
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
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {});
