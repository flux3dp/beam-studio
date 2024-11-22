/* eslint-disable no-param-reassign */
/* eslint-disable import/first */
// eslint-disable-next-line import/no-extraneous-dependencies
import {
  app,
  BaseWindow,
  BrowserWindow,
  ipcMain,
  IpcMainEvent,
  systemPreferences,
  WebContents,
  WebContentsView,
} from 'electron';

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

let focusedId = 0;
const tabViews: { [id: number]: WebContentsView } = {};
let mainWindow: BaseWindow | null;
let menuManager: MenuManager | null;

const sendToAllViews = (event: string, data?: any) => {
  const allViews = Object.values(tabViews);
  allViews.forEach((view) => view.webContents.send(event, data));
};
const sendToFocusedView = (event: string, data?: any) => {
  if (focusedId && tabViews[focusedId]) {
    tabViews[focusedId].webContents.send(event, data);
  }
};

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
  sendToAllViews(events.BACKEND_UP, globalData.backend);
}

function onGhostDown() {
  globalData.backend.alive = false;
  globalData.backend.port = undefined;
}

function onDeviceUpdated(deviceInfo: DeviceInfo) {
  const { alive, source, uuid, serial } = deviceInfo;
  const deviceID = `${source}:${uuid}`;
  sendToFocusedView('device-status', deviceInfo);

  if (alive || source !== 'lan') {
    if (menuManager) {
      if (globalData.devices[deviceID] && globalData.devices[deviceID].serial !== serial) {
        menuManager.removeDevice(uuid, globalData.devices[deviceID]);
      }
      const didUpdated = menuManager.updateDevice(uuid, deviceInfo);
      if (didUpdated) sendToFocusedView('UPDATE_MENU');
    }
  } else if (globalData.devices[deviceID]) {
    if (menuManager) {
      menuManager.removeDevice(uuid, globalData.devices[deviceID]);
      sendToFocusedView('UPDATE_MENU');
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
  shadowWindow?.loadURL(
    url.format({
      pathname: path.join(__dirname, '../../shadow-index.html'),
      protocol: 'file:',
    })
  );
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

const initStore = (webContents: WebContents) => {
  const store = new Store();

  if (!store.get('poke-ip-addr')) store.set('poke-ip-addr', '192.168.1.1');

  if (!store.get('customizedLaserConfigs')) {
    webContents.executeJavaScript('({...localStorage});', true).then((localStorage) => {
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
};

const focusTab = (id: number) => {
  if (tabViews[id]) {
    focusedId = id;
    Object.values(tabViews).forEach((view) => view.setVisible(view.webContents.id === id));
    tabViews[id].webContents.focus();
    tabViews[id].webContents.send('TAB_FOCUSED');
  }
};

const createTab = () => {
  const tabView = new WebContentsView({
    webPreferences: {
      preload: path.join(__dirname, '../../../src/node', 'main-window-entry.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  mainWindow?.contentView.addChildView(tabView);
  const { webContents } = tabView;
  electronRemote.enable(webContents);
  webContents.setWindowOpenHandler(({ url: openUrl }) => {
    // Prevent the new window from early input files
    if (openUrl.startsWith('file://')) return { action: 'deny' };
    return { action: 'allow' };
  });
  initStore(webContents);
  webContents.loadURL(
    url.format({
      pathname: path.join(__dirname, '../../index.html'),
      protocol: 'file:',
      slashes: true,
    })
  );
  const { id } = webContents;
  if (!process.argv.includes('--test') && (process.defaultApp || DEBUG)) webContents.openDevTools();
  tabViews[id] = tabView;
  console.log(tabViews);
  const bound = mainWindow?.getContentBounds();
  if (bound) tabView.setBounds({ ...bound, x: 0, y: 0 });
  focusedId = id;
  focusTab(id);
};

const closeWebContentsView = async (view: WebContentsView): Promise<boolean> =>
  new Promise<boolean>((resolve) => {
    const { id } = view.webContents;
    const closeHandler = () => {
      mainWindow?.contentView.removeChildView(view);
      view.webContents.close();
      delete tabViews[id];
      resolve(true);
    };
    let eventReceivced = false;
    const saveDialogPoppedHandler = (evt: IpcMainEvent) => {
      if (evt.sender === view.webContents) {
        eventReceivced = true;
        ipcMain.removeListener('SAVE_DIALOG_POPPED', saveDialogPoppedHandler);
        if (focusedId !== id) focusTab(id);
      }
    };
    const closeReplyHander = (event: IpcMainEvent, reply: boolean) => {
      if (event.sender === view.webContents) {
        eventReceivced = true;
        if (reply) closeHandler();
        else resolve(false);
        ipcMain.removeListener('CLOSE_REPLY', closeReplyHander);
        ipcMain.removeListener('SAVE_DIALOG_POPPED', saveDialogPoppedHandler);
      }
    };
    ipcMain.on('CLOSE_REPLY', closeReplyHander);
    ipcMain.on('SAVE_DIALOG_POPPED', saveDialogPoppedHandler);
    view.webContents.send('WINDOW_CLOSE');
    // if no event received in 10 seconds
    // something may goes wrong in frontend, close the view
    setTimeout(() => {
      if (!eventReceivced) closeHandler();
    }, 10000);
  });

const closeTab = async (id: number): Promise<boolean> => {
  if (tabViews[id] && Object.keys(tabViews).length > 1) {
    const res = await closeWebContentsView(tabViews[id]);
    if (res && focusedId === id) {
      const ids = Object.keys(tabViews);
      if (ids.length) {
        focusedId = parseInt(ids[0], 10);
        focusTab(focusedId);
      }
    }
    return res;
  }
  return false;
};

ipcMain.on('focus-tab', (e, id) => {
  focusTab(id);
});

ipcMain.on('create-tab', () => {
  createTab();
});

ipcMain.on('close-tab', (e, id) => {
  closeTab(id);
});

function createWindow() {
  // Create the browser window.
  console.log('Creating main window');
  mainWindow = new BaseWindow({
    width: 1300,
    height: 650,
    minWidth: 800,
    minHeight: 400,
    titleBarStyle: process.platform === 'darwin' ? 'hidden' : 'default',
    frame: process.platform !== 'win32',
    title: `Beam Studio - ${app.getVersion()}`,
    trafficLightPosition: { x: 12, y: 14 },
  });
  createTab();

  let isCloseConfirmed = false;
  let isFrontEndReady = false;
  ipcMain.on(events.FRONTEND_READY, () => {
    isFrontEndReady = true;
  });

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
    console.log('Main window close event', isFrontEndReady, isCloseConfirmed);
    if (isFrontEndReady && !isCloseConfirmed) {
      evt.preventDefault();
      const allTabViews = Object.values(tabViews);
      for (let i = 0; i < allTabViews.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const res = await closeWebContentsView(allTabViews[i]);
        if (!res) return;
      }
      isCloseConfirmed = true;
      mainWindow?.close();
    } else {
      doClose();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;

    if (process.platform === 'darwin' && DEBUG) console.log('Main window closed.');
    else app.quit();
  });

  mainWindow.on('resized', () => {
    const bound = mainWindow?.getContentBounds();
    if (bound) {
      bound.x = 0;
      bound.y = 0;
      Object.values(tabViews).forEach((view) => view.setBounds(bound));
    }
  });

  menuManager?.on('DEBUG-RELOAD', () => {
    console.log('DEBUG-RELOAD', tabViews[focusedId]);
    tabViews[focusedId]?.webContents.loadURL(
      url.format({
        pathname: path.join(__dirname, '../../index.html'),
        protocol: 'file:',
        slashes: true,
      })
    );
    // loadShadowWindow();
  });

  mainWindow.on('new-window-for-tab', () => {
    createTab();
  });

  menuManager?.on('DEBUG-INSPECT', () => {
    console.log('DEBUG-INSPECT', tabViews[focusedId]);
    tabViews[focusedId]?.webContents.openDevTools();
  });
  ipcMain.on('DEBUG-INSPECT', (evt) => {
    evt.sender.openDevTools();
  });

  // TODO: handle this
  updateManager.setWebContents(tabViews[focusedId]?.webContents);
  networkHelper.registerEvents();
  // see https://github.com/AlexTorresDev/custom-electron-titlebar/blob/2471c5a4df6c9146f7f8d8598e503789cfc1190c/src/main/attach-titlebar-to-window.ts
  // attachTitlebarToWindow(mainWindow);
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
    const senderId = e.sender.id;
    shadowWindow.webContents.send(events.SVG_URL_TO_IMG_URL, {
      url: svgUrl,
      width,
      height,
      bb,
      imageRatio,
      id,
      strokeWidth,
      fullColor,
      senderId,
    });
  }
});

ipcMain.on(events.SVG_URL_TO_IMG_URL_DONE, (e, data) => {
  const { imageUrl, id, senderId } = data;
  tabViews[senderId].webContents.send(`${events.SVG_URL_TO_IMG_URL_DONE}_${id}`, imageUrl);
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
  if (linkUrl) handleDeepLinkUrl(Object.values(tabViews), linkUrl);
});

// macOS deep link handler
app.on('will-finish-launching', () => {
  app.on('open-url', (event, openUrl) => {
    handleDeepLinkUrl(Object.values(tabViews), openUrl);
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
  if (editingStandardInput) {
    if (data.id === 'REDO') {
      tabViews[focusedId].webContents.redo();
    }
    if (data.id === 'UNDO') {
      tabViews[focusedId].webContents.undo();
    }
  } else {
    console.log('Send', data);
    sendToFocusedView(events.MENU_CLICK, data);
  }
};

const init = () => {
  menuManager = new MenuManager();
  menuManager.on(events.MENU_CLICK, onMenuClick);
  menuManager.on('NEW_APP_MENU', () => {
    // mainWindow?.webContents.send('NEW_APP_MENU');
    sendToAllViews('NEW_APP_MENU');
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
