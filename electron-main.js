const { app, ipcMain, BrowserWindow, dialog } = require('electron');
app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.allowRendererProcessReuse = false;

const path = require('path');
const url = require('url');
const fs = require('fs');
const os = require('os');
const electronRemote = require('@electron/remote/main');
const Store = require('electron-store');
const Sentry = require('@sentry/electron');
const { setupTitlebar, attachTitlebarToWindow } = require('custom-electron-titlebar/main');

const BackendManager = require('./src/node/backend-manager.js');
const fontHelper = require('./src/node/font-helper');
const MonitorManager = require('./src/node/monitor-manager.js');
const MenuManager = require('./src/node/menu-manager.js');
const networkHelper = require('./src/node/network-helper');
const UpdateManager = require('./src/node/update-manager.js');
const events = require('./src/node/ipc-events');
const { getDeeplinkUrl, handleDeepLinkUrl } = require('./src/node/deep-link-helper');

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

let mainWindow;
let menuManager;

global.backend = { alive: false };
global.devices = {};

let logger = null;
function createLogFile() {
  var storageDir = app.getPath('userData');

  function chkDir(target) {
    if (fs.existsSync(target)) {
      return;
    } else {
      chkDir(path.dirname(target));
      fs.mkdirSync(target);
    }

  }
  chkDir(storageDir);

  let filename = path.join(app.getPath('userData'), 'backend.log');
  global.backend.logfile = filename;
  let writeStream = fs.createWriteStream(filename, { flags: 'w' });
  logger = writeStream;
  console._stdout = writeStream;
  console._stderr = writeStream;
  const setCloseEventHandler = () => {
    writeStream.on('close', () => {
      writeStream = fs.createWriteStream(filename, { flags: 'a' });
      logger = writeStream;
      console._stdout = writeStream;
      console._stderr = writeStream;
      setCloseEventHandler();
    });
  }
  setCloseEventHandler();
  return writeStream;
}

var DEBUG = false;
logger = process.stderr.isTTY ? process.stderr : createLogFile();

if (process.argv.indexOf('--debug') > 0) {
  DEBUG = true;
  console.log('DEBUG Mode');
  // require('electron-reload')(__dirname);
}

// Solve transparent window issue
if (process.platform === 'linux') {
  app.disableHardwareAcceleration();
}

function onGhostUp(data) {
  global.backend.alive = true;
  global.backend.port = data.port;
  if (mainWindow) {
    mainWindow.webContents.send(events.BACKEND_UP, global.backend);
  }
}

function onGhostDown() {
  global.backend.alive = false;
  global.backend.port = undefined;
  if (mainWindow) {
    //mainWindow.webContents.send(events.BACKEND_DOWN);
  }
}

function onDeviceUpdated(deviceInfo) {
  let deviceID = `${deviceInfo.source}:${deviceInfo.uuid}`;
  if (mainWindow) {
    mainWindow.webContents.send('device-status', deviceInfo);
  }

  if (deviceInfo.alive) {
    if (menuManager) {
      const didUpdated = menuManager.updateDevice(deviceInfo.uuid, deviceInfo);
      if (didUpdated && mainWindow) mainWindow.webContents.send('UPDATE_MENU');
    }
  } else {
    if (global.devices[deviceID]) {
      if (menuManager) {
        menuManager.removeDevice(deviceInfo.uuid, global.devices[deviceID]);
        if (mainWindow) mainWindow.webContents.send('UPDATE_MENU');
      }
      delete global.devices[deviceID];
    }
  }

  global.devices[deviceID] = deviceInfo;
}

require('./src/node/bootstrap.js');

const updateManager = new UpdateManager();
const backendManager = new BackendManager({
  location: process.env.BACKEND,
  trace_pid: process.pid,
  server: process.argv.indexOf('--server') > 0,
  on_ready: onGhostUp,
  on_device_updated: onDeviceUpdated,
  on_stderr: (data) => logger.write(`${data}`),
  on_stopped: onGhostDown,
  debug: DEBUG,
  c: console,
});
backendManager.start();

//Run monitorexe api
monitorManager = null;
if (process.argv.includes('--monitor')) {
  console.log('Starting Monitor');
  monitorManager = new MonitorManager({
    location: process.env.BACKEND
  });
  //kill process first, in case last time shut down
  monitorManager.killProcSync();
  monitorManager.startProc();
}

let shadowWindow;
let shouldCloseShadowWindow = false;

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

    shadowWindow.on('close', function (e) {
      if (!shouldCloseShadowWindow) {
        e.preventDefault();
      } else {
        console.log('Shadow window closed');
      }
    });
  }
};

