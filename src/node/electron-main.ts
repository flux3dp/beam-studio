/* eslint-disable no-param-reassign */
/* eslint-disable import/first */
// eslint-disable-next-line import/no-extraneous-dependencies
import { app, BrowserWindow, ipcMain, systemPreferences } from 'electron';

app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.commandLine.appendSwitch('--no-sandbox');
// app.allowRendererProcessReuse = false;

import fs from 'fs';
import os from 'os';
import path from 'path';
import url from 'url';

import Sentry from '@sentry/electron';
import Store from 'electron-store';
import * as electronRemote from '@electron/remote/main';
import { attachTitlebarToWindow, setupTitlebar } from 'custom-electron-titlebar/main';

import DeviceInfo from 'interfaces/DeviceInfo';

import BackendManager from './backend-manager';
import bootstrap from './bootstrap';
import events from './ipc-events';
import fontHelper from './font-helper';
import MenuManager from './menu-manager';
import MonitorManager from './monitor-manager';
import networkHelper from './network-helper';
import UpdateManager from './update-manager';
import { getDeeplinkUrl, handleDeepLinkUrl } from './deep-link-helper';

electronRemote.initialize();
Sentry.init({ dsn: 'https://bbd96134db9147658677dcf024ae5a83@o28957.ingest.sentry.io/5617300' });
Sentry.captureMessage('User Census', {
  level: 'info',
  tags: {
    census: 'v1',
    from: 'backend',
  },
});
setupTitlebar();

let mainWindow: BrowserWindow | null;
let menuManager: MenuManager | null;

const globalData: {
  backend: {
    alive: boolean;
    port?: number;
    logfile?: string;
  };
  devices: { [key: string]: DeviceInfo };
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
  mainWindow?.webContents?.send(events.BACKEND_UP, globalData.backend);
}

function onGhostDown() {
  globalData.backend.alive = false;
  globalData.backend.port = undefined;
}

function onDeviceUpdated(deviceInfo: DeviceInfo) {
  const { alive, source, uuid, serial } = deviceInfo;
  const deviceID = `${source}:${uuid}`;

  if (alive || source !== 'lan') {
    if (menuManager) {
      if (globalData.devices[deviceID] && globalData.devices[deviceID].serial !== serial) {
        menuManager.removeDevice(uuid, globalData.devices[deviceID]);
      }
      const didUpdated = menuManager.updateDevice(uuid, deviceInfo);
      if (didUpdated && mainWindow) mainWindow.webContents.send('UPDATE_MENU');
    }
  } else if (globalData.devices[deviceID]) {
    if (menuManager) {
      menuManager.removeDevice(uuid, globalData.devices[deviceID]);
      if (mainWindow) mainWindow.webContents.send('UPDATE_MENU');
    }
    delete globalData.devices[deviceID];
  }
  globalData.devices[deviceID] = deviceInfo;
}

bootstrap();

const updateManager = new UpdateManager();
const backendManager = new BackendManager({
  location: process.env.BACKEND,
  trace_pid: process.pid,
  server: process.argv.indexOf('--server') > 0,
  on_ready: onGhostUp,
  on_stderr: (data) => logger.write(`${data}`),
  on_stopped: onGhostDown,
  debug: DEBUG,
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
  if (shadowWindow) {
    shadowWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, '../../shadow-index.html'),
        protocol: 'file:',
      })
    );
  }
};

