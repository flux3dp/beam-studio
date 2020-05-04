define([
    'jquery',
    'helpers/i18n',
    'app/app-settings',
    'helpers/api/discover',
    'helpers/device-master',
    'helpers/check-device-status',
    'helpers/check-firmware',
    'helpers/version-checker',
    'helpers/firmware-updater',
    'helpers/firmware-version-checker',
    'helpers/sprintf',
    'helpers/api/cloud',
    'helpers/output-error',
    'plugins/classnames/index',
    'app/constants/device-constants',
    'jsx!views/beambox/About-Beam-Studio',
    'app/contexts/AlertCaller',
    'app/constants/alert-constants',
    'app/actions/alert-actions',
    'app/stores/alert-store',
    'jsx!contexts/DialogCaller',
    'app/actions/global-actions',
    'app/stores/global-store',
    'app/stores/topbar-store',
    'app/actions/beambox',
    'helpers/device-list',
    'app/actions/progress-actions',
    'app/constants/progress-constants',
    'app/constants/global-constants',
    'app/actions/initialize-machine',
    'app/actions/beambox/preview-mode-background-drawer',
    'app/actions/beambox/preview-mode-controller',
    'app/actions/beambox/svgeditor-function-wrapper',
    'app/actions/beambox/bottom-right-funcs',
    'app/actions/beambox/beambox-preference',
    'app/actions/beambox/constant',
], function (
    $,
    i18n,
    appSettings,
    Discover,
    DeviceMaster,
    checkDeviceStatus,
    checkFirmware,
    VersionChecker,
    firmwareUpdater,
    FirmwareVersionChecker,
    sprintf,
    CloudApi,
    OutputError,
    ClassNames,
    DeviceConstants,
    AboutBeamStudio,
    Alert,
    AlertConstants,
    AlertActions,
    AlertStore,
    DialogCaller,
    GlobalActions,
    GlobalStore,
    TopmenuStore,
    BeamboxActions,
    DeviceList,
    ProgressActions,
    ProgressConstants,
    GlobalConstants,
    InitializeMachine,
    PreviewModeBackgroundDrawer,
    PreviewModeController,
    FnWrapper,
    BottomRightFuncs,
    BeamboxPreference,
    Constant
) {
    'use strict';
    const React = require('react');

    if (window["electron"]) {
        var { ipc, events } = window.electron;
    } else {
        const EM = require('events');
        var ipc = new EM();
        var events = {};
    }

    return function (args) {
        args = args || {};
        var _id = 'TopMenu',
            lang = args.state.lang,

            getLog = async function (printer, log) {
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
                        lang.device.download_log_canceled : lang.device.download_log_error;
                    Alert.popUp({
                        type: AlertConstants.SHOW_POPUP_INFO,
                        message: msg
                    });
                });
            },

            executeFirmwareUpdate = function (printer, type) {
                //var currentPrinter = discoverMethods.getLatestPrinter(printer),
                var currentPrinter = printer,
                    checkToolheadFirmware = function () {
                        var $deferred = $.Deferred();

                        ProgressActions.open(ProgressConstants.NONSTOP, lang.update.checkingHeadinfo);

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
                                caption = lang.update.firmware.latest_firmware.caption,
                                message = lang.update.firmware.latest_firmware.message;

                            if ('toolhead' === type) {
                                latestVersion = currentPrinter.toolhead_version;
                                caption = lang.update.toolhead.latest_firmware.caption;
                                message = lang.update.toolhead.latest_firmware.message;
                            }

                            if (!response.needUpdate) {
                                Alert.popUp({
                                    id: 'latest-firmware',
                                    message: message + ' (v' + latestVersion + ')',
                                    caption,
                                    buttonType: AlertConstants.CUSTOM_CANCEL,
                                    buttonLabels: lang.update.firmware.latest_firmware.still_update,
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
                                    message: lang.monitor.cant_get_toolhead_version
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
                                    message: lang.monitor.cant_get_toolhead_version
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

                        ProgressActions.open(ProgressConstants.NONSTOP, lang.update.preparing);
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
                        message: lang.message.connectionTimeout
                    });
                });
            };

        const registerAllDeviceMenuClickEvents = () => {

            window.menuEventRegistered = true;

            const showPopup = async (currentPrinter, type) => {

                const allowPause = await FirmwareVersionChecker.check(currentPrinter, 'OPERATE_DURING_PAUSE');
                const status = await checkDeviceStatus(currentPrinter, allowPause);
                switch (status) {
                    case 'ok':
                        if (type === 'SET_TEMPERATURE') {
                            AlertActions.showHeadTemperature(currentPrinter);
                        }
                        else {
                            AlertActions.showChangeFilament(currentPrinter);
                        }
                        break;
                    case 'auth':
                        let callback = {
                            onSuccess: function () {
                                AlertActions.showChangeFilament(currentPrinter);
                            },
                            onError: function () {
                                InputLightboxActions.open('auth-device', {
                                    type: InputLightboxConstants.TYPE_PASSWORD,
                                    caption: lang.select_printer.notification,
                                    inputHeader: lang.select_printer.please_enter_password,
                                    confirmText: lang.select_printer.submit,
                                    onSubmit: function (password) {
                                        _auth(printer.uuid, password, {
                                            onError: function (response) {
                                                var message = (
                                                    false === response.reachable ?
                                                        lang.select_printer.unable_to_connect :
                                                        lang.select_printer.auth_failure
                                                );
                                                Alert.popUp({
                                                    id: 'device-auth-fail',
                                                    type: AlertConstants.SHOW_POPUP_ERROR,
                                                    message: message
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        };
                        _auth(currentPrinter.uuid, '', callback);
                        break;
                }
            };

            ipc.on(events.MENU_CLICK, (e, menuItem) => {
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
                    //DialogCaller.showDiodeCalibration(device);
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
                    ipc.send(events.SET_AS_DEFAULT, device);
                };

                _action['BUG_REPORT'] = () => {
                    OutputError();
                };

                _action['SIGN_IN'] = () => {
                    location.hash = '#studio/cloud/sign-in';
                };

                _action['SIGN_OUT'] = () => {
                    CloudApi.signOut().then(() => {
                        location.hash = '#studio/cloud/sign-in';
                    });
                };

                _action['MY_ACCOUNT'] = () => {
                    location.hash = '#studio/cloud/bind-machine';
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

        const unregisterEvents = () => {
            let { ipc, events } = window.electron;
            ipc.removeAllListeners(events.MENU_CLICK);
        };

        if (!window.menuEventRegistered) {
            registerAllDeviceMenuClickEvents();
        }
        // registerMenuItemClickEvents();
        class TopMenu extends React.Component{
            constructor(props){
                super(props);
                this.state = {
                    sourceId: '',
                    deviceList: [],
                    refresh: '',
                    showDeviceList: false,
                    customText: '',
                    fcode: {},
                    previewUrl: ''
                };
                this._waitForPrinters = this._waitForPrinters.bind(this);
                this._toggleDeviceList = this._toggleDeviceList.bind(this);
                this._toggleDeviceListBind = this._toggleDeviceList.bind(this, false);
                this._openAlertWithnoPrinters = this._openAlertWithnoPrinters.bind(this);
                this._handleExportClick = this._handleExportClick.bind(this);
            }

            componentDidMount() {
                //AlertStore.onCancel(this._toggleDeviceListBind);
                AlertStore.onRetry(this._waitForPrinters);
                GlobalStore.onMonitorClosed(this._toggleDeviceListBind);
                TopmenuStore.onUpdateTopMenu(() => {this.setState(this.state)});
            }

            componentWillUnmount() {
                //AlertStore.removeCancelListener(this._toggleDeviceListBind);
                AlertStore.removeRetryListener(this._waitForPrinters);
                GlobalStore.removeMonitorClosedListener(this._toggleDeviceListBind);
                TopmenuStore.removeUpdateTopMenuListener(() => {this.setState(this.state)});
                // unregisterEvents();
            }

            _waitForPrinters() {
                setTimeout(this._openAlertWithnoPrinters, 5000);
            }

            _openAlertWithnoPrinters() {
                if (0 === this.state.deviceList.length && true === this.state.showDeviceList) {
                    if (location.hash === '#studio/beambox') {
                        Alert.popUp({
                            id: 'no-printer',
                            message: lang.device_selection.no_beambox,
                            buttonType: AlertConstants.RETRY_CANCEL,
                            onRetry: () => {this._waitForPrinters()}
                        });
                    } else {
                        Alert.popUp({
                            id: 'no-printer',
                            message: lang.device_selection.no_printers,
                            buttonType: AlertConstants.RETRY_CANCEL,
                            onRetry: () => {this._waitForPrinters()}
                        });
                    }
                }
            }

            _toggleDeviceList(open) {
                this.setState({
                    showDeviceList: open
                });

                if (open) {
                    this._waitForPrinters();
                }
            }

            _handleNavigation(address) {
                if (-1 < appSettings.needWebGL.indexOf(address) && false === detectWebgl()) {
                    Alert.popUp({
                        message: lang.support.no_webgl,
                        type: AlertConstants.SHOW_POPUP_ERROR,
                    });
                }
                else {
                    if (location.hash.indexOf('beambox') > 0 && address !== 'beambox') {
                        FnWrapper.clearSelection();
                        PreviewModeController.end();
                        PreviewModeBackgroundDrawer.clear();
                    }

                    location.hash = '#studio/' + address;
                }
            }

            async _handleExportClick() {
                const self = this;
                const refreshOption = function (devices) {
                    self.setState({
                        deviceList: devices
                    });
                };

                if (PreviewModeController.isPreviewMode()) {
                    await PreviewModeController.end();
                }

                const layers = $('#svgcontent > g.layer').toArray();
                const dpi = BeamboxPreference.read('engrave_dpi');

                const isPowerTooHigh = layers.some((layer) => {
                    const strength = Number(layer.getAttribute('data-strength'));
                    const diode = Number(layer.getAttribute('data-diode'));
                    return strength > 80 && diode !== 1;
                });
                const imageElems = document.querySelectorAll('image');
                let isSpeedTooHigh = false;
                for (let i = 1; i < imageElems.length; i++) {
                    if (imageElems[i].getAttribute('data-shading') === 'true' && (
                            (dpi === 'medium' && imageElems[i].parentNode.getAttribute('data-speed') > 135) ||
                            (dpi === 'high' && imageElems[i].parentNode.getAttribute('data-speed') > 90)
                    )) {
                        isSpeedTooHigh = true;
                        break;
                    }
                }

                let isTooFastForPath = false;
                const tooFastLayers = [];
                for (let i = 0; i < layers.length; ++i) {
                    const layer = layers[i];
                    if (layer.getAttribute('data-speed') > 20 && layer.getAttribute('display') !== 'none') {
                        const paths = $(layer).find('path, rect, ellipse, polygon, line');
                        for (let j = 0; j < paths.length; j++) {
                            const path = paths[j],
                                  fill = $(path).attr('fill'),
                                  fill_op = $(path).attr('fill-opacity');
                            if (!fill || fill === 'none' || fill === '#FFF' || fill === '#FFFFFF' || fill_op === 0) {
                                isTooFastForPath = true;
                                tooFastLayers.push(svgCanvas.getCurrentDrawing().getLayerName(i));
                                break;
                            }
                        }
                    }
                }

                if (isPowerTooHigh && isSpeedTooHigh) {
                    Alert.popUp({
                        message: lang.beambox.popup.both_power_and_speed_too_high,
                        type: AlertConstants.SHOW_POPUP_WARNING,
                    });
                } else if (isPowerTooHigh) {
                    Alert.popUp({
                        message: lang.beambox.popup.power_too_high_damage_laser_tube,
                        type: AlertConstants.SHOW_POPUP_WARNING,
                    });
                } else if (isSpeedTooHigh) {
                    Alert.popUp({
                        message: lang.beambox.popup.speed_too_high_lower_the_quality,
                        type: AlertConstants.SHOW_POPUP_WARNING,
                    });
                } else if (isTooFastForPath) {
                    if (BeamboxPreference.read('vector_speed_contraint') === false) {
                        Alert.popUp({
                            message: lang.beambox.popup.too_fast_for_path,
                            type: AlertConstants.SHOW_POPUP_WARNING,
                        });
                    } else {
                        let message = sprintf(lang.beambox.popup.too_fast_for_path_and_constrain, tooFastLayers.join(', '));
                        Alert.popUp({
                            message,
                            type: AlertConstants.SHOW_POPUP_WARNING,
                        });
                    }
                        
                }

                Discover(
                    'top-menu',
                    function (machines) {
                        //machines = Object.values(machines).filter(m => ['fbm1', 'fbb1b', 'fbb1p', 'laser-b1'].includes(m.model));
                        machines = DeviceList(machines);
                        refreshOption(machines);
                    }
                );

                this._toggleDeviceList(!this.state.showDeviceList);
            }

            async _handleSelectDevice(device, e) {
                const self = this;
                ProgressActions.open(ProgressConstants.NONSTOP_WITH_MESSAGE, lang.initialize.connecting);
                device = DeviceMaster.usbDefaultDeviceCheck(device);
                AlertStore.removeCancelListener(this._toggleDeviceList);
                const currentWorkarea = BeamboxPreference.read('workarea') || BeamboxPreference.read('model');
                const allowedWorkareas = Constant.allowedWorkarea[device.model];
                if (currentWorkarea && allowedWorkareas) {
                    if (!allowedWorkareas.includes(currentWorkarea)) {
                        ProgressActions.close();
                        this._toggleDeviceList(false);
                        Alert.popUp({
                            id: 'workarea unavailable',
                            message: lang.message.unavailableWorkarea,
                            type: AlertConstants.SHOW_POPUP_ERROR,
                        })
                        return;
                    }
                }
                DeviceMaster.selectDevice(device).then(function (status) {
                    if (status === DeviceConstants.CONNECTED) {
                        const next = () => {
                            ProgressActions.close();
                            self._onSuccessConnected(device, e);
                        }
                        ProgressActions.open(ProgressConstants.NONSTOP);
                        checkDeviceStatus(device).then(next);
                    }
                    else if (status === DeviceConstants.TIMEOUT) {
                        ProgressActions.close();
                        Alert.popUp({
                            id: _id,
                            message: lang.message.connectionTimeout,
                            type: AlertConstants.SHOW_POPUP_ERROR,
                        });
                    }
                })
                    .fail(function (status) {
                        ProgressActions.close();
                        Alert.popUp({
                            id: 'fatal-occurred',
                            message: status,
                            type: AlertConstants.SHOW_POPUP_ERROR,
                        });
                    });
                this._toggleDeviceList(false);

            }

            async _onSuccessConnected(device, e) {
                //export fcode
                if (device === 'export_fcode') {
                    BottomRightFuncs.exportFcode();
                    this.setState({ showDeviceList: false});
                    return;
                }
                // Regular machine
                e.preventDefault();
                // Check firmware
                const vc = VersionChecker(device.version);
                if (!vc.meetRequirement('USABLE_VERSION')) {
                    console.error('Not a valid firmware version');
                    Alert.popUp({
                        id: 'fatal-occurred',
                        message: lang.beambox.popup.should_update_firmware_to_continue,
                        type: AlertConstants.SHOW_POPUP_ERROR,
                    });
                    this.setState({ showDeviceList: false });
                    return;
                } else {
                    this.setState({ showDeviceList: false });
                    BottomRightFuncs.uploadFcode(device);
                }
            }

            _handleMonitorClose() {
                this.setState({
                    showMonitor: false
                });
            }

            _handleContextMenu(event) {
                electron && electron.ipc.send("POPUP_MENU_ITEM", { x: event.screenX, y: event.screenY }, {});
            }

            _renderDeviceList() {
                var status = lang.machine_status,
                    headModule = lang.head_module,
                    statusText,
                    headText,
                    progress,
                    deviceList = this.state.deviceList,
                    options = deviceList.map(function (device) {
                        statusText = status[device.st_id] || status.UNKNOWN;
                        headText = headModule[device.head_module] || headModule.UNKNOWN;

                        if (device.st_prog === 0) {
                            progress = '';
                        }
                        else if (16 === device.st_id && 'number' === typeof device.st_prog) {
                            progress = (parseInt(device.st_prog * 1000) * 0.1).toFixed(1) + '%';
                        }
                        else {
                            progress = '';
                        }

                        let img = `img/icon_${device.source === 'h2h' ? 'usb' : 'wifi'}.svg`;

                        return (
                            <li
                                key={device.uuid}
                                name={device.uuid}
                                onClick={this._handleSelectDevice.bind(this, device)}
                                data-test-key={device.serial}
                            >
                                <label className="name">{device.name}</label>
                                <label className="status">{headText} {statusText}</label>
                                <label className="progress">{progress}</label>
                                <label className="connection-type">
                                    <div className="type">
                                        <img src={img} />
                                    </div>
                                </label>
                            </li>
                        );
                    }, this),
                    list;

                list = (
                    0 < options.length
                        ? options :
                        [<div key="spinner-roller" className="spinner-roller spinner-roller-reverse" />]
                );

                return (
                    <ul>{list}</ul>
                );
            }

            _renderTopDropDown(id, label) {
                const labelFunctionMap = {
                    'align-h': [
                        {id: 'align-l', label: lang.topbar.left_align, f: () => {FnWrapper.alignLeft();}},
                        {id: 'align-h', label: lang.topbar.center_align, f: () => {FnWrapper.alignCenter();}},
                        {id: 'align-r', label: lang.topbar.right_align, f: () => {FnWrapper.alignRight();}}
                    ],
                    'align-v': [
                        {id: 'align-t', label: lang.topbar.top_align, f: () => {FnWrapper.alignTop();}},
                        {id: 'align-v', label: lang.topbar.middle_align, f: () => {FnWrapper.alignMiddle();}},
                        {id: 'align-b', label: lang.topbar.bottom_align, f: () => {FnWrapper.alignBottom();}}
                    ],
                };
                let fns = labelFunctionMap[id];
                let items = [];
                const _setTopDropDownPosition = function() {
                    $('.top-dropdown-control').hover(function() {
                        const l = $(this).position().left;
                        $(this).children('.top-dropdown-content').css({left: `${l}px`});
                    })
                };
                for (let i = 0; i < fns.length; ++i) {
                    items.push(this._renderTopBtn(fns[i].id, fns[i].label, fns[i].f));
                }
                const disabled = !this.topButtonAvailability[id];
                return (
                    <div className={ClassNames('top-btn top-dropdown-control', process.platform, {disabled})} onMouseEnter={() => {_setTopDropDownPosition()}}>
                        <img src={`img/top-menu/icon-${id}.svg`} onError={(e)=>{e.target.onerror = null; e.target.src=`img/top-menu/icon-${id}.png`}} />
                        <div className="btn-label">
                            {label}
                        </div>
                        <div className="top-dropdown-content">
                            <div className="arrowup "></div>
                            <div className="dropdown-block">
                                {items}
                            </div>
                        </div>
                    </div>
                );

            }

            _renderTopBtn(id, label, onClick) {
                const disabled = !this.topButtonAvailability[id];
                if(disabled) onClick = () => {};
                return (
                    <div className={ClassNames('top-btn', process.platform, {disabled})} key={id} onClick={() => {
                        onClick();
                        this.setState(this.state);
                    }}>
                        <img src={`img/top-menu/icon-${id}.svg`} onError={(e)=>{e.target.onerror = null; e.target.src=`img/top-menu/icon-${id}.png`}} />
                        <div className="btn-label">
                            {label}
                        </div>
                    </div>
                );
            }

            _renderZoomBtn(id, label, onClick) {
                return (
                    <div className={ClassNames('top-btn zoom', process.platform)} onClick={onClick} key={id}>
                        <img src={`img/top-menu/icon-${id}.svg`} onError={(e)=>{e.target.onerror = null; e.target.src=`img/top-menu/icon-${id}.png`}} />
                        <div className="btn-label">
                            {label}
                        </div>
                    </div>
                );
            }

            _renderScrollCue() {
                const topbtns = $('.top-btns')
                const containerWidth = 1000;
                const left_space = topbtns.scrollLeft();
                const right_space = containerWidth - left_space - topbtns.width();
                const startScroll = (v) => {
                    const f = (v) => {
                        $('.top-btns').scrollLeft($('.top-btns').scrollLeft() + v);
                    }
                    this.interval = setInterval(f, 15, v);
                }
                const endScroll = () => {
                    clearInterval(this.interval);
                }
                const left_scroll_cue = (<div className="top-scroll-cue" onMouseEnter={() => {startScroll.bind(this)(-5)}} onMouseLeave={endScroll.bind(this)}>
                    {left_space > 30 ? <img src="img/top-menu/icon-cue-left.svg"/> : null}
                </div>
                );
                const right_scroll_cue = (<div className="top-scroll-cue" onMouseEnter={() => {startScroll.bind(this)(5)}} onMouseLeave={endScroll.bind(this)}>
                    {right_space > 30 ? <img src="img/top-menu/icon-cue-right.svg"/> : null}
                </div>
                );
                return {left_scroll_cue, right_scroll_cue};
            }

            _renderFileTitle () {
                if (process.platform === 'win32') {
                    return null;
                } else {
                    let fileTitle;
                    try {
                        fileTitle = svgCanvas.currentFileName;
                    } catch (e) {
                    }
                    fileTitle = fileTitle || lang.topbar.untitled;
                    return (
                        <div className="file-title">
                            {fileTitle}
                        </div>
                    );
                }
            }

            _checkButtonAvailable() {
                let selectedElements = null;
                try {
                    selectedElements = svgCanvas.getSelectedElems().filter((elem) => elem);
                    if (selectedElements.length > 0 && selectedElements[0].getAttribute('data-tempgroup') === 'true') {
                        selectedElements = Array.from(selectedElements[0].childNodes);
                    }
                } catch (e) {
                    if (e instanceof ReferenceError) {
                    } else {
                        throw e;
                    }
                }
                this.topButtonAvailability = {
                    'zoom': true,
                    'group': (selectedElements && selectedElements.length > 0),
                    'ungroup': (selectedElements && selectedElements.length === 1 && ['g', 'a', 'use'].includes(selectedElements[0].tagName)),
                    'align-h': (selectedElements && selectedElements.length > 0),
                    'align-l': (selectedElements && selectedElements.length > 0),
                    'align-r': (selectedElements && selectedElements.length > 0),
                    'align-v': (selectedElements && selectedElements.length > 0),
                    'align-t': (selectedElements && selectedElements.length > 0),
                    'align-b': (selectedElements && selectedElements.length > 0),
                    'dist-h': (selectedElements && selectedElements.length > 1),
                    'dist-v': (selectedElements && selectedElements.length > 1),
                    'union': (selectedElements && selectedElements.length > 1 && selectedElements.every(elem => ['rect', 'path', 'polygon', 'ellipse', 'line'].includes(elem.tagName))),
                    'subtract': (selectedElements && selectedElements.length === 2 && selectedElements.every(elem => ['rect', 'path', 'polygon', 'ellipse', 'line'].includes(elem.tagName))),
                    'intersect': (selectedElements && selectedElements.length > 1 && selectedElements.every(elem => ['rect', 'path', 'polygon', 'ellipse', 'line'].includes(elem.tagName))),
                    'difference': (selectedElements && selectedElements.length > 1 && selectedElements.every(elem => ['rect', 'path', 'polygon', 'ellipse', 'line'].includes(elem.tagName))),
                    'h-flip': (selectedElements && selectedElements.length > 0),
                    'v-flip': (selectedElements && selectedElements.length > 0),
                }
            }

            render() {
                let deviceList = this._renderDeviceList(),
                    menuClass,
                    topClass;

                let {left_scroll_cue, right_scroll_cue}  = this._renderScrollCue();
                let lang = i18n.get();
                let barTitle = lang.topbar.titles[this.props.page] || this.props.page;

                menuClass = ClassNames('menu', { show: this.state.showDeviceList });
                if (!this.props.show) {
                    return (
                        <div className="title">
                            {barTitle}
                        </div>
                    );
                }

                this._checkButtonAvailable();

                return (
                    <div>
                        {left_scroll_cue}
                        <div className="top-btns" onScroll={()=>{this.setState(this.state)}}>
                            <div className="top-btn-container">
                                <div className="top-controls zoom-controls">
                                    {this._renderZoomBtn('zoomout', 'out', ()=>{svgEditor.zoomOut()})}
                                    {this._renderTopBtn('zoom', lang.topbar.zoom, ()=>{svgEditor.resetView()})}
                                    {this._renderZoomBtn('zoomin', 'in', ()=>{svgEditor.zoomIn()})}
                                </div>
                                <div className="top-controls group-controls">
                                    {this._renderTopBtn('group', lang.topbar.group, () => {FnWrapper.groupSelected();})}
                                    {this._renderTopBtn('ungroup', lang.topbar.ungroup, () => {FnWrapper.ungroupSelected();})}
                                </div>
                                <div className="top-controls align-controls">
                                    {this._renderTopDropDown('align-h', lang.topbar.halign)}
                                    {this._renderTopDropDown('align-v', lang.topbar.valign)}
                                    {this._renderTopBtn('dist-h', lang.topbar.hdist, () => {FnWrapper.distHori();})}
                                    {this._renderTopBtn('dist-v', lang.topbar.vdist, () => {FnWrapper.distVert();})}
                                </div>
                                <div className="top-controls clip-controls">
                                    {this._renderTopBtn('union', lang.topbar.union, () => {FnWrapper.booleanUnion();})}
                                    {this._renderTopBtn('subtract', lang.topbar.subtract, () => {FnWrapper.booleanDifference();})}
                                    {this._renderTopBtn('intersect', lang.topbar.intersect, () => {FnWrapper.booleanIntersect();})}
                                    {this._renderTopBtn('difference', lang.topbar.difference, () => {FnWrapper.booleanXor();})}
                                </div>

                                <div className="top-controls flip-controls">
                                    {this._renderTopBtn('h-flip', lang.topbar.hflip, () => {FnWrapper.flipHorizontal();})}
                                    {this._renderTopBtn('v-flip', lang.topbar.vflip, () => {FnWrapper.flipVertical();})}
                                </div>
                            </div>
                        </div>
                        {right_scroll_cue}
                        {this._renderFileTitle()}

                        <div title={lang.print.deviceTitle} className={`device ${process.platform}`}>
                            <div className="device-icon" onClick={this._handleExportClick.bind(this)}>
                                <img src="img/top-menu/icon-export.svg" draggable="false" />
                                <div>{lang.topbar.export}</div>
                            </div>
                            <div className={menuClass}>
                                <div className="arrow arrow-right" />
                                <div className="device-list">
                                    {deviceList}
                                </div>
                            </div>
                        </div>
                        <AboutBeamStudio/>
                    </div>
                );
            }

        };

        TopMenu.defaultProps = {
            show: true,
            page: ''
        };

        return TopMenu;
    };
});
