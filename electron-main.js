const {app, ipcMain, BrowserWindow, dialog} = require('electron');
app.commandLine.appendSwitch('ignore-gpu-blacklist');

const BackendManager = require('./src/backend-manager.js');
const MonitorManager = require('./src/monitor-manager.js');
const MenuManager = require('./src/menu-manager.js');
const UpdateManager = require('./src/update-manager.js');
const UglyNotify = require('./src/ugly-notify.js');
const events = require('./src/ipc-events');

const TTC2TTF = require('./src/ttc2ttf.js');

const FontManager = require('font-manager');
const TextToSVG = require('text-to-svg');
const path = require('path');
const url = require('url');
const fs = require('fs');
const os = require('os');
const exec = require('child_process').exec;

let mainWindow;
let menuManager;

global.backend = {alive: false};
global.devices = {};

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
    let f = fs.createWriteStream(filename, {flags: 'w'});
    global.backend.logfile = filename;
    console._stdout = f;
    console._stderr = f;
    return f;
}

var DEBUG = false;
const logger = process.stderr.isTTY ? process.stderr : createLogFile();

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
    if(mainWindow) {
        mainWindow.webContents.send(events.BACKEND_UP, global.backend);
    }
}


function onGhostDown() {
    global.backend.alive = false;
    global.backend.port = undefined;
    if(mainWindow) {
        mainWindow.webContents.send('backend-down');
    }
}


function onDeviceUpdated(deviceInfo) {
    let deviceID = `${deviceInfo.source}:${deviceInfo.uuid}`;

    let origDeviceInfo = global.devices[deviceID];
    if(origDeviceInfo && origDeviceInfo.st_id !== null && origDeviceInfo.st_id !== deviceInfo.st_id) {
        switch(deviceInfo.st_id) {
            case 48:
                UglyNotify.send(deviceInfo.name, 'Is paused');
                break;
            case 64:
                UglyNotify.send(deviceInfo.name, 'Is completed!');
                break;
            case 128:
                UglyNotify.send(deviceInfo.name, 'Is aborted');
                break;
        }
    }

    if(mainWindow) {
        mainWindow.webContents.send('device-status', deviceInfo);
    }

    if(deviceInfo.alive) {
        if (menuManager) {
            menuManager.updateDevice(deviceInfo.uuid, deviceInfo);
        }
    } else {
        if(global.devices[deviceID]) {
            if (menuManager) {
                menuManager.removeDevice(deviceInfo.uuid, global.devices[deviceID]);
            }
            delete global.devices[deviceID];
        }
    }

    global.devices[deviceID] = deviceInfo;
}

require('./src/bootstrap.js');

const updateManager = new UpdateManager();
const backendManager = new BackendManager({
    location: process.env.BACKEND,
    trace_pid: process.pid,
    server: process.argv.indexOf('--server') > 0,
    on_ready: onGhostUp,
    on_device_updated: onDeviceUpdated,
    on_stderr: (data) => logger.write(`${data}`),
    on_stopped: onGhostDown,
    c: console
});
backendManager.start();
//Run monitorexe api
const monitorManager = new MonitorManager({
    location: process.env.BACKEND
});
//kill process first, in case last time shut down
monitorManager.killProcSync();
monitorManager.startProc();

function createWindow () {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1080,
        height: 650,
        titleBarStyle: process.platform === 'darwin' ? 'hidden' : null,
        frame: process.platform === 'win32' ? false : null,
        title: `Beam Studio - ${app.getVersion()}`,
        webPreferences: {
            preload: path.join(__dirname, 'src', 'main-window-entry.js'),
            nodeIntegration: true
        },
        vibrancy: 'light'});

    // mainWindow.maximize();

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'public/index.html'),
        protocol: 'file:',
        slashes: true,
    }));

    let isCloseConfirm = false;
    let isFrontEndReady = false;
    ipcMain.on(events.FRONTEND_READY, () => {
        isFrontEndReady = true;
    });

    mainWindow.on('close', function(e) {
        if (isFrontEndReady && !isCloseConfirm) {
            e.preventDefault(); 
            mainWindow.webContents.send('WINDOW_CLOSE', e);
            // if save dialog does not pop in 10 seconds, something may goes wrong in frontend, close the app
            let isSaveDialogPopped = false;
            ipcMain.once('SAVE_DIALOG_POPPED', () => {
                isSaveDialogPopped = true;
            });
            setTimeout(() => {
                if (!isSaveDialogPopped) {
                    isCloseConfirm = true;
                    mainWindow.close();
                }
            }, 10000);
            ipcMain.once('CLOSE_REPLY', (event, reply) => {
                if (reply) {
                    isCloseConfirm = true;
                    mainWindow.close();
                }
            });
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

    mainWindow.on('page-title-updated', function(event) {
        event.preventDefault();
    });

    menuManager.on('DEBUG-RELOAD', () => {
        mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'public/index.html'),
            protocol: 'file:',
            slashes: true,
        }));
    });

    menuManager.on('DEBUG-INSPECT', () => {
        mainWindow.webContents.openDevTools();
    });
    ipcMain.on('DEBUG-INSPECT', () => {
        mainWindow.webContents.openDevTools();
    });
    if(process.defaultApp || DEBUG) {
        mainWindow.webContents.openDevTools();
    }
    updateManager.setMainWindow(mainWindow);
}

