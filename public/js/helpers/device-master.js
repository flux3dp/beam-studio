define([
    'jquery',
    'helpers/i18n',
    'helpers/sprintf',
    'app/contexts/AlertCaller',
    'app/constants/alert-constants',
    'app/actions/alert-actions',
    'app/actions/beambox',
    'app/contexts/ProgressCaller',
    'app/actions/input-lightbox-actions',
    'app/constants/device-constants',
    'helpers/api/control',
    'helpers/api/3d-scan-control',
    'helpers/usb-checker',
    'helpers/api/touch',
    'helpers/api/discover',
    'helpers/api/config',
    'app/actions/global-actions',
    'app/constants/input-lightbox-constants',
    'helpers/device-list',
    'helpers/api/camera',
    'helpers/api/simple-websocket',
    'helpers/socket-master',
    'helpers/device-error-handler',
    'helpers/version-checker',
    'helpers/array-findindex',
], function (
    $,
    i18n,
    sprintf,
    Alert,
    AlertConstants,
    AlertActions,
    BeamboxActions,
    Progress,
    InputLightboxActions,
    DeviceConstants,
    DeviceController,
    ScanController,
    UsbChecker,
    Touch,
    Discover,
    Config,
    GlobalActions,
    InputLightBoxConstants,
    DeviceList,
    Camera,
    SimpleWebsocket,
    Sm,
    DeviceErrorHandler,
    VersionChecker
) {


    let lang = i18n.get(),
        SocketMaster,
        defaultPrinter,
        defaultPrinterWarningShowed = false,
        _instance = null,
        _stopChangingFilament = false,
        _stopChangingFilamentCallback,
        _selectedDevice = {},
        _deviceNameMap = {},
        _controllerMap = {},
        _device,
        _wasKilled = false,
        usbDeviceReport = {},
        _devices = [],
        _availableDevices = [],
        _errors = {},
        availableUsbChannel = -1,
        usbEventListeners = {},
        self = this;

    // Better select device
    function select(device, opts) {
        let d = $.Deferred();
        selectDevice(device).then((result) => {
            if (result == DeviceConstants.CONNECTED) {
                d.resolve(DeviceConstants.CONNECTED);
            } else {
                d.reject(lang.message.connectionTimeout);
            }
        }, (error) => {
            console.error('Selection error in DeviceMaster. Should handle error here', error);
        }).fail(() => {
            d.reject();
        });

        return d.promise();
    }

    // Deprecated!
    function selectDevice(device, deferred) {
        const goAuth = (uuid) => {
            _selectedDevice = {};

            const handleSubmit = (password) => {
                auth(device.uuid, password).done((data) => {
                    device.plaintext_password = password;
                    selectDevice(device, d);
                })
                    .fail((response) => {
                        let message = (
                            false === response.reachable ?
                                lang.select_printer.unable_to_connect :
                                lang.select_printer.auth_failure
                        );

                        goAuth(device.uuid);

                        Alert.popUp({
                            id: 'device-auth-fail',
                            message: `#811 ${message}`,
                            type: AlertConstants.SHOW_POPUP_ERROR
                        });
                    });
            };

            const callback = {
                caption: sprintf(lang.input_machine_password.require_password, _device.name),
                inputHeader: lang.input_machine_password.password,
                confirmText: lang.input_machine_password.connect,
                type: InputLightBoxConstants.TYPE_PASSWORD,
                onSubmit: handleSubmit
            };

            InputLightboxActions.open('auth', callback);
        };
        const createDeviceController = (uuid, availableUsbChannel = -1, success) => {
            return DeviceController(device.uuid, {
                availableUsbChannel: availableUsbChannel,
                onConnect: function (response, options) {
                    d.notify(response);

                    if (response.status.toUpperCase() === DeviceConstants.CONNECTED) {
                        if (options == null || (options && !options.dedicated)) {
                            Progress.popById('select-device');
                        }
                        let exist = _devices.some(dev => { return dev.uuid === device.uuid; });
                        if (!exist) {
                            _devices.push(device);
                        }
                        success(true);
                    }
                },
                onError: function (response) {
                    console.log('createDeviceController onError', response);
                    Progress.popById('select-device');
                    // TODO: shouldn't do replace
                    response.error = response.error.replace(/^.*\:\s+(\w+)$/g, '$1');
                    switch (response.error.toUpperCase()) {
                        case DeviceConstants.TIMEOUT:
                            // TODO d.reject, come on...
                            d.reject(DeviceConstants.TIMEOUT);
                            break;
                        case DeviceConstants.AUTH_ERROR:
                        case DeviceConstants.AUTH_FAILED:
                            _selectedDevice = {};

                            if (device.password) {
                                goAuth(_device.uuid);
                            }
                            else {
                                auth(_device.uuid, '').done((data) => {
                                    selectDevice(device, d);
                                })
                                    .fail(() => {
                                        Alert.popUp({
                                            id: 'auth-error-with-diff-computer',
                                            message: lang.message.auth_error,
                                            type: AlertConstants.SHOW_POPUP_ERROR
                                        });
                                    });
                            }
                            break;
                        case DeviceConstants.MONITOR_TOO_OLD:
                            Alert.popUp({
                                id: 'fatal-occurred',
                                message: lang.message.monitor_too_old.content,
                                caption: lang.message.monitor_too_old.caption,
                                type: AlertConstants.SHOW_POPUP_ERROR
                            });
                            break;
                        case DeviceConstants.NOT_FOUND:
                            if (_devices.some(d => d.serial === device.serial)) {
                                success(false);
                                return;
                            }

                            success(false);
                            Alert.popUp({
                                id: 'not-found',
                                message: `#831 ${lang.message.unable_to_find_machine}`,
                                type: AlertConstants.SHOW_POPUP_ERROR
                            });
                            break;
                        case DeviceConstants.DISCONNECTED:
                            if (_devices.some(d => d.serial === device.serial)) {
                                success(false);
                                return;
                            }

                            success(false);
                            Alert.popUp({
                                id: 'disconnected',
                                message: `#832 ${lang.message.disconnected}`,
                                type: AlertConstants.SHOW_POPUP_ERROR
                            });
                            break;
                        default:
                            let message = lang.message.unknown_error;

                            if (response.error === 'UNKNOWN_DEVICE') {
                                message = lang.message.unknown_device;
                            }

                            success(false);
                            Alert.popUp({
                                id: 'unhandle-exception',
                                message: `#821 ${message}`,
                                type: AlertConstants.SHOW_POPUP_ERROR
                            });
                    }
                },
                onFatal: function (response) {
                    console.log('createDeviceController onFatal', response);
                    Progress.popById('select-device');
                    // process fatal
                    if (!_wasKilled) {
                        _selectedDevice = {};
                        _wasKilled = false;
                    }

                    const removeTimedOutConnection = (uuid) => {
                        let newConnectedDevice = [];
                        _devices.forEach(d => {
                            if (d.uuid != uuid) {
                                newConnectedDevice.push(d);
                            }
                        });
                        _devices = newConnectedDevice;
                    };

                    removeTimedOutConnection(availableUsbChannel);

                    if (response.reason === 'error [\'KICKED\']') {
                        BeamboxActions.resetPreviewButton();
                    }
                }
            });
        };
        const initSocketMaster = () => {
            if (device && typeof _controllerMap[device.uuid] !== 'undefined') {
                _device.controller = _controllerMap[device.uuid];
                return;
            }

            SocketMaster = new Sm();
            SocketMaster.onTimeout(handleSMTimeout);

            //*******************************************************************
            // just for backup, can be delete if everything is fine
            // if usb not detected but device us using usb
            if (
                typeof self !== 'undefined' &&
                    !_devices.some(d => d.addr === device.addr) &&
                    // self.availableUsbChannel === -1 &&
                    device.source === 'h2h'
            ) {
                device = getDeviceBySerialFromAvailableList(device.serial, false);
            }
            //********************************************************************/

            // if availableUsbChannel has been defined
            if (
                typeof self !== 'undefined' &&
                    typeof self.availableUsbChannel !== 'undefined' &&
                    device.source === 'h2h'
            ) {
                _device.controller = createDeviceController(null, this.availableUsbChannel, (success) => {
                    console.log('_device.controller', _device.controller);
                    console.log('success', success);
                    if (success) {
                        d.resolve(DeviceConstants.CONNECTED);
                    }
                    else {
                        // createDeviceController will auto reject with errors
                    }
                });
            }
            else {
                _device.controller = createDeviceController(device.uuid, null, (success) => {
                    if (success) {
                        d.resolve(DeviceConstants.CONNECTED);
                    }
                    else {
                        // if default device wifi is not available, we use usb
                        // if(_device.serial === self.usbProfile.serial) {
                        let foundDevice;
                        _devices.forEach(d => {
                            if (d.source === 'h2h' && d.serial === _device.serial) {
                                console.log('found usb version', d);
                                foundDevice = d;
                            }
                        });
                        console.log('foundDevice', foundDevice);
                        if (foundDevice) {
                            foundDevice.uuid = foundDevice.addr;
                            foundDevice.name = foundDevice.nickname;
                            d.resolve(DeviceConstants.CONNECTED, foundDevice);
                        }
                        else {
                            console.log('create device action failed');
                            d.resolve();
                        }
                    }
                });
            }

            _controllerMap[device.uuid] = _device.controller;
            SocketMaster.setWebSocket(_device.controller);
        };

        let d = deferred || $.Deferred();

        if (device) {
        // Match the device from the newest received device list
            let latestDevice = _availableDevices.filter(d => d.serial === device.serial && d.source === device.source),
                self = this;

            Object.assign(_selectedDevice, latestDevice[0]);

            if (_existConnection(device.uuid, device.source)) {
                _device = _switchDevice(device.uuid);
                SocketMaster.setWebSocket(_controllerMap[device.uuid]);
                d.resolve(DeviceConstants.CONNECTED);
            }
            else {
                Progress.openNonstopProgress({
                    id: 'select-device',
                    message: sprintf(lang.message.connectingMachine, device.name),
                    timeout: 30000,
                });
                _device = {
                    uuid: device.uuid,
                    source: device.source,
                    name: device.name,
                    serial: device.serial
                };
                delete _controllerMap[device.uuid];
            }

            initSocketMaster();
        }

        return d.promise();
    }

    function auth(uuid, password) {
        Progress.openNonstopProgress({
            id: 'device-master-auth',
            message: lang.message.authenticating,
            timeout: 30000,
        });

        let d = $.Deferred(),
            opts = {
                onError: function (data) {
                    Progress.popById('device-master-auth');
                    d.reject(data);
                },
                onSuccess: function (data) {
                    Progress.popById('device-master-auth');
                    d.resolve(data);
                },
                onFail: function (data) {
                    Progress.popById('device-master-auth');
                    d.reject(data);
                }
            };

        Touch(opts).send(uuid, password);

        return d.promise();
    }

    function reconnectWs() {
        let d = $.Deferred();
        _device.controller = DeviceController(_selectedDevice.uuid, {
            availableUsbChannel: _selectedDevice.source === 'h2h' ? _selectedDevice.addr : -1,
            onConnect: function (response) {
                d.notify(response);

                if (response.status.toUpperCase() === DeviceConstants.CONNECTED) {
                    d.resolve(DeviceConstants.CONNECTED);
                }
            },
            onError: function (response) {
                // TODO: shouldn't do replace
                response.error = response.error.replace(/^.*\:\s+(\w+)$/g, '$1');
                switch (response.error.toUpperCase()) {
                    case DeviceConstants.TIMEOUT:
                        d.resolve(DeviceConstants.TIMEOUT);
                        break;
                    case DeviceConstants.AUTH_ERROR:
                    case DeviceConstants.AUTH_FAILED:
                        if (device.password) {
                            goAuth(_device.uuid);
                        }
                        else {
                            auth(_device.uuid, '').then((data) => {
                                selectDevice(device, d);
                            }).fail(() => {
                                Alert.popUp({
                                    id: 'auth-error-with-diff-computer',
                                    message: lang.message.auth_error,
                                    type: AlertConstants.SHOW_POPUP_ERROR
                                });
                            });
                        }
                        break;
                    case DeviceConstants.MONITOR_TOO_OLD:
                        Alert.popUp({
                            id: 'auth-error-with-diff-computer',
                            message: lang.message.monitor_too_old.content,
                            caption: lang.message.monitor_too_old.caption,
                            type: AlertConstants.SHOW_POPUP_ERROR
                        });
                        break;
                    default:
                        Alert.popUp({
                            id: 'unhandle-exception',
                            message: lang.message.unknown_error,
                            type: AlertConstants.SHOW_POPUP_ERROR
                        });
                }
            },
            onFatal: function (response) {
                // if channel is not available, (opcode -1),
                // default in createDeviceController will catch first
            }
        });

        SocketMaster = new Sm();
        SocketMaster.onTimeout(handleSMTimeout);
        SocketMaster.setWebSocket(_device.controller);
        return d.promise();
    }

    function handleSMTimeout(status) {
        console.log('=== sm timeout: ', status);
    }

    function uploadToDirectory(data, path, fileName) {
        let d = $.Deferred();

        SocketMaster.addTask('upload', data, path, fileName).then(() => {
            d.resolve();
        }).progress((progress) => {
            d.notify(progress);
        }).fail((error) => {
            d.reject(error);
        });

        return d.promise();
    }

    function go(data) {
        let d = $.Deferred();
        if (!data || !(data instanceof Blob)) {
            d.resolve(DeviceConstants.READY);
        }
        else {
            const handleOk = () => { d.resolve(); };
            const handleProgress = (progress) => { d.notify(progress); };
            const handleError = (error) => {
                d.reject(error);
            };

            SocketMaster.addTask('upload', data).then(() => {
                SocketMaster.addTask('start').then(handleOk).fail(handleError);
            })
                .progress(handleProgress)
                .fail(handleError);

        }

        return d.promise();
    }

    function goFromFile(path, fileName) {
        let d = $.Deferred();
        SocketMaster.addTask('select', path, fileName).then((selectResult) => {
            if (selectResult.status.toUpperCase() === DeviceConstants.OK) {
                SocketMaster.addTask('start').then((startResult) => {
                    d.resolve(startResult);
                }).fail((error) => {
                    d.reject(error);
                });
            }
            else {
                d.resolve({ status: 'error' });
            }
        });
        return d.promise();
    }

    function waitTillCompleted() {
        let d = $.Deferred(),
            statusChanged = false;

        let t = setInterval(() => {
            SocketMaster.addTask('report')
                .then(r => {
                    d.notify(r, t);
                    let { st_id, error } = r.device_status;
                    if (st_id === 64) {
                        clearInterval(t);
                        setTimeout(() => {
                            quit().then(() => {
                                d.resolve();
                            }).fail(() => {
                                d.reject('Quit failed');
                            });
                        }, 2000);
                    } else if ((st_id === 128 || st_id === 48 || st_id === 36) && error && error.length > 0) { // Error occured
                        clearInterval(t);
                        d.reject(error);
                    } else if (st_id === 128) {
                        clearInterval(t);
                        d.reject(error);
                    } else if (st_id === 0) {
                        // Resolve if the status was running and some how skipped the completed part
                        if (statusChanged) {
                            clearInterval(t);
                            d.resolve();
                        }
                    } else {
                        statusChanged = true;
                    }
                });
        }, 2000);

        return d.promise();
    }

    function runBeamboxCameraTest() {
        let d = $.Deferred();

        fetch(DeviceConstants.BEAMBOX_CAMERA_TEST).then(res => res.blob()).then(async blob => {
            const device = getSelectedDevice();
            const vc = VersionChecker(device.version);
            if (vc.meetRequirement('RELOCATE_ORIGIN')) {
                await setOriginX(origin.x);
                await setOriginY(origin.y);
            }
            go(blob)
                .fail(() => {
                    d.reject('UPLOAD_FAILED'); // Error while uploading task
                })
                .then(() => {
                    Progress.openSteppingProgress({id: 'camera-cali-task', message: lang.camera_calibration.drawing_calibration_image});
                    let taskTotalSecs = 30;
                    let elapsedSecs = 0;
                    let progressUpdateTimer = setInterval(() => {
                        elapsedSecs += 0.1;
                        if (elapsedSecs > taskTotalSecs) {
                            clearInterval(progressUpdateTimer);
                            return;
                        }
                        Progress.update('camera-cali-task', {
                            percentage: (elapsedSecs / taskTotalSecs) * 100
                        });
                    }, 100);
                    waitTillCompleted()
                        .fail((err) => {
                            clearInterval(progressUpdateTimer);
                            Progress.popById('camera-cali-task');
                            d.reject(err); // Error while running test
                        })
                        .then(() => {
                            clearInterval(progressUpdateTimer);
                            Progress.popById('camera-cali-task');
                            d.resolve();
                        });

                });
        });

        return d.promise();
    }

    function doDiodeCalibrationCut() {
        let d = $.Deferred();

        fetch(DeviceConstants.DIODE_CALIBRATION).then(res => res.blob()).then(async blob => {
            const device = getSelectedDevice();
            const vc = VersionChecker(device.version);
            if (vc.meetRequirement('RELOCATE_ORIGIN')) {
                await setOriginX(origin.x);
                await setOriginY(origin.y);
            }
            go(blob)
                .fail(() => {
                    d.reject('UPLOAD_FAILED'); // Error while uploading task
                })
                .then(() => {
                    Progress.openSteppingProgress({id: 'diode-cali-task', message: lang.diode_calibration.drawing_calibration_image});
                    let taskTotalSecs = 35;
                    let elapsedSecs = 0;
                    let progressUpdateTimer = setInterval(() => {
                        elapsedSecs += 0.1;
                        if (elapsedSecs > taskTotalSecs) {
                            clearInterval(progressUpdateTimer);
                            return;
                        }

                        Progress.update('diode-cali-task', {
                            percentage: (elapsedSecs / taskTotalSecs) * 100
                        });
                    }, 100);
                    waitTillCompleted()
                        .fail((err) => {
                            clearInterval(progressUpdateTimer);
                            Progress.popById('diode-cali-task');
                            d.reject(err); // Error while running test
                        })
                        .then(() => {
                            clearInterval(progressUpdateTimer);
                            Progress.popById('diode-cali-task');
                            d.resolve();
                        });

                });
        });

        return d.promise();
    }

    function resume() {
        return SocketMaster.addTask('resume')
    }

    function pause() {
        return SocketMaster.addTask('pause');
    }

    function stop() {
        let d = $.Deferred();
        SocketMaster.addTask('abort').then(r => {
            d.resolve(r);
        });
        return d.promise();
    }

    function quit() {
        return SocketMaster.addTask('quit');
    }

    function quitTask(mode) {
        if (typeof mode === 'string') {
            return SocketMaster.addTask('quitTask@' + mode);
        } else {
            return SocketMaster.addTask('quitTask');
        }
    }

    function kick() {
        return SocketMaster.addTask('kick');
    }

    function killSelf() {
        _wasKilled = true;
        let d = $.Deferred();
        _device.controller.killSelf().then(response => {
            d.resolve(response);
        }).always(() => {
            reconnectWs();
        });
        return d.promise();
    }

    function ls(path) {
        return SocketMaster.addTask('ls', path);
    }

    function lsusb() {
        return SocketMaster.addTask('lsusb');
    }

    function downloadLog(log) {
        return _device.controller.downloadLog(log);
    }

    function fileInfo(path, fileName) {
        return SocketMaster.addTask('fileInfo', path, fileName);
    }

    function deleteFile(path, fileName) {
        let fileNameWithPath = `${path}/${fileName}`;
        return SocketMaster.addTask('deleteFile', fileNameWithPath);
    }

    function downloadFile(path, fileName) {
        return SocketMaster.addTask('downloadFile', `${path}/${fileName}`);
    }

    function readyCamera() {
        let d = $.Deferred();
        _device.scanController = ScanController(_device.uuid, {
            availableUsbChannel: this.availableUsbChannel,
            onReady: function () {
                d.resolve('');
            },
            onError: function (error) {
                Alert.popUp({
                    message: error,
                    type: AlertConstants.SHOW_POPUP_ERROR
                });
            }
        });

        return d.promise();
    }

    function changeFilament(type, flexible) {
        _stopChangingFilament = false;
        let d = $.Deferred();

        (async function(){
            await SocketMaster.addTask('enterMaintainMode');

            if (_stopChangingFilament) {
                d.reject({ error: ['CANCEL'] });
                _stopChangingFilamentCallback();
                return;
            }

            await SocketMaster.addTask('maintainHome');

            if (_stopChangingFilament) {
                d.reject({ error: ['CANCEL'] });
                _stopChangingFilamentCallback();
                return;
            }

            await SocketMaster.addTask('changeFilament', type, flexible).progress((response) => {
                if (_stopChangingFilament) {
                    d.reject({ error: ['CANCEL'] });
                    _stopChangingFilamentCallback();
                } else {
                    d.notify(response);
                }
            });

            if (_stopChangingFilament) {
                d.reject({ error: ['CANCEL'] });
                _stopChangingFilamentCallback();
                return;
            }

            d.resolve();
        })().catch(response => d.reject(response));
        return d.promise();
    }

    function stopChangingFilament() {
        let d = $.Deferred();
        _stopChangingFilamentCallback = () => {
            d.resolve();
        };
        _stopChangingFilament = true;
        return d.promise();

    }

    function changeFilamentDuringPause(type) {
        let d = $.Deferred();

        const initOperation = () => {
            return new Promise(resolve => {
                SocketMaster.addTask('startToolheadOperation').then(r => {
                    resolve(r);
                });
            });
        };

        const waitForTemperature = () => {
            return new Promise(resolve => {
                let fluctuation = 3;
                let t = setInterval(() => {
                    SocketMaster.addTask('report').then(r => {
                        d.notify(r, t);
                        let { rt, tt } = r.device_status;
                        if (rt[0] && tt[0]) {
                            let current = Math.round(rt[0]),  // current temperature rounded
                                target = tt[0];              // goal temperature

                            if (
                                current >= target - fluctuation &&  // min
                                    current <= target + fluctuation     // max
                            ) {
                                clearInterval(t);
                                resolve();
                            }
                        };
                    });
                }, 3000);
            });
        };

        const startOperation = () => {
            return new Promise(resolve => {
                SocketMaster.addTask('changeFilamentDuringPause', type).always(r => {
                    resolve(r);
                });
            });
        };

        const endLoading = () => {
            return new Promise(resolve => {
                SocketMaster.addTask('endLoadingDuringPause').always(r => {
                    resolve(r);
                });
            });
        };

        const monitorStatus = () => {
            return new Promise(resolve => {
                let t = setInterval(() => {
                    getReport().then(r => {
                        r.loading = true;
                        // if button is pressed from the machine, status will change from LOAD_FILAMENT to PAUSE
                        if (r.st_label === 'PAUSED' || r.st_label === 'RESUMING') {
                            clearInterval(t);
                            resolve();
                        }
                        else {
                            d.notify(r, t);
                        }
                    });
                }, 2000);
            });
        };

        const operation = async () => {
            await initOperation();
            await waitForTemperature();
            await startOperation();
            await monitorStatus();
            d.resolve();
        };

        operation();

        return d.promise();
    }

    function startToolheadOperation() {
        return SocketMaster.addTask('startToolheadOperation');
    }

    function endToolheadOperation() {
        return SocketMaster.addTask('endToolheadOperation');
    }

    function endLoadingDuringPause() {
        return SocketMaster.addTask('endLoadingDuringPause');
    }

    function detectHead() {
        let d = $.Deferred();

        SocketMaster.addTask('getHeadInfo@maintain').then((response) => {
            response.module ? d.resolve() : d.reject(response);
        }).fail(() => {
            d.reject();
        });

        return d.promise();
    }

    function rawHome() {
        return SocketMaster.addTask('rawHome');
    }

    function rawMove(args) {
        return SocketMaster.addTask('rawMove', args);
    }

    function rawSetRotary(on) {
        return SocketMaster.addTask('rawSetRotary', on);
    }

    function enterRawMode() {
        return SocketMaster.addTask('enterRawMode');
    }

    function endRawMode() {
        return SocketMaster.addTask('endRawMode');
    }

    function maintainMove(args) {
        let d = $.Deferred();

        SocketMaster.addTask('maintainMove', args)
            .then((result) => {
                if (result.status === 'ok') {
                    d.resolve();
                }
            }).fail(() => {
                d.reject();
            });

        return d.promise();
    }

    function maintainHome() {
        return SocketMaster.addTask('maintainHome');
    }

    function maintainCloseFan() {
        return SocketMaster.addTask('maintainCloseFan');
    }

    async function enterMaintainMode() {
        const device = getSelectedDevice();
        const vc = VersionChecker(device.version);
        if (vc.meetRequirement('RELOCATE_ORIGIN')) {
            await setOriginX(0);
            await setOriginY(0);
        }
        return SocketMaster.addTask('enterMaintainMode');
    }

    function endMaintainMode() {
        return SocketMaster.addTask('endMaintainMode');
    }

    function getLaserPower() {
        return SocketMaster.addTask('getLaserPower');
    }

    function getLaserSpeed() {
        return SocketMaster.addTask('getLaserSpeed');
    }

    function getFan() {
        return SocketMaster.addTask('getFan');
    }

    function setLaserPower(power) {
        return SocketMaster.addTask('setLaserPower', power);
    }

    function setLaserPowerTemp(power) {
        return SocketMaster.addTask('setLaserPowerTemp', power);
    }

    function setLaserSpeed(speed) {
        return SocketMaster.addTask('setLaserSpeed', speed);
    }

    function setLaserSpeedTemp(speed) {
        return SocketMaster.addTask('setLaserSpeedTemp', speed);
    }

    function setFan(fan) {
        return SocketMaster.addTask('setFan', fan);
    }

    function setFanTemp(fan) {
        return SocketMaster.addTask('setFanTemp', fan);
    }

    function setOriginX(x=0) {
        const device = getSelectedDevice();
        const vc = VersionChecker(device.version);
        if (vc.meetRequirement('RELOCATE_ORIGIN')) {
            return SocketMaster.addTask('setOriginX', x);
        } else {
            console.warn('This device does not support command setOriginX');
            return
        }
    }

    function setOriginY(y=0) {
        const device = getSelectedDevice();
        const vc = VersionChecker(device.version);
        if (vc.meetRequirement('RELOCATE_ORIGIN')) {
            return SocketMaster.addTask('setOriginY', y);
        } else {
            console.warn('This device does not support command setOriginY');
            return
        }
    }

    function reconnect() {
        let d = $.Deferred();
        _devices.some(function (device, i) {
            if (device.uuid === _selectedDevice.uuid) {
                _devices.splice(i, 1);
            }
        });

        killSelf().always(() => {
            selectDevice(_selectedDevice);
        });
        return d.promise();
    }

    function kickChangeFilament() {
        let d = $.Deferred();
        //return result is success always even the USB disconnected on device side.
        //need to be figure it out.
        selectDevice(_selectedDevice).then((result) => {
            kick();
            d.resolve();

        });
        return d.promise();
    }

    // get functions
    function getReport() {
        // Jim Kang's code below
        let d = $.Deferred();
        let timeout;

        SocketMaster.addTask('report').then((result) => {
            // Set timeout
            timeout = setTimeout(() => {
                d.reject({ status: 'fatal', error: ['TIMEOUT'] });
            }, 10 * 1000);

            // Force update st_label for a backend inconsistancy
            let s = result.device_status;
            if (s.st_id === DeviceConstants.status.ABORTED) {
                s.st_label = 'ABORTED';
            }
            d.resolve(s);
        }).fail((error) => {
            d.reject(error);
        }).always(() => {
            clearTimeout(timeout);
        });
        return d.promise();;
    }

    function getSelectedDevice() {
        // retrieve the whole device information from discover.js
        let foundDevices = _availableDevices.filter(d => d.uuid === _device.uuid);

        return foundDevices.length > 0 ? foundDevices[0] : _device;
    }

    function getPreviewInfo() {
        let d = $.Deferred();
        SocketMaster.addTask('getPreview').then((result) => {
            d.resolve(result);
        });
        return d.promise();
    }

    function getFirstDevice() {
        return _deviceNameMap[Object.keys(_deviceNameMap)[0]];
    }

    function getDeviceByName(name) {
        return _deviceNameMap[name];
    }

    function updateFirmware(file) {
        return SocketMaster.addTask('fwUpdate', file);
    }

    function updateToolhead(file) {
        return SocketMaster.addTask('toolheadUpdate', file);
    }

    function headInfo() {
        return SocketMaster.addTask('getHeadInfo@maintain');
    }

    function closeConnection() {
        _device.controller.connection.close();
        _removeConnection(_device.uuid);
    }

    function getCloudValidationCode() {
        return SocketMaster.addTask('getCloudValidationCode');
    }

    function enableCloud() {
        return SocketMaster.addTask('enableCloud');
    }

    // Private Functions

    function _existConnection(uuid, source) {
        return _devices.some(function (d) {
            return d.uuid === uuid && d.source === source;
        });
    }

    function _removeConnection(uuid) {
        let index = _devices.findIndex(function (d) {
            return d.uuid === uuid;
        });

        if (-1 < index) {
            _devices.splice(index, 1);
        }
    }

    function _switchDevice(uuid) {
        let index = _devices.findIndex(function (d) {
            return d.uuid === uuid;
        });

        return _devices[index];
    }

    async function connectCamera(device, shouldCrop=true) {
        _device.camera = new Camera(shouldCrop);
        await _device.camera.createWs(device);
    }

    async function takeOnePicture() {
        return await _device.camera.oneShot();
    }

    async function streamCamera(device, shouldCrop=true) {
        await this.connectCamera(device, shouldCrop);

        // return an instance of RxJS Observable.
        return _device.camera.getLiveStreamSource();
    }

    function disconnectCamera() {
        if (!_device || !_device.camera) {
            return;
        }
        _device.camera.closeWs();
        _device.camera = null;
    }

    async function showOutline(object_height, positions) {
        await SocketMaster.addTask('showOutline', object_height, positions);
    }

    function calibrate(opts) {
        let d = $.Deferred(),
            debug_data = {};

        opts = opts || {};
        opts.forceExtruder = opts.forceExtruder === null ? true : opts.forceExtruder;
        opts.doubleZProbe = opts.doubleZProbe === null ? false : opts.doubleZProbe;
        opts.withoutZProbe = opts.withoutZProbe === null ? false : opts.withoutZProbe;


        const processError = (resp = {}) => {
            if (typeof resp === 'string') { resp = { error: [resp] }; }
            if (resp.error && resp.error === 'EDGE_CASE') { return; }
            DeviceErrorHandler.processDeviceMasterResponse(resp);
            Alert.popUp({
                id: 'device-busy',
                message: DeviceErrorHandler.translate(resp.error),
                type: AlertConstants.SHOW_POPUP_ERROR
            });
            SocketMaster.addTask('endMaintainMode');
        };

        const step1 = () => {
            let _d = $.Deferred();
            SocketMaster.addTask('enterMaintainMode').then((response) => {
                if (response.status === 'ok') {
                    return SocketMaster.addTask('getHeadInfo@maintain');
                }
                else {
                    _d.reject(response);
                }
            }).then((headResp) => {
                if (opts.forceExtruder) {
                    if (headResp.module === null) {
                        return $.Deferred().reject({ module: null, error: ['HEAD_ERROR', 'HEAD_OFFLINE'] });
                    } else if (headResp.module !== 'EXTRUDER') {
                        return $.Deferred().reject({ module: 'LASER', error: ['HEAD_ERROR', 'TYPE_ERROR'] });
                    }
                }
                return SocketMaster.addTask('maintainHome');
            }).then((response) => {
                response.status === 'ok' ? _d.resolve() : _d.reject();
            }).fail((error) => {
                _d.reject(error);
            });
            return _d.promise();
        };

        const step2 = () => {
            let _d = $.Deferred();
            SocketMaster.addTask(opts.doubleZProbe ? 'calibrateDoubleZProbe@maintain' : (opts.withoutZProbe ? 'calibrateWithoutZProbe@maintain' : 'calibrate@maintain')).then((response) => {
                debug_data = response.debug;
                return SocketMaster.addTask('endMaintainMode');
            }).then(() => {
                _d.resolve();
            }).fail((error) => {
                _d.reject(error);
            });
            return _d.promise();
        };

        step1().then(() => {
            return step2();
        }).then(() => {
            d.resolve(debug_data);
        }).fail((error) => {
            console.log(error);
            processError(error);
            d.reject(error);
        });

        return d.promise();
    }


    function zprobe(opts) {
        let d = $.Deferred(),
            debug_data = {};

        opts = opts || {};
        opts.forceExtruder = opts.forceExtruder === null ? true : opts.forceExtruder;


        const processError = (resp = {}) => {
            if (typeof resp === 'string') { resp = { error: [resp] }; }
            if (resp.error && resp.error === 'EDGE_CASE') { return; }
            DeviceErrorHandler.processDeviceMasterResponse(resp);
            Alert.popUp({
                id: 'device-busy',
                message: DeviceErrorHandler.translate(resp.error),
                type: AlertConstants.SHOW_POPUP_ERROR
            });
            SocketMaster.addTask('endMaintainMode');
        };

        const step1 = () => {
            let _d = $.Deferred();
            SocketMaster.addTask('enterMaintainMode').then((response) => {
                if (response.status === 'ok') {
                    return SocketMaster.addTask('getHeadInfo@maintain');
                }
                else {
                    _d.reject(response);
                }
            }).then((headResp) => {
                if (opts.forceExtruder) {
                    if (headResp.module === null) {
                        return $.Deferred().reject({ module: null, error: ['HEAD_ERROR', 'HEAD_OFFLINE'] });
                    } else if (headResp.module !== 'EXTRUDER') {
                        return $.Deferred().reject({ module: 'LASER', error: ['HEAD_ERROR', 'TYPE_ERROR'] });
                    }
                }
                return SocketMaster.addTask('maintainHome');
            }).then((response) => {
                response.status === 'ok' ? _d.resolve() : _d.reject();
            }).fail((error) => {
                _d.reject(error);
            });
            return _d.promise();
        };

        const step2 = () => {
            let _d = $.Deferred();
            SocketMaster.addTask('zprobe@maintain').then((response) => {
                debug_data = response.debug;
                return SocketMaster.addTask('endMaintainMode');
            }).then(() => {
                _d.resolve();
            }).fail((error) => {
                _d.reject(error);
            });
            return _d.promise();
        };

        step1().then(() => {
            return step2();
        }).then(() => {
            d.resolve(debug_data);
        }).fail((error) => {
            console.log(error);
            processError(error);
            d.reject(error);
        });

        return d.promise();
    }


    function home() {
        let d = $.Deferred();

        const processError = (resp = {}) => {
            DeviceErrorHandler.processDeviceMasterResponse(resp);
            Alert.popUp({
                id: 'device-busy',
                message: DeviceErrorHandler.translate(resp.error),
                type: AlertConstants.SHOW_POPUP_ERROR
            });
            SocketMaster.addTask('endMaintainMode');
        };

        const step1 = () => {
            let _d = $.Deferred();
            SocketMaster.addTask('enterMaintainMode').then((response) => {
                if (response.status === 'ok') {
                    return SocketMaster.addTask('maintainHome');
                }
                else {
                    _d.reject(response);
                }
            }).then((response) => {
                response.status === 'ok' ? _d.resolve() : _d.reject();
            }).fail((error) => {
                _d.reject(error);
            });
            return _d.promise();
        };

        step1().then(() => {
            return SocketMaster.addTask('endMaintainMode');
        }).then(() => {
            d.resolve();
        }).fail((error) => {
            processError(error);
            d.reject(error);
        });

        return d.promise();
    }

    function cleanCalibration() {
        let d = $.Deferred();

        const processError = (resp = {}) => {
            DeviceErrorHandler.processDeviceMasterResponse(resp);
            Alert.popUp({
                id: 'device-busy',
                message: DeviceErrorHandler.translate(resp.error),
                type: AlertConstants.SHOW_POPUP_ERROR
            });
            SocketMaster.addTask('endMaintainMode');
        };

        const step1 = () => {
            let _d = $.Deferred();
            SocketMaster.addTask('enterMaintainMode').then(() => {
                return SocketMaster.addTask('maintainHome');
            })
                .then((response) => {
                    if (response.status === 'ok') {
                        return SocketMaster.addTask('calibrate', true);
                    }
                    else {
                        _d.reject(response);
                    }
                }).then((response) => {
                    response.status === 'ok' ? _d.resolve() : _d.reject();
                }).fail((error) => {
                    _d.reject(error);
                });
            return _d.promise();
        };

        step1().then(() => {
            return SocketMaster.addTask('endMaintainMode');
        }).then(() => {
            d.resolve();
        }).fail((error) => {
            processError(error);
            d.reject(error);
        });

        return d.promise();
    }

    function _scanDeviceError(devices) {
        devices.forEach(function (device) {
            if (typeof (_errors[device.serial]) === 'string') {
                if (_errors[device.serial] !== device.error_label && device.error_label) {
                    if (window.debug) {
                        AlertActions.showError(device.name + ': ' + device.error_label);
                        _errors[device.serial] = device.error_label;
                    }
                }
                else if (!device.error_label) {
                    _errors[device.serial] = '';
                }
            }
            else {
                _errors[device.serial] = '';
            }
            if (defaultPrinter) {
                if (defaultPrinter.serial === device.serial) {
                    if (
                        device.st_id === DeviceConstants.status.PAUSED_FROM_RUNNING ||
                            device.st_id === DeviceConstants.status.COMPLETED ||
                            device.st_id === DeviceConstants.status.ABORTED
                    ) {
                        if (!defaultPrinterWarningShowed) {
                            let message = '';
                            if (device.st_id === DeviceConstants.status.COMPLETED) {
                                message = `${lang.device.completed}`;
                            }
                            else if (device.st_id === DeviceConstants.status.ABORTED) {
                                message = `${lang.device.aborted}`;
                            }
                            else {
                                message = `${lang.device.pausedFromError}`;
                                message = device.error_label === '' ? '' : message;
                            }

                            if (device.st_id === DeviceConstants.status.COMPLETED) {
                                AlertActions.showInfo(message, function (growl) {
                                    growl.remove(function () { });
                                    selectDevice(defaultPrinter).then(function () {
                                        GlobalActions.showMonitor(defaultPrinter);
                                    });
                                }, true);
                            }
                            else {
                                if (message !== '') {
                                    AlertActions.showWarning(message, function (growl) {
                                        growl.remove(function () { });
                                        selectDevice(defaultPrinter).then(function () {
                                            GlobalActions.showMonitor(defaultPrinter);
                                        });
                                    }, true);
                                }
                            }

                            defaultPrinterWarningShowed = true;

                            if (Config().read('notification') === 1) {
                                Notification.requestPermission((permission) => {
                                    if (permission === 'granted') {
                                        let notification = new Notification(device.name, {
                                            icon: 'img/icon-home-s.png',
                                            body: message
                                        });
                                    }
                                });
                            }
                        }
                    }
                    else {
                        if ($('#growls').length > 0) {
                            AlertActions.closeNotification();
                            defaultPrinterWarningShowed = false;
                        }
                    }
                }
            }
        });
    }

    // device names are keys to _deviceNameMap object
    function getDeviceList() {
        return _deviceNameMap;
    }

    // device are stored in array _devices
    function getAvailableDevices() {
        return _availableDevices;
    }

    function getDeviceSetting(name) {
        return SocketMaster.addTask('getDeviceSetting', name);
    }

    function getDeviceSettings(withBacklash, withUpgradeKit, withM666R_MMTest) {
        let d = $.Deferred(),
            settings = {},
            _settings = ['correction', 'filament_detect', 'head_error_level', 'autoresume', 'broadcast', 'enable_cloud'];

        if (withBacklash === true) {
            _settings.push('backlash');
        }

        if (withUpgradeKit) {
            _settings = [
                ..._settings,
                'camera_version',
                'plus_extrusion',
                'player_postback_url'
            ];
        }

        if (withM666R_MMTest) {
            _settings.push('leveling');
            _settings.push('movement_test');
        }

        const worker = function* () {
            for (let i = 0; i < _settings.length; i++) {
                yield SocketMaster.addTask('getDeviceSetting', _settings[i]);
            }
        };

        const go = (result) => {
            if (!result.done) {
                result.value.then((r) => {
                    let { key, value } = r;
                    settings[key] = value;
                    go(w.next());
                }).fail((err) => { console.log(err); });
            }
            else {
                d.resolve(settings);
            }
        };

        let w = worker();
        go(w.next());

        return d.promise();
    }

    function setDeviceSetting(name, value) {
        if (value === 'delete') {
            return SocketMaster.addTask('deleteDeviceSetting', name);
        }
        else {
            return SocketMaster.addTask('setDeviceSetting', name, value);
        }
    }

    function getDeviceInfo() {
        return SocketMaster.addTask('deviceInfo');
    }

    function downloadErrorLog() {
        return _device.controller.downloadErrorLog();
    }

    function setHeadTemperature(temperature) {
        return SocketMaster.addTask('setHeadTemperature', temperature);
    }

    function setHeadTemperatureDuringPause(temperature) {
        return SocketMaster.addTask('setHeadTemperatureDuringPause', temperature);
    }

    function getHeadStatus() {
        return SocketMaster.addTask('getHeadStatus');
    }

    function startMonitoringUsb() {
        let ws = {},
            requestingReport,
            deviceInfo = {};

        const createWebSocket = (availableUsbChannel = -1) => {
            if (availableUsbChannel === -1) { return; }
            let url = `control/usb/${availableUsbChannel}`;
            console.log('createWebSocket', url);

            return SimpleWebsocket(url, handleMessage, handleError);
        };

        const handleMessage = (response) => {
            if (response.cmd === 'play report') {
                // specify nickname with usb
                usbDeviceReport = Object.assign(deviceInfo, response.device_status);
                console.log('usbDeviceReport', usbDeviceReport);
                clearTimeout(requestingReport);
                requestingReport = setTimeout(() => {
                    getUsbDeviceReport();
                }, 2000);
            }
        };

        const handleError = (error) => {
            usbDeviceReport = {};
            console.log('handle error', error);
        };

        const getUsbDeviceReport = () => {
            ws.send('play report');
        };

        let self = this;

        UsbChecker((connectedUsbDevices) => {
            let newList = [],
                connectedUsbChannels = Object.keys(connectedUsbDevices).filter(c => {
                    return connectedUsbDevices[c].connected;
                });

                // remove old usb connection
            _devices.forEach(d => {
                if (d.source !== 'h2h' || connectedUsbChannels.indexOf(d.addr) !== -1) {
                    newList.push(d);
                }
            });

            _devices = newList;

            // add new usb connection
            connectedUsbChannels.forEach(c => {
                this.availableUsbChannel = c;
                // if not exist, add
                if (!_devices.some(d => d.addr === connectedUsbChannels)) {
                    // if profile not exist, we grab from discover
                    // if usb is plugged before FS starts, it'll appear in discover list
                    if (connectedUsbDevices[c].profile) {
                        _devices.push(connectedUsbDevices[c].profile);
                    }
                    else {
                        _availableDevices.forEach(ad => {
                            if (ad.source === 'h2h' && ad.addr === c) {
                                _devices.push(ad);
                            }
                        });
                    }
                }
            });

            if (connectedUsbChannels.length == 0) {
                self.availableUsbChannel = -1;
            }

            // to be replaced when redux is implemented
            // notify if usb is unplugged
            if (_device && _device.source === 'h2h') {
                Object.keys(usbEventListeners).forEach(id => {
                    usbEventListeners[id](connectedUsbChannels.some(c => c == _device.uuid));
                });
            }
        });
    }

    function getAvailableUsbChannel() {
        return this.availableUsbChannel;
    }

    // id    : string, required,
    // event : function, required, will callback with ture || false
    function registerUsbEvent(id, event) {
        usbEventListeners[id] = event;
    }

    function unregisterUsbEvent(id) {
        delete usbEventListeners[id];
    }

    function getDeviceBySerial(serial, isUsb, callback) {
        let matchedDevice = _availableDevices.filter(d => {
            let a = d.serial === serial;
            if (isUsb) { a = a && d.source === 'h2h'; };
            return a;
        });

        if (matchedDevice.length > 0) {
            callback.onSuccess(matchedDevice[0]);
            return;
        }

        if (callback.timeout > 0) {
            setTimeout(function () {
                callback.timeout -= 500;
                getDeviceBySerial(name, isUsb, callback);
            }, 500);
        }
        else {
            callback.onTimeout();
        }
    }

    function getDeviceBySerialFromAvailableList(serial, isUsb = false) {
        let matchedDevice = _availableDevices.filter(device => {
            let a = device.serial === serial;
            if (isUsb) { a = a && device.source === 'h2h'; };
            return a;
        });

        return matchedDevice[0];
    }

    function usbDefaultDeviceCheck(device) {
        if (device.source !== 'h2h') {
            return device;
        }

        // if(this.availableUsbChannel !== device.addr) {
        if (!_devices.some(d => d.addr === device.addr)) {
            // get wifi version instead of h2h
            let dev = _availableDevices.filter(_dev => _dev.serial === device.serial);
            if (dev[0]) {
                return dev[0];
            }
        }
        else {
            return device;
        }
    }

    function existDevice(serial) {
        let found = _availableDevices.filter(device => {
            return device.serial === serial;
        });

        return found.length > 0;
    }

    // Core

    function DeviceSingleton() {
        if (_instance !== null) {
            throw new Error('Cannot instantiate more than one DeviceSingleton, use DeviceSingleton.get_instance()');
        }

        this.init();
    }

    DeviceSingleton.prototype = {
        init: function () {
            this.calibrate = calibrate;
            this.changeFilament = changeFilament;
            this.changeFilamentDuringPause = changeFilamentDuringPause;
            this.cleanCalibration = cleanCalibration;
            this.closeConnection = closeConnection;
            this.connectCamera = connectCamera;
            this.deleteFile = deleteFile;
            this.detectHead = detectHead;
            this.disconnectCamera = disconnectCamera;
            this.downloadErrorLog = downloadErrorLog;
            this.downloadFile = downloadFile;
            this.downloadLog = downloadLog;
            this.enableCloud = enableCloud;
            this.endLoadingDuringPause = endLoadingDuringPause;
            this.endMaintainMode = endMaintainMode;
            this.endRawMode = endRawMode;
            this.endToolheadOperation = endToolheadOperation;
            this.enterMaintainMode = enterMaintainMode;
            this.enterRawMode = enterRawMode;
            this.existDevice = existDevice;
            this.fileInfo = fileInfo;
            this.getAvailableDevices = getAvailableDevices;
            this.getAvailableUsbChannel = getAvailableUsbChannel;
            this.getCloudValidationCode = getCloudValidationCode;
            this.getDeviceByName = getDeviceByName;
            this.getDeviceBySerial = getDeviceBySerial;
            this.getDeviceInfo = getDeviceInfo;
            this.getDeviceList = getDeviceList;
            this.getDeviceSetting = getDeviceSetting;
            this.getDeviceSettings = getDeviceSettings;
            this.getFirstDevice = getFirstDevice;
            this.getHeadStatus = getHeadStatus;
            this.getLaserPower = getLaserPower;
            this.getLaserSpeed = getLaserSpeed;
            this.getFan = getFan;
            this.getPreviewInfo = getPreviewInfo;
            this.getReport = getReport;
            this.getSelectedDevice = getSelectedDevice;
            this.go = go;
            this.goFromFile = goFromFile;
            this.headInfo = headInfo;
            this.home = home;
            this.kick = kick;
            this.kickChangeFilament = kickChangeFilament;
            this.killSelf = killSelf;
            this.ls = ls;
            this.lsusb = lsusb;
            this.maintainCloseFan = maintainCloseFan;
            this.maintainHome = maintainHome;
            this.maintainMove = maintainMove;
            this.pause = pause;
            this.quit = quit;
            this.quitTask = quitTask;
            this.rawHome = rawHome;
            this.rawMove = rawMove;
            this.rawSetRotary = rawSetRotary;
            this.readyCamera = readyCamera;
            this.reconnect = reconnect;
            this.registerUsbEvent = registerUsbEvent;
            this.resume = resume;
            this.runBeamboxCameraTest = runBeamboxCameraTest;
            this.doDiodeCalibrationCut = doDiodeCalibrationCut;
            this.select = select;
            this.selectDevice = selectDevice;
            this.setDeviceSetting = setDeviceSetting;
            this.setHeadTemperature = setHeadTemperature;
            this.setHeadTemperatureDuringPause = setHeadTemperatureDuringPause;
            this.setLaserPower = setLaserPower;
            this.setLaserPowerTemp = setLaserPowerTemp;
            this.setLaserSpeed = setLaserSpeed;
            this.setLaserSpeedTemp = setLaserSpeedTemp;
            this.setFan = setFan;
            this.setFanTemp = setFanTemp;
            this.setOriginX = setOriginX;
            this.setOriginY = setOriginY;
            this.showOutline = showOutline;
            this.startMonitoringUsb = startMonitoringUsb;
            this.startToolheadOperation = startToolheadOperation;
            this.stop = stop;
            this.stopChangingFilament = stopChangingFilament;
            this.streamCamera = streamCamera;
            this.takeOnePicture = takeOnePicture;
            this.unregisterUsbEvent = unregisterUsbEvent;
            this.updateFirmware = updateFirmware;
            this.updateToolhead = updateToolhead;
            this.uploadToDirectory = uploadToDirectory;
            this.usbDefaultDeviceCheck = usbDefaultDeviceCheck;
            this.zprobe = zprobe;

            Discover(
                'device-master',
                function (devices) {
                    devices = DeviceList(devices);
                    devices.forEach(d => {
                        _deviceNameMap[d.name] = d;
                    });
                    _availableDevices = devices;
                    _scanDeviceError(devices);
                }
            );
        }
    };

    DeviceSingleton.get_instance = function () {
        if (_instance === null) {
            _instance = new DeviceSingleton();
        }
        defaultPrinter = Config().read('default-printer');
        return _instance;
    };

    return DeviceSingleton.get_instance();
});