const createShadowWindow = () => {
  if (!shadowWindow) {
    shadowWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
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
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 650,
    minWidth: 800,
    minHeight: 400,
    titleBarStyle: process.platform === 'darwin' ? 'hidden' : 'default',
    frame: process.platform !== 'win32',
    title: `Beam Studio - ${app.getVersion()}`,
    webPreferences: {
      preload: path.join(__dirname, '../../../src/node', 'main-window-entry.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
    trafficLightPosition: { x: 12, y: 14 },
    // vibrancy: 'light',
  });

  electronRemote.enable(mainWindow.webContents);

  mainWindow.webContents.setWindowOpenHandler(({ url: openUrl }) => {
    // Prevent the new window from early input files
    if (openUrl.startsWith('file://')) return { action: 'deny' };
    return { action: 'allow' };
  });

  const store = new Store();

  if (!store.get('poke-ip-addr')) {
    store.set('poke-ip-addr', '192.168.1.1');
  }

  if (!store.get('customizedLaserConfigs')) {
    mainWindow.webContents.executeJavaScript('({...localStorage});', true).then((localStorage) => {
      const keysNeedParse = [
        'auto_check_update',
        'auto_connect',
        'guessing_poke',
        'loop_compensation',
        'notification',
        'printer-is-ready',
      ];
      // eslint-disable-next-line no-restricted-syntax
      for (const key in localStorage) {
        if (keysNeedParse.includes(key)) {
          try {
            localStorage[key] = JSON.parse(localStorage[key]);
            console.log(key, localStorage[key]);
          } catch (e) {
            console.log(key, e);
            // Error when parsing
          }
        }
      }
      store.set(localStorage);
    });
  }

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, '../../index.html'),
      protocol: 'file:',
      slashes: true,
    })
  );

  let isCloseConfirmed = false;
  let isFrontEndReady = false;
  ipcMain.on(events.FRONTEND_READY, () => {
    isFrontEndReady = true;
  });

  mainWindow.on('close', (evt) => {
    if (isFrontEndReady && !isCloseConfirmed) {
      evt.preventDefault();
      mainWindow?.webContents.send('WINDOW_CLOSE');
      // if save dialog does not pop in 10 seconds
      // something may goes wrong in frontend, close the app
      let isSaveDialogPopped = false;
      ipcMain.once('SAVE_DIALOG_POPPED', () => {
        isSaveDialogPopped = true;
      });
      const closeBeamStudio = () => {
        isCloseConfirmed = true;
        if (monitorManager) {
          monitorManager.killProc();
        }
        backendManager.stop();
        mainWindow?.close();
        shouldCloseShadowWindow = true;
        try {
          shadowWindow.close();
        } catch (error) {
          console.log(error);
        }
      };

      setTimeout(() => {
        if (!isSaveDialogPopped) closeBeamStudio();
      }, 10000);
      ipcMain.once('CLOSE_REPLY', (event, reply) => {
        if (reply) closeBeamStudio();
      });
    } else {
      if (monitorManager) monitorManager.killProc();
      backendManager.stop();
      shouldCloseShadowWindow = true;
      try {
        shadowWindow.close();
      } catch (e) {
        console.log(e);
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;

    if (process.platform === 'darwin' && DEBUG) console.log('Main window closed.');
    else app.quit();
  });

  mainWindow.on('page-title-updated', (event) => {
    event.preventDefault();
  });

  menuManager?.on('DEBUG-RELOAD', () => {
    mainWindow?.loadURL(
      url.format({
        pathname: path.join(__dirname, '../../index.html'),
        protocol: 'file:',
        slashes: true,
      })
    );
    loadShadowWindow();
  });

  menuManager?.on('DEBUG-INSPECT', () => {
    mainWindow?.webContents.openDevTools();
  });
  ipcMain.on('DEBUG-INSPECT', () => {
    mainWindow?.webContents.openDevTools();
  });
  if (!process.argv.includes('--test') && (process.defaultApp || DEBUG)) {
    mainWindow.webContents.openDevTools();
  }

  updateManager.setMainWindow(mainWindow);
  networkHelper.registerEvents(mainWindow);
  attachTitlebarToWindow(mainWindow);
}

let didGetOpenFile = false;
let initOpenPath = '';

app.on('open-file', (event, filePath) => {
  initOpenPath = filePath;
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

ipcMain.on('DEVICE_UPDATED', (event, deviceInfo: DeviceInfo) => {
  onDeviceUpdated(deviceInfo);
});

ipcMain.on(events.CHECK_BACKEND_STATUS, () => {
  if (mainWindow) {
    mainWindow.webContents.send(events.NOTIFY_BACKEND_STATUS, {
      backend: globalData.backend,
      devices: globalData.devices,
    });
  } else {
    console.error('Recv async-status request but main window not exist');
  }
});

ipcMain.on(events.SVG_URL_TO_IMG_URL, (e, data) => {
  const {
    svgUrl,
    imgWidth: width,
    imgHeight: height,
    bb,
    imageRatio,
    id,
    strokeWidth,
    fullColor,
  } = data;
  if (shadowWindow) {
    shadowWindow.webContents.send(events.SVG_URL_TO_IMG_URL, {
      url: svgUrl,
      width,
      height,
      bb,
      imageRatio,
      id,
      strokeWidth,
      fullColor,
    });
  }
});

ipcMain.on(events.SVG_URL_TO_IMG_URL_DONE, (e, data) => {
  const { imageUrl, id } = data;
  mainWindow?.webContents.send(`${events.SVG_URL_TO_IMG_URL_DONE}_${id}`, imageUrl);
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

if (process.platform === 'win32' && !hasLock && getDeeplinkUrl(process.argv)) {
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
  const linkUrl = getDeeplinkUrl(argv);
  if (linkUrl) handleDeepLinkUrl(mainWindow, linkUrl);
});

// macOS deep link handler
app.on('will-finish-launching', () => {
  app.on('open-url', (event, openUrl) => {
    handleDeepLinkUrl(mainWindow, openUrl);
  });
});

if (os.arch() === 'ia32' || os.arch() === 'x32') {
  app.commandLine.appendSwitch('js-flags', '--max-old-space-size=2048');
} else {
  app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096');
}

const onMenuClick = (data: {
  id: string;
  serial?: string;
  uuid?: string;
  machineName?: string;
}) => {
  data = {
    id: data.id,
    serial: data.serial,
    uuid: data.uuid,
    machineName: data.machineName,
  };
  if (mainWindow) {
    if (editingStandardInput) {
      if (data.id === 'REDO') {
        mainWindow.webContents.redo();
      }
      if (data.id === 'UNDO') {
        mainWindow.webContents.undo();
      }
    } else {
      console.log('Send', data);
      mainWindow.webContents.send(events.MENU_CLICK, data);
    }
  } else {
    console.log('Menu event triggered but window does not exist.');
  }
};

const init = () => {
  menuManager = new MenuManager();
  menuManager.on(events.MENU_CLICK, onMenuClick);
  menuManager.on('NEW_APP_MENU', () => {
    mainWindow?.webContents.send('NEW_APP_MENU');
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
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {});
