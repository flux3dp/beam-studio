define([
    'jquery',
    'app/actions/beambox/beambox-preference',
    'app/actions/beambox/constant',
    'app/actions/initialize-machine',
    'app/actions/global-actions',
    'app/constants/global-constants',
    'app/contexts/AlertCaller',
    'app/constants/alert-constants',
    'app/stores/alert-store',
    'jsx!contexts/DialogCaller',
    'app/actions/progress-actions',
    'app/constants/progress-constants',
    'app/constants/device-constants',
    'app/constants/tutorial-constants',
    'jsx!app/actions/beambox/Tool-Panels-Controller',
    'jsx!app/actions/beambox/Laser-Panel-Controller',
    'jsx!app/actions/beambox/Image-Trace-Panel-Controller',
    'helpers/api/alert-config',
    'helpers/api/config',
    'helpers/api/discover',
    'helpers/check-device-status',
    'helpers/check-firmware',
    'helpers/device-master',
    'helpers/firmware-updater',
    'helpers/output-error',
    'helpers/version-checker',
    'helpers/i18n'
], function (
    $,
    BeamboxPreference,
    Constant,
    InitializeMachine,
    GlobalActions,
    GlobalConstants,
    Alert,
    AlertConstants,
    AlertStore,
    DialogCaller,
    ProgressActions,
    ProgressConstants,
    DeviceConstants,
    TutorialConstants,
    ToolPanelsController,
    LaserPanelController,
    ImageTracePanelController,
    AlertConfig,
    Config,
    Discover,
    checkDeviceStatus,
    checkFirmware,
    DeviceMaster,
    firmwareUpdater,
    OutputError,
    VersionChecker,
    i18n
) {
    const init = () => {
        ToolPanelsController.init('tool-panels-placeholder');
        LaserPanelController.init('layer-laser-panel-placeholder');
        ImageTracePanelController.init('image-trace-panel-placeholder');

        const defaultAutoFocus = BeamboxPreference.read('default-autofocus');
        BeamboxPreference.write('enable-autofocus', defaultAutoFocus);
        const defaultDiode = BeamboxPreference.read('default-diode');
        BeamboxPreference.write('enable-diode', defaultDiode);
        const defaultBorderless = BeamboxPreference.read('default-borderless');
        if (defaultBorderless === undefined) {
            BeamboxPreference.write('default-borderless', BeamboxPreference.read('borderless'));
        } else {
            BeamboxPreference.write('borderless', defaultBorderless);
        }
        const config = Config();
        if (!config.read('default-units')) {
            const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const isEn = navigator.language.slice(0, 2).toLocaleLowerCase() === 'en';
            if (timeZone.startsWith('America') && isEn) {
                config.write('default-units', 'inches');
            }
        }
        initMenuBarEvents();
    };

    const displayGuides = () => {
        const guidesLines = (() => {
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

        $('#canvasBackground').get(0).appendChild(guidesLines);
    };

    const initMenuBarEvents = () => {
        const LANG = i18n.lang;
        const electron = require('electron');
        const ipc = electron.ipcRenderer;

        const getLog = async function (printer, log) {
            await DeviceMaster.select(printer);
            ProgressActions.open(ProgressConstants.WAITING, '');
            let downloader = DeviceMaster.downloadLog(log);
            downloader.then((file) => {
                ProgressActions.close();
                saveAs(file[1], log);

            }).progress((progress) => {
                ProgressActions.open(ProgressConstants.STEPPING);
                ProgressActions.updating(
                    'downloading',
                    progress.completed / progress.size * 100,
                    function () { downloader.reject('canceled'); }
                );

            }).fail((data) => {
                let msg = data === 'canceled' ?
                    LANG.device.download_log_canceled : LANG.device.download_log_error;
                Alert.popUp({
                    type: AlertConstants.SHOW_POPUP_INFO,
                    message: msg
                });
            });
        };

        const executeFirmwareUpdate = function (printer, type) {
            var currentPrinter = printer,
                checkToolheadFirmware = function () {
                    var $deferred = $.Deferred();

                    ProgressActions.open(ProgressConstants.NONSTOP, LANG.update.checkingHeadinfo);

                    if ('toolhead' === type) {
                        DeviceMaster.headInfo().done(function (response) {
                            currentPrinter.toolhead_version = response.version || '';

                            if ('undefined' === typeof response.version) {
                                $deferred.reject();
                            }
                            else {
                                $deferred.resolve({ status: 'ok' });
                            }
                        }).fail(() => {
                            $deferred.reject();
                        });
                    }
                    else {
                        $deferred.resolve({ status: 'ok' });
                    }

                    return $deferred;
                },
                updateFirmware = function () {
                    checkFirmware(currentPrinter, type).done(function (response) {
                        var latestVersion = currentPrinter.version,
                            caption = LANG.update.firmware.latest_firmware.caption,
                            message = LANG.update.firmware.latest_firmware.message;

                        if ('toolhead' === type) {
                            latestVersion = currentPrinter.toolhead_version;
                            caption = LANG.update.toolhead.latest_firmware.caption;
                            message = LANG.update.toolhead.latest_firmware.message;
                        }

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
                                    if ('toolhead' === type) {
                                        DeviceMaster.quitTask();
                                    }
                                }
                            });
                        } else {
                            firmwareUpdater(response, currentPrinter, type);
                        }

                    })
                        .fail(function (response) {
                            firmwareUpdater(response, currentPrinter, type);
                            Alert.popUp({
                                id: 'latest-firmware',
                                type: AlertConstants.SHOW_POPUP_INFO,
                                message: LANG.monitor.cant_get_toolhead_version
                            });
                        });
                },
                checkStatus = function () {
                    const processUpdate = () => {
                        checkToolheadFirmware().always(function () {
                            ProgressActions.close();
                            updateFirmware();
                        }).fail(function () {
                            Alert.popUp({
                                id: 'toolhead-offline',
                                type: AlertConstants.SHOW_POPUP_ERROR,
                                message: LANG.monitor.cant_get_toolhead_version
                            });
                        });
                    };

                    const handleYes = (id) => {
                        if (id === 'head-missing') {
                            processUpdate();
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

                    ProgressActions.open(ProgressConstants.NONSTOP, LANG.update.preparing);
                    if (type === 'toolhead') {
                        DeviceMaster.enterMaintainMode().then(() => {
                            setTimeout(() => {
                                ProgressActions.close();
                                processUpdate();
                            }, 3000);
                        });
                    }
                    else {
                        processUpdate();
                    }
                };


            DeviceMaster.select(printer).then((status) => {
                checkStatus();
            }).fail((resp) => {
                Alert.popUp({
                    id: 'menu-item',
                    type: AlertConstants.SHOW_POPUP_ERROR,
                    message: LANG.message.connectionTimeout
                });
            });
        };

        const registerAllDeviceMenuClickEvents = () => {

            window.menuEventRegistered = true;

            ipc.on('MENU_CLICK', (e, menuItem) => {
                let _action = {},
                    lang = i18n.get();

                _action['DASHBOARD'] = (device) => {
                    DeviceMaster.selectDevice(device).then(status => {
                        if (status === DeviceConstants.CONNECTED) {
                            GlobalActions.showMonitor(device, '', '', GlobalConstants.DEVICE_LIST);
                        }
                        else if (status === DeviceConstants.TIMEOUT) {
                            Alert.popUp({
                                id: 'menu-item',
                                type: AlertConstants.SHOW_POPUP_ERROR,
                                message: lang.message.connectionTimeout
                            });
                        }
                    });
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

                _action['CALIBRATE_BEAMBOX_CAMERA'] = async (device) => {
                    if (location.hash !== '#studio/beambox') {
                        Alert.popUp({
                            type: AlertConstants.SHOW_POPUP_INFO,
                            message: lang.camera_calibration.please_goto_beambox_first,
                        });
                        return;
                    }
                    ProgressActions.open(ProgressConstants.NONSTOP, lang.message.connecting);
                    await checkDeviceStatus(device);
                    DeviceMaster.select(device)
                        .done(() => {
                            ProgressActions.close();
                            const isBorderless = false;
                            DialogCaller.showCameraCalibration(device, isBorderless);
                        })
                        .fail(() => {
                            ProgressActions.close();
                            Alert.popUp({
                                type: AlertConstants.SHOW_POPUP_ERROR,
                                message: lang.message.connectionTimeout,
                            });
                        });
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
                        ProgressActions.open(ProgressConstants.NONSTOP, lang.message.connecting);
                        await checkDeviceStatus(device);
                        DeviceMaster.select(device)
                            .done(() => {
                                ProgressActions.close();
                                const isBorderless = true;
                                DialogCaller.showCameraCalibration(device, isBorderless);
                            })
                            .fail(() => {
                                ProgressActions.close();
                                Alert.popUp({
                                    type: AlertConstants.SHOW_POPUP_ERROR,
                                    message: lang.message.connectionTimeout,
                                });
                            });
                    } else {
                        const message = `${lang.camera_calibration.update_firmware_msg1} 2.5.1 ${lang.camera_calibration.update_firmware_msg2}`;
                        Alert.popUp({
                            type: AlertConstants.SHOW_POPUP_INFO,
                            message,
                        });
                    }

                };

                _action['CALIBRATE_DIODE_MODULE'] = (device) => {
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
                        ProgressActions.open(ProgressConstants.NONSTOP, lang.message.connecting);
                        DeviceMaster.select(device)
                            .done(() => {
                                ProgressActions.close();
                                DialogCaller.showDiodeCalibration(device);
                            })
                            .fail(() => {
                                ProgressActions.close();
                                Alert.popUp({
                                    type: AlertConstants.SHOW_POPUP_ERROR,
                                    message: lang.message.connectionTimeout,
                                });
                            });
                    } else {
                        const message = `${lang.diode_calibration.update_firmware_msg1} 3.0.0 ${lang.diode_calibration.update_firmware_msg2}`;
                        Alert.popUp({
                            type: AlertConstants.SHOW_POPUP_INFO,
                            message,
                        });
                    }
                };

                _action['UPDATE_FIRMWARE'] = (device) => {
                    checkDeviceStatus(device).then(() => {
                        executeFirmwareUpdate(device, 'firmware');
                    });
                };

                _action['UPDATE_TOOLHEAD'] = (device) => {
                    checkDeviceStatus(device).then(() => {
                        executeFirmwareUpdate(device, 'toolhead');
                    });
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

                _action['LOG_USBLIST'] = (device) => {
                    DeviceMaster.selectDevice(device).then(status => {
                        if (status === DeviceConstants.CONNECTED) {}
                        DeviceMaster.lsusb().then( res => {
                            Alert.popUp({
                                type: AlertConstants.SHOW_POPUP_INFO,
                                message: res.usbs.join('\n'),
                                caption: lang.topmenu.device.log.usblist
                            });
                        });
                    });
                };

                _action['LOG_CAMERA'] = (device) => {
                    getLog(device, 'fluxcamerad.log');
                };

                _action['LOG_CLOUD'] = (device) => {
                    getLog(device, 'fluxcloudd.log');
                };

                _action['LOG_PLAYER'] = (device) => {
                    getLog(device, 'fluxplayerd.log');
                };

                _action['LOG_ROBOT'] = (device) => {
                    getLog(device, 'fluxrobotd.log');
                };

                _action['SET_AS_DEFAULT'] = (device) => {
                    InitializeMachine.defaultPrinter.clear();
                    InitializeMachine.defaultPrinter.set(device);
                    ipc.send('SET_AS_DEFAULT', device);
                };

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

                        DeviceMaster.getDeviceBySerial(menuItem.serial, menuItem.source === 'h2h', callback);
                    }
                }
            });

        };

        if (!window.menuEventRegistered) {
            registerAllDeviceMenuClickEvents();
        }
    };

    showTutorial = () => {
        if (!AlertConfig.read('skip-interface-tutorial')) {
            const LANG = i18n.lang.tutorial;
            const isNewUser = localStorage.getItem('new-user') === 'true';
            Alert.popUp({
                id: 'ask-tutorial',
                message: isNewUser ? LANG.needNewUserTutorial : LANG.needNewInterfaceTutorial,
                buttonType: AlertConstants.YES_NO,
                onYes: () => {
                    let tutorial;
                    if (isNewUser) {
                        tutorial = TutorialConstants.NEW_USER_TUTORIAL;
                    } else {
                        tutorial = TutorialConstants.INTERFACE_TUTORIAL;
                    }
                    DialogCaller.showTutorial(tutorial, () => {
                        //localStorage.removeItem('new-user');
                        //AlertConfig.write('skip-interface-tutorial', true);
                    });
                },
                onNo: () => {
                    console.log('no thx');
                    //localStorage.removeItem('new-user');
                    //AlertConfig.write('skip-interface-tutorial', true);
                }
            });
        }
    };

    return {
        init: init,
        displayGuides: displayGuides,
        initMenuBarEvents: initMenuBarEvents,
        showTutorial,
    };
});
