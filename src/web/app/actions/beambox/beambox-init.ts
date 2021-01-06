import $ from 'jquery';
import BeamboxPreference from './beambox-preference';
import Constant from './constant';
import Tutorials from './tutorials';
import ElectronDialogs from '../electron-dialogs';
import InitializeMachine from '../initialize-machine';
import GlobalActions from '../global-actions';
import GlobalConstants from '../../constants/global-constants';
import Alert from '../../contexts/AlertCaller';
import AlertConstants from '../../constants/alert-constants';
import AlertStore from '../../stores/alert-store';
import DialogCaller from '../../contexts/DialogCaller';
import Progress from '../../contexts/ProgressCaller';
import DeviceConstants from '../../constants/device-constants';
import FontConstants from '../../constants/font-constants';
import ToolPanelsController from './Tool-Panels-Controller';
import ImageTracePanelController from './Image-Trace-Panel-Controller';
import AlertConfig from '../../../helpers/api/alert-config';
import Config from '../../../helpers/api/config';
import checkDeviceStatus from '../../../helpers/check-device-status';
import checkFirmware from '../../../helpers/check-firmware';
import DeviceMaster from '../../../helpers/device-master';
import firmwareUpdater from '../../../helpers/firmware-updater';
import OutputError from '../../../helpers/output-error';
import sprintf from '../../../helpers/sprintf';
import VersionChecker from '../../../helpers/version-checker';
import LocalStorage from '../../../helpers/local-storage';
import * as i18n from '../../../helpers/i18n';
import { IFont } from '../../../interfaces/IFont';
import { getSVGEdit } from '../../../helpers/svg-editor-helper';

const init = () => {
    ToolPanelsController.init('tool-panels-placeholder');
    ImageTracePanelController.init('image-trace-panel-placeholder');

    if (Constant.addonsSupportList.autoFocus.includes(BeamboxPreference.read('workarea'))) {
        const defaultAutoFocus = BeamboxPreference.read('default-autofocus');
        BeamboxPreference.write('enable-autofocus', defaultAutoFocus);
    } else {
        BeamboxPreference.write('enable-autofocus', false);
    }
    if (Constant.addonsSupportList.hybridLaser.includes(BeamboxPreference.read('workarea'))) {
        const defaultDiode = BeamboxPreference.read('default-diode');
        BeamboxPreference.write('enable-diode', defaultDiode);
    } else {
        BeamboxPreference.write('enable-diode', false);
    }

    let defaultBorderless = BeamboxPreference.read('default-borderless');
    if (defaultBorderless === undefined) {
        BeamboxPreference.write('default-borderless', BeamboxPreference.read('borderless'));
        defaultBorderless = BeamboxPreference.read('default-borderless');
    }
    if (Constant.addonsSupportList.openBottom.includes(BeamboxPreference.read('workarea'))) {
        BeamboxPreference.write('borderless', defaultBorderless);
    } else {
        BeamboxPreference.write('borderless', false);
    }

    const config = Config();
    if (!config.read('default-units')) {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const isEn = navigator.language.slice(0, 2).toLocaleLowerCase() === 'en';
        if (timeZone.startsWith('America') && isEn) {
            config.write('default-units', 'inches');
        }
    }
    if (!config.read('default-font')) {
        initDefaultFont();
    }
    initMenuBarEvents();
};