ipcMain.on(events.CHECK_BACKEND_STATUS, () => {
    if(mainWindow) {
        mainWindow.send(events.NOTIFY_BACKEND_STATUS, {
            backend: global.backend,
            devices: global.devices
        });
    } else {
        console.error('Recv async-status request but main window not exist');
    }
});
var fontsListCache = [];
ipcMain.on(events.GET_AVAILABLE_FONTS , (event, arg) => {
    const fonts = FontManager.getAvailableFontsSync();
	fontsListCache = fonts;
    event.returnValue = fonts;
});

function findFontsSync(arg) {
    const availableFonts = FontManager.getAvailableFontsSync();
    const matchFamily = availableFonts.filter(font => font.family === arg.family);
    const match = matchFamily.filter(font => {
        result = true
        Object.getOwnPropertyNames(arg).forEach(a => {
            if (arg[a] !== font[a]) {
                result = false;
            }
        });
        return result;
    });
    return match;
}

function findFontSync(arg) {
    arg.style = arg.style || 'Regular';
    const availableFonts = FontManager.getAvailableFontsSync();
    let font = availableFonts[0];
    let match = availableFonts.filter(font => font.family === arg.family);
    font = match[0] || font;
    if (arg.italic != null) {
        match = match.filter(font => font.italic === arg.italic);
        font = match[0] || font;
    }
    match = match.filter(font => font.style === arg.style);
    font = match[0] || font;
    if (arg.weight != null) {
        match = match.filter(font => font.weight === arg.weight);
    }
    font = match[0] || font;
    return font;
};

ipcMain.on(events.FIND_FONTS , (event, arg) => {
    // FontManager.findFontsSync({ family: 'Arial' });
    const fonts = findFontsSync(arg);
    event.returnValue = fonts;
});

ipcMain.on(events.FIND_FONT , (event, arg) => {
    // FontManager.findFontSync({ family: 'Arial', weight: 700 })
    const font = findFontSync(arg);
    event.returnValue = font;
});

ipcMain.on('save-dialog', function (event, title, allFiles, extensionName, extensions, filename, file) {
    const isMac = (process.platform === 'darwin');
    const options = {
        defaultPath: filename,
        title,
        filters: [
            { name: isMac ? `${extensionName} (*.${extensions[0]})` : extensionName ,extensions },
            { name: allFiles, extensions: ['*'] }
        ]
    }

    dialog.showSaveDialog(options, function (filePath) {
        if (!filePath) {
            event.returnValue = false;
            return;
        }

        switch (typeof(file)) {
            case 'string':
                fs.writeFile(filePath, file, function(err) {
                    if (err) {
                        dialog.showErrorBox('Error', err);
                        event.returnValue = false;
                        return;
                    }
                });
                break;
            case 'object':
                fs.writeFileSync(filePath, file, function(err) {
                    if(err) {
                        dialog.showErrorBox('Error', err);
                        event.returnValue = false;
                        return;
                    }
                });
                break;
            default:
                event.returnValue = false;
                dialog.showErrorBox('Error: something wrong, please contact FLUX Support');
                break;
        }
        event.returnValue = filePath;
    })
})