const loadShadowWindow = () => {
  if (shadowWindow) {
    shadowWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'public/shadow-index.html'),
      protocol: 'file:'
    }));
  }
}

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
      preload: path.join(__dirname, 'src/node', 'main-window-entry.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
    trafficLightPosition: { x: 12, y: 14 },
    vibrancy: 'light'
  });

  electronRemote.enable(mainWindow.webContents);

  const store = new Store();

  if (!store.get('poke-ip-addr')) {
    store.set('poke-ip-addr', '192.168.1.1');
  }

  if (!store.get('customizedLaserConfigs')) {
    mainWindow.webContents
      .executeJavaScript('({...localStorage});', true)
      .then(localStorage => {
        const keysNeedParse = ['auto_check_update', 'auto_connect', 'guessing_poke', 'loop_compensation', 'notification', 'printer-is-ready'];
        for (let key in localStorage) {
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

  // mainWindow.maximize();

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'public/index.html'),
    protocol: 'file:',
    slashes: true,
  }));

  let isCloseConfirmed = false;
  let isFrontEndReady = false;
  ipcMain.on(events.FRONTEND_READY, () => {
    isFrontEndReady = true;
  });

  mainWindow.on('close', function (e) {
    if (isFrontEndReady && !isCloseConfirmed) {
      e.preventDefault();
      mainWindow.webContents.send('WINDOW_CLOSE');
      // if save dialog does not pop in 10 seconds, something may goes wrong in frontend, close the app
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
        mainWindow.close();
        shouldCloseShadowWindow = true;
        try {
          shadowWindow.close();
        } catch (e) {
          console.log(e);
        }
      }

      setTimeout(() => {
        if (!isSaveDialogPopped) {
          closeBeamStudio();
        }
      }, 10000);
      ipcMain.once('CLOSE_REPLY', (event, reply) => {
        if (reply) {
          closeBeamStudio();
        }
      });
    } else {
      if (monitorManager) {
        monitorManager.killProc();
      }
      backendManager.stop();
      shouldCloseShadowWindow = true;
      try {
        shadowWindow.close();
      } catch (e) {
        console.log(e);
      }
    }
  });

  mainWindow.on('closed', function () {
    mainWindow = null;

    if (process.platform === 'darwin' && DEBUG) {
      console.log('Main window closed.');
    } else {
      app.quit();
    }
  });

  mainWindow.on('page-title-updated', function (event) {
    event.preventDefault();
  });

  menuManager.on('DEBUG-RELOAD', () => {
    mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'public/index.html'),
      protocol: 'file:',
      slashes: true,
    }));
    loadShadowWindow();
  });

  menuManager.on('DEBUG-INSPECT', () => {
    mainWindow.webContents.openDevTools();
  });
  ipcMain.on('DEBUG-INSPECT', () => {
    mainWindow.webContents.openDevTools();
  });
  if (!process.argv.includes('--test') && (process.defaultApp || DEBUG)) {
    mainWindow.webContents.openDevTools();
  }

  updateManager.setMainWindow(mainWindow);
  networkHelper.registerEvents(mainWindow);
  attachTitlebarToWindow(mainWindow);
}

let did_get_open_file = false;
let init_open_path = '';

app.on('open-file', (event, path) => {
  init_open_path = path
});

ipcMain.on('GET_OPEN_FILE', (evt) => {
  if (!did_get_open_file) {
    did_get_open_file = true;
    if (process.platform === 'win32' && process.argv.length > 1) {
      init_open_path = process.argv[1];
    }
    if (init_open_path && fs.existsSync(init_open_path)) {
      evt.returnValue = init_open_path;
    }
  }
  evt.returnValue = null;
});

ipcMain.on(events.CHECK_BACKEND_STATUS, () => {
  if (mainWindow) {
    mainWindow.send(events.NOTIFY_BACKEND_STATUS, {
      backend: global.backend,
      devices: global.devices
    });
  } else {
    console.error('Recv async-status request but main window not exist');
  }
});

ipcMain.on(events.SVG_URL_TO_IMG_URL, (e, data) => {
  const {
    svgUrl: url,
    imgWidth: width,
    imgHeight: height,
    bb,
    imageRatio,
    id,
    strokeWidth,
    fullColor,
  } = data;
  if (shadowWindow) {
    shadowWindow.send(
      events.SVG_URL_TO_IMG_URL,
      { url, width, height, bb, imageRatio, id, strokeWidth, fullColor }
    );
  }
});

ipcMain.on(events.SVG_URL_TO_IMG_URL_DONE, (e, data) => {
  const { imageUrl, id } = data;
  mainWindow.send(`${events.SVG_URL_TO_IMG_URL_DONE}_${id}`, imageUrl);
});

fontHelper.registerEvents();

let editingStandardInput = false;
ipcMain.on(events.SET_EDITING_STANDARD_INPUT, (event, arg) => {
  editingStandardInput = arg;
  console.log("Set SET_EDITING_STANDARD_INPUT", arg);
});

console.log('Running Beam Studio on ', os.arch());

app.setAsDefaultProtocolClient('beam-studio');

const hasLock = app.requestSingleInstanceLock();
console.log('hasLock', hasLock);

if (process.platform === 'win32' && !hasLock && getDeeplinkUrl(process.argv)) {
  // if primary instance exists and open from deep link, return
  app.quit();
  return;
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
  const url = getDeeplinkUrl(argv);
  handleDeepLinkUrl(mainWindow, url);
});

// macOS deep link handler
app.on('will-finish-launching', () => {
  app.on('open-url', (event, url) => {
    handleDeepLinkUrl(mainWindow, url);
  });
});

if (os.arch() == 'ia32' || os.arch() == 'x32') {
  app.commandLine.appendSwitch('js-flags', '--max-old-space-size=2048');
} else {
  app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096');
}

const onMenuClick = (data) => {
  data = {
    id: data.id,
    serial: data.serial,
    machineName: data.machineName,
  }
  if (mainWindow) {
    if (editingStandardInput) {
      if (data.id === 'REDO') {
        mainWindow.webContents.redo();
      }
      if (data.id === 'UNDO') {
        mainWindow.webContents.undo();
      }
    } else {
      console.log("Send", data);
      mainWindow.webContents.send(events.MENU_CLICK, data);
    }
  } else {
    console.log('Menu event triggered but window does not exist.');
  }
}

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
    console.log("MainWindow instance", mainWindow);
    mainWindow.focus();
  }
}

app.whenReady().then(() => {
  init();

  app.on('activate',() => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
});

app.on('window-all-closed',() => {
  if (process.platform !== 'darwin') app.quit()
});

app.on('before-quit', function () {
});