const displayGuides = () => {
    const guidesLines = (() => {
        const svgedit = getSVGEdit();
        const svgdoc = document.getElementById('svgcanvas').ownerDocument;
        const NS = svgedit.NS;
        const linesGroup = svgdoc.createElementNS(NS.SVG, 'svg');
        const lineVertical = svgdoc.createElementNS(NS.SVG, 'line');
        const lineHorizontal = svgdoc.createElementNS(NS.SVG, 'line');

        svgedit.utilities.assignAttributes(linesGroup, {
            'id': 'guidesLines',
            'width': '100%',
            'height': '100%',
            'x': 0,
            'y': 0,
            'viewBox': `0 0 ${Constant.dimension.getWidth()} ${Constant.dimension.getHeight()}`,
            'style': 'pointer-events: none'
        });

        svgedit.utilities.assignAttributes(lineHorizontal, {
            'id': 'horizontal_guide',
            'x1': 0,
            'x2': Constant.dimension.getWidth(),
            'y1': BeamboxPreference.read('guide_y0') * 10,
            'y2': BeamboxPreference.read('guide_y0') * 10,
            'stroke': '#000',
            'stroke-width': '2',
            'stroke-opacity': 0.8,
            'stroke-dasharray': '5, 5',
            'vector-effect': 'non-scaling-stroke',
            fill: 'none',
            style: 'pointer-events:none'
        });

        svgedit.utilities.assignAttributes(lineVertical, {
            'id': 'vertical_guide',
            'x1': BeamboxPreference.read('guide_x0') * 10,
            'x2': BeamboxPreference.read('guide_x0') * 10,
            'y1': 0,
            'y2': Constant.dimension.getHeight(),
            'stroke': '#000',
            'stroke-width': '2',
            'stroke-opacity': 0.8,
            'stroke-dasharray': '5, 5',
            'vector-effect': 'non-scaling-stroke',
            fill: 'none',
            style: 'pointer-events:none'
        });

        linesGroup.appendChild(lineHorizontal);
        linesGroup.appendChild(lineVertical);
        return linesGroup;
    })();
    const canvasBG = document.getElementById('canvasBackground');
    if (canvasBG) {
        canvasBG.appendChild(guidesLines);
    }
};

const initDefaultFont = () => {
    const lang = navigator.language;
    const os = process.platform;
    const FontScanner = requireNode('font-scanner');
    const config = Config();
    let defaultFontFamily = os === 'linux' ? 'Ubuntu' : 'Arial';
    if (FontConstants[lang] && FontConstants[lang][os]) {
        defaultFontFamily = FontConstants[lang][os];
    }
    const fonts = FontScanner.findFontsSync({ family: defaultFontFamily });
    if (fonts.length > 0) {
        const defaultFont: IFont = fonts.filter((font) => font.style === 'Regular')[0] || fonts[0];
        config.write('default-font', {
            family: defaultFont.family,
            postscriptName: defaultFont.postscriptName,
            style: defaultFont.style,
        });
    }
};