ipcMain.on(events.REQUEST_PATH_D_OF_TEXT , async (event, {text, x, y, fontFamily, fontSize, fontStyle, letterSpacing, key}) => {
    const substitutedFamily = (function(){

        // Escape for Whitelists
        const whiteList = ['標楷體'];
        const whiteKeyWords = ['華康', 'Adobe'];
        if (whiteList.indexOf(fontFamily) >= 0) {
            return fontFamily;
        }
        for (let i = 0; i < whiteKeyWords.length; i++) {
            let keyword = whiteKeyWords[i];
            if (fontFamily.indexOf(keyword) >= 0) {
                return fontFamily;
            }
        }
        //if only contain basic character (123abc!@#$...), don't substitute.
        //because my Mac cannot substituteFont properly handing font like 'Windings'
        //but we have to subsittue text if text contain both English and Chinese
        const textOnlyContainBasicLatin = Array.from(text).every(char => {
            return char.charCodeAt(0) <= 0x007F;
        });
        if (textOnlyContainBasicLatin) {
            return fontFamily;
        }

        const originFont = findFontSync({
            family: fontFamily,
            style: fontStyle
        });

        // array of used family which are in the text
        
        const originPostscriptName = originFont.postscriptName;
        const fontList = Array.from(text).map(char =>
            FontManager.substituteFontSync(originPostscriptName, char)
        );
        let familyList = fontList.map(font => font.family);
        let postscriptList = fontList.map(font => font.postscriptName)
        // make unique
        familyList = [...new Set(familyList)];
        postscriptList = [...new Set(postscriptList)];

        if (familyList.length === 1) {
            return familyList[0];
        } else {
            // Test all found fonts if they contain all 
            
            let fontIndex;
            for (let i = 0; i < postscriptList.length; ++i) {
                let allFit = true;
                for (let j = 0; j < text.length; ++j) {
                    if (fontList[j].postscriptName === postscriptList[i]) {
                        continue;
                    }
                    const foundfont = FontManager.substituteFontSync(postscriptList[i], text[j]).family;
                    if (familyList[i] !== foundfont) {
                        allFit = false;
                        break;
                    }
                }
                if (allFit) {
                    console.log(`Find ${familyList[i]} fit for all char`);
                    return familyList[i];
                }
            }
            console.log('Cannot find a font fit for all')
            return (familyList.filter(family => family !== fontFamily))[0];
        }
    })();

    // Font Manager won't return PingFang Semibold if input PingFang Bold
    if (substitutedFamily && substitutedFamily.indexOf('PingFang') > -1) {
        switch(fontStyle) {
            case 'Bold':
                fontStyle = 'Semibold';
                break;
            case 'Italic':
                fontStyle = 'Regular';
                break;
            case 'Bold Italic':
                fontStyle = 'Semibold';
                break;
            default:
                break;
        }
    }
    console.log('fontstyle', fontStyle);
    let font = findFontSync({
        family: substitutedFamily,
        style: fontStyle
    });
    let fontPath = font.path;
	if (fontFamily.indexOf("華康") >= 0 && (fontPath.toLowerCase().indexOf("arial") > 0 || fontPath.toLowerCase().indexOf("meiryo") > 0)) {
		// This is a hotfix for 華康系列 fonts, because fontmanager does not support
		for (var i in fontsListCache) {
			const fontInfo = fontsListCache[i];
			if (fontInfo.family == fontFamily) {
				fontPath = fontInfo.path;
				font = fontInfo;
			}
		}
	}
	console.log("New Font path ", fontPath);
    if (fontPath.toLowerCase().endsWith('.ttc') || fontPath.toLowerCase().endsWith('.ttcf')) {
        fontPath = await TTC2TTF(fontPath, font.postscriptName);
    }
    const pathD = TextToSVG.loadSync(fontPath).getD(text, {
        fontSize: Number(fontSize),
        anchor: 'left baseline',
        x: x,
        y: y,
        letterSpacing: letterSpacing
    });

    event.sender.send(events.RESOLVE_PATH_D_OF_TEXT + key, pathD);
});

console.log('Running Beam Studio on ', os.arch());

if (os.arch() == 'ia32' || os.arch() == 'x32') {
    app.commandLine.appendSwitch('js-flags', '--max-old-space-size=2048');
} else {
    app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096');
}

app.on('ready', () => {
    menuManager = new MenuManager();
    menuManager.on(events.MENU_CLICK, (data) => {
        if(mainWindow) {
            mainWindow.webContents.send(events.MENU_CLICK, data);
        } else {
            console.log('Menu event triggered but window does not exist.');
        }
    });

    if(!mainWindow) {
        createWindow();
    } else {
        console.log("MainWindow instance", mainWindow);
        mainWindow.focus();
    }

});


// app.on('window-all-closed', function () {
// });


app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});

app.on('before-quit', function() {
    monitorManager.killProc();
    backendManager.stop();
});