const initMenuBarEvents = () => {
    const LANG = i18n.lang;
    const electron = requireNode('electron');
    const ipc = electron.ipcRenderer;

    const getLog = async function (printer, log: string) {
        try {
            const res = await DeviceMaster.select(printer);
            if (res.success) {
                Progress.openSteppingProgress({id: 'get_log', message: 'downloading',});
                let downloader = DeviceMaster.downloadLog(log);
                downloader.then(async (file) => {
                    Progress.popById('get_log');
                    const targetFilePath = await ElectronDialogs.saveFileDialog(log , log, [{extensionName: 'log', extensions: ['log']}]);

                    if (targetFilePath) {
                        const fs = requireNode('fs');
                        const arrBuf = await new Response(file[1]).arrayBuffer();
                        const buf = Buffer.from(arrBuf);
                        fs.writeFileSync(targetFilePath, buf);
                    }
                }).progress((progress: {completed: number, size: number}) => {
                    Progress.update('get_log', {
                        message: 'downloading', percentage: progress.completed / progress.size * 100});
                }).fail((data) => {
                    Progress.popById('get_log');
                    let msg = data === 'canceled' ?
                        LANG.topmenu.device.download_log_canceled : LANG.topmenu.device.download_log_error;
                    Alert.popUp({
                        type: AlertConstants.SHOW_POPUP_INFO,
                        message: msg
                    });
                });
            }
        } catch (e) {
            console.error(e);
            return;
        }
    };

    const executeFirmwareUpdate = async function (printer, type) {
        var currentPrinter = printer,
            updateFirmware = function () {
                checkFirmware(currentPrinter, type).done(function (response) {
                    var latestVersion = currentPrinter.version,
                        caption = LANG.update.firmware.latest_firmware.caption,
                        message = LANG.update.firmware.latest_firmware.message;

                    if (!response.needUpdate) {
                        Alert.popUp({
                            id: 'latest-firmware',
                            message: message + ' (v' + latestVersion + ')',
                            caption,
                            buttonType: AlertConstants.CUSTOM_CANCEL,
                            buttonLabels: LANG.update.firmware.latest_firmware.still_update,
                            callbacks: () => {
                                firmwareUpdater(response, currentPrinter, type, true);
                            },
                            onCancel: () => {
                            }
                        });
                    } else {
                        firmwareUpdater(response, currentPrinter, type);
                    }

                })
                    .fail(function (response) {
                        firmwareUpdater(response, currentPrinter, type);
                    });
            },
            checkStatus = function () {
                const handleYes = (id) => {
                    if (id === 'head-missing') {
                        updateFirmware();
                    }
                };

                const handleCancel = (id) => {
                    if (id === 'head-missing') {
                        AlertStore.removeYesListener(handleYes);
                        AlertStore.removeCancelListener(handleCancel);
                        DeviceMaster.endMaintainMode();
                    }
                };

                AlertStore.onRetry(handleYes);
                AlertStore.onCancel(handleCancel);

                Progress.openNonstopProgress({id: 'check-status', caption: LANG.update.preparing});
                if (type === 'toolhead') {
                    DeviceMaster.enterMaintainMode().then(() => {
                        setTimeout(() => {
                            Progress.popById('check-status');
                            updateFirmware();
                        }, 3000);
                    });
                }
                else {
                    Progress.popById('check-status');
                    updateFirmware();
                }
            };
        // TODO: Handle the error better (output eresp)
        try {
            const res = await DeviceMaster.select(printer);
            if (res.success) {
                checkStatus();
            }
        } catch(resp) {
            console.error(resp);
            Alert.popUp({
                id: 'exec-fw-update',
                type: AlertConstants.SHOW_POPUP_ERROR,
                message: resp,
            });
        }
    };

    const registerAllDeviceMenuClickEvents = () => {

        window['menuEventRegistered'] = true;

        ipc.on('MENU_CLICK', (e, menuItem) => {
            let _action = {},
                lang = i18n.lang;

            _action['DASHBOARD'] = async (device) => {
                const res = await DeviceMaster.select(device);
                if (res.success) {
                    GlobalActions.showMonitor(device, '', '', GlobalConstants.DEVICE_LIST);
                }
            };

            _action['MACHINE_INFO'] = (device) => {
                let info = `${lang.device.model_name}: ${device.model.toUpperCase()}\n${lang.device.IP}: ${device.ipaddr}\n${lang.device.serial_number}: ${device.serial}\n${lang.device.firmware_version}: ${device.version}\n${lang.device.UUID}: ${device.uuid}`;
                Alert.popUp({
                    id: 'machine-info',
                    type: AlertConstants.SHOW_POPUP_INFO,
                    caption: device.name,
                    message: info,
                    buttonLabels: [lang.topmenu.device.network_test, lang.topmenu.ok],
                    callbacks: [
                        () => {DialogCaller.showNetworkTestingPanel(device.ipaddr)},
                        () => {}
                    ],
                    primaryButtonIndex: 1
                });
            };

            const calibrateCamera = async (device, isBorderless: boolean) => {
                try {
                    const deviceStatus = await checkDeviceStatus(device);
                    if (!deviceStatus) {
                        return;
                    }
                    Progress.openNonstopProgress({id: 'connect', caption: lang.message.connecting});
                    const res = await DeviceMaster.select(device);
                    Progress.popById('connect');
                    if (res.success) {
                        DialogCaller.showCameraCalibration(device, isBorderless);
                    }
                } catch (e) {
                    Progress.popById('connect');
                    console.error(e);
                }

            }

            _action['CALIBRATE_BEAMBOX_CAMERA'] = async (device) => {
                if (location.hash !== '#studio/beambox') {
                    Alert.popUp({
                        type: AlertConstants.SHOW_POPUP_INFO,
                        message: lang.camera_calibration.please_goto_beambox_first,
                    });
                    return;
                }
                calibrateCamera(device, false);
            };

            _action['CALIBRATE_BEAMBOX_CAMERA_BORDERLESS'] = async (device) => {
                if (location.hash !== '#studio/beambox') {
                    Alert.popUp({
                        type: AlertConstants.SHOW_POPUP_INFO,
                        message: lang.camera_calibration.please_goto_beambox_first,
                    });
                    return;
                }
                const vc = VersionChecker(device.version);
                const isAvailableVersion = vc.meetRequirement('BORDERLESS_MODE');
                if (isAvailableVersion) {
                    calibrateCamera(device, true);
                } else {
                    const message = `${lang.camera_calibration.update_firmware_msg1} 2.5.1 ${lang.camera_calibration.update_firmware_msg2}`;
                    Alert.popUp({
                        type: AlertConstants.SHOW_POPUP_INFO,
                        message,
                    });
                }
            };

            _action['CALIBRATE_DIODE_MODULE'] = async (device) => {
                if (location.hash !== '#studio/beambox') {
                    Alert.popUp({
                        type: AlertConstants.SHOW_POPUP_INFO,
                        message: lang.camera_calibration.please_goto_beambox_first,
                    });
                    return;
                }
                const vc = VersionChecker(device.version);
                const diodeAvailable = vc.meetRequirement('DIODE_AND_AUTOFOCUS');
                if (diodeAvailable) {
                    try {
                        Progress.openNonstopProgress({id: 'connect', caption: lang.message.connecting});
                        const res = await DeviceMaster.select(device);
                        Progress.popById('connect');
                        if (res.success) {
                            DialogCaller.showDiodeCalibration(device);
                        }
                    } catch (e) {
                        Progress.popById('connect');
                        console.error(e);
                    }
                } else {
                    const message = `${lang.diode_calibration.update_firmware_msg1} 3.0.0 ${lang.diode_calibration.update_firmware_msg2}`;
                    Alert.popUp({
                        type: AlertConstants.SHOW_POPUP_INFO,
                        message,
                    });
                }
            };

            _action['UPDATE_FIRMWARE'] = async (device) => {
                const deviceStatus = await checkDeviceStatus(device);
                if (deviceStatus) {
                    executeFirmwareUpdate(device, 'firmware');
                }
            };

            _action['UPDATE_TOOLHEAD'] = async (device) => {
                console.error('update toolhead function has been removed, \nUse flux studio');
            };

            _action['LOG_NETWORK'] = (device) => {
                getLog(device, 'fluxnetworkd.log');
            };

            _action['LOG_HARDWARE'] = (device) => {
                getLog(device, 'fluxhald.log');
            };

            _action['LOG_DISCOVER'] = (device) => {
                getLog(device, 'fluxupnpd.log');
            };

            _action['LOG_USB'] = (device) => {
                getLog(device, 'fluxusbd.log');
            };

            _action['LOG_USBLIST'] = async (device) => {
                const res = await DeviceMaster.select(device);
                if (res.success) {
                    const data = await DeviceMaster.lsusb();
                    Alert.popUp({
                        type: AlertConstants.SHOW_POPUP_INFO,
                        message: data.usbs.join('\n'),
                        caption: lang.topmenu.device.log.usblist
                    });
                }
            };

            _action['LOG_CAMERA'] = (device) => {
                getLog(device, 'fluxcamerad.log');
            };

            _action['LOG_CLOUD'] = (device) => {
                getLog(device, 'fluxcloudd.log');
            };

            _action['LOG_PLAYER'] = (device) => {
                const vc = VersionChecker(device.version);
                if (vc.meetRequirement('NEW_PLAYER')) {
                    getLog(device, 'playerd.log');
                } else {
                    getLog(device, 'fluxplayerd.log');
                }
            };

            _action['LOG_ROBOT'] = (device) => {
                getLog(device, 'fluxrobotd.log');
            };

            // _action['SET_AS_DEFAULT'] = (device) => {
            //     InitializeMachine.defaultPrinter.clear();
            //     InitializeMachine.defaultPrinter.set(device);
            //     ipc.send('SET_AS_DEFAULT', device);
            // };

            _action['BUG_REPORT'] = () => {
                OutputError.downloadErrorLog();
            };

            if (typeof _action[menuItem.id] === 'function') {
                if (
                    menuItem.id === 'SIGN_IN' ||
                        menuItem.id === 'SIGN_OUT' ||
                        menuItem.id === 'MY_ACCOUNT' ||
                        menuItem.id === 'BUG_REPORT'
                ) {
                    _action[menuItem.id]();
                }
                else {
                    let callback = {
                        timeout: 20000,
                        onSuccess: (device) => { _action[menuItem.id](device); },
                        onTimeout: () => { console.log('select device timeout'); }
                    };

                    DeviceMaster.getDeviceBySerial(menuItem.serial, callback);
                }
            }
        });

    };

    if (!window['menuEventRegistered']) {
        registerAllDeviceMenuClickEvents();
    }
};

const showTutorial = () => {
    if (!AlertConfig.read('skip-interface-tutorial')) {
        const LANG = i18n.lang.tutorial;
        const isNewUser = LocalStorage.get('new-user');
        Alert.popUp({
            id: 'ask-tutorial',
            caption: LANG.welcome,
            message: isNewUser ? LANG.needNewUserTutorial : LANG.needNewInterfaceTutorial,
            buttonType: AlertConstants.YES_NO,
            onYes: () => {
                const tutorialCallback = () => {
                    LocalStorage.removeAt('new-user');
                    AlertConfig.write('skip-interface-tutorial', true);
                    Alert.popUp({
                        message: LANG.tutorial_complete,
                    });
                }
                if (isNewUser) {
                    Tutorials.startNewUserTutorial(tutorialCallback);
                } else {
                    Tutorials.startInterfaceTutorial(tutorialCallback);
                }
            },
            onNo: () => {
                LocalStorage.removeAt('new-user');
                AlertConfig.write('skip-interface-tutorial', true);
                if (isNewUser) {
                    Alert.popUp({
                        message: LANG.skip_tutorial,
                    });
                }
            }
        });
    }
};

const checkOSVersion = () => {
    const LANG = i18n.lang.beambox;
    if (!AlertConfig.read('skip_os_version_warning')) {
        if (process.platform === 'darwin') {
            try {
                const osVersion = /(?<=Mac OS X )[\.\_\d]+/.exec(navigator.userAgent)[0];
                const version = osVersion.split('_').map((v) => parseInt(v));
                if (version[0] === 10 && version[1] < 13) {
                    Alert.popUp({
                        id: 'os_version_warning',
                        message: sprintf(i18n.lang.message.unsupport_osx_version, osVersion),
                        type: AlertConstants.SHOW_POPUP_WARNING,
                        checkBox: {
                            text: LANG.popup.dont_show_again,
                            callbacks: () => {AlertConfig.write('skip_os_version_warning', true)}
                        }
                    });
                }
            } catch (e) {
                console.error('Fail to get MacOS Version');
                return;
            }
        } else if (process.platform === 'win32') {
            var windowsVersionStrings = [
                {s:'Windows 10', r:/(Windows 10.0|Windows NT 10.0)/, shouldAlert: false},
                {s:'Windows 8.1', r:/(Windows 8.1|Windows NT 6.3)/, shouldAlert: true},
                {s:'Windows 8', r:/(Windows 8|Windows NT 6.2)/, shouldAlert: true},
                {s:'Windows 7', r:/(Windows 7|Windows NT 6.1)/, shouldAlert: true},
                {s:'Windows Vista', r:/Windows NT 6.0/, shouldAlert: true},
                {s:'Windows Server 2003', r:/Windows NT 5.2/, shouldAlert: true},
                {s:'Windows XP', r:/(Windows NT 5.1|Windows XP)/, shouldAlert: true},
                {s:'Windows 2000', r:/(Windows NT 5.0|Windows 2000)/, shouldAlert: true},
                {s:'Windows ME', r:/(Win 9x 4.90|Windows ME)/, shouldAlert: true},
                {s:'Windows 98', r:/(Windows 98|Win98)/, shouldAlert: true},
                {s:'Windows 95', r:/(Windows 95|Win95|Windows_95)/, shouldAlert: true},
                {s:'Windows NT 4.0', r:/(Windows NT 4.0|WinNT4.0|WinNT)/, shouldAlert: true},
                {s:'Windows CE', r:/Windows CE/, shouldAlert: true},
                {s:'Windows 3.11', r:/Win16/, shouldAlert: true},
            ];
            let shouldAlert = false;
            let osVersion;
            for (let i = 0; i < windowsVersionStrings.length; i++) {
                let versionString = windowsVersionStrings[i];
                if (versionString.r.test(navigator.userAgent)) {
                    osVersion = versionString.s;
                    shouldAlert = versionString.shouldAlert;
                    break;
                }
            }
            if (shouldAlert) {
                Alert.popUp({
                    id: 'os_version_warning',
                    message: sprintf(i18n.lang.message.unsupport_win_version, osVersion),
                    type: AlertConstants.SHOW_POPUP_WARNING,
                    checkBox: {
                        text: LANG.popup.dont_show_again,
                        callbacks: () => {AlertConfig.write('skip_os_version_warning', true)}
                    }
                });
            }
        }
    }
};

export default {
    init: init,
    displayGuides: displayGuides,
    initMenuBarEvents: initMenuBarEvents,
    showTutorial,
    checkOSVersion,
};
