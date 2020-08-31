import $ from 'jquery'
import * as i18n from './i18n'
import sprintf from './sprintf'
import Alert from '../app/contexts/AlertCaller'
import AlertConstants from '../app/constants/alert-constants'
import AlertActions from '../app/actions/alert-actions'
import BeamboxActions from '../app/actions/beambox'
import ProgressActions from '../app/actions/progress-actions'
import ProgressConstants from '../app/constants/progress-constants'
import InputLightboxActions from '../app/actions/input-lightbox-actions'
import DeviceConstants from '../app/constants/device-constants'
import { SelectionResult, ConnectionError } from '../app/constants/connection-constants'
import Control from './api/control'
import Touch from './api/touch'
import Discover from './api/discover'
import Config from './api/config'
import GlobalActions from '../app/actions/global-actions'
import InputLightBoxConstants from '../app/constants/input-lightbox-constants'
import DeviceList from './device-list'
import Camera from './api/camera'
import SocketMaster from './socket-master'
import DeviceErrorHandler from './device-error-handler'
import VersionChecker from './version-checker'

interface IDeviceInfo {
    st_id: number
    error_label: never
    uuid: string,
    model: string,
    version: string,
    password: boolean
    plaintext_password: string,
    serial: string,
    source: string,
    name: string,
    addr: string
}
interface IDeviceConnection {
    info: IDeviceInfo,
    control: Control,
    errors: string[]
    camera: Camera
}
const lang = i18n.lang;

class DeviceMaster {
    private deviceConnections: Map<string, IDeviceConnection>;
    private discoveredDevices: IDeviceInfo[];
    private defaultPrinterWarningShowed: boolean = false;
    private _currentDevice: IDeviceConnection;
    
    constructor() {
        this.deviceConnections = new Map<string, IDeviceConnection>();
        this.discoveredDevices = [];
        const self = this;
        Discover(
            'device-master',
            function (devices) {
                self.discoveredDevices = devices;
                self._scanDeviceError(devices);
            }
        );
    }
    
    set currentDevice(device: IDeviceConnection) {
        this._currentDevice = device;
    }

    get currentDevice() {
        return this._currentDevice;
    }

    private getDeviceByUUID(uuid: string): IDeviceConnection | null {
        if (!this.deviceConnections.get(uuid)) {
            this.deviceConnections.set(uuid, {
                info: {
                    uuid
                } as IDeviceInfo,
                control: null,
                errors: null,
                camera: null
            })
        }
        let matchedInfo = this.discoveredDevices.filter(d => d.uuid == uuid);
        if (matchedInfo[0]) {
            Object.assign(this.deviceConnections.get(uuid).info, matchedInfo[0]);
        }
        return this.deviceConnections.get(uuid);
    }

    async select(printer: IDeviceInfo): Promise<SelectionResult> {
        return await this.selectDevice(printer);
    }

    async showAuthDialog(uuid: string): Promise<boolean> { // return authed or not
        const device = this.getDeviceByUUID(uuid);
        ProgressActions.close();
        let authResult = await new Promise<{success:boolean,data:any,password:string}>((resolve, reject) => {
            InputLightboxActions.open('auth', {
                caption: sprintf(lang.input_machine_password.require_password, device.info.name),
                inputHeader: lang.input_machine_password.password,
                confirmText: lang.input_machine_password.connect,
                type: InputLightBoxConstants.TYPE_PASSWORD,
                onSubmit: async (password) => {
                    ProgressActions.open(ProgressConstants.NONSTOP_WITH_MESSAGE, lang.message.authenticating);
                    resolve(this.auth(device.info.uuid, password));
                },
                onClose: () => {
                    resolve({success: false, data: 'cancel', password: ''});
                }
            });
        });

        if (authResult.success) {
            device.info.plaintext_password = authResult.password;
            return true;
        }
        if (authResult.data !== 'cancel') {
            const message = (
                authResult.data.reachable ?
                lang.select_printer.auth_failure : 
                lang.select_printer.unable_to_connect     
            );
            Alert.popUp({
                id: 'device-auth-fail',
                message: `#811 ${message}`,
                type: AlertConstants.SHOW_POPUP_ERROR
            });
            // Display the dialog again
            await this.showAuthDialog(device.info.uuid);
        }
        return false;
    };

    async auth(uuid: string, password?: string){
        ProgressActions.open(ProgressConstants.NONSTOP, lang.message.authenticating);
        return await new Promise<{success: boolean, data: any, password: string}>((resolve) => {
            Touch({
                onError: function (data) {
                    ProgressActions.close();
                    resolve({success: false, data, password});
                },
                onSuccess: function (data) {
                    ProgressActions.close();
                    resolve({success: true, data, password});
                },
                onFail: function (data) {
                    ProgressActions.close();
                    resolve({success: false, data, password});
                }
            }).send(uuid, password || '');
        });
    }

    // TODO: Remove deferred.. 
    async selectDevice(printer: IDeviceInfo, deferred?): Promise<SelectionResult> {
        // Match the device from the newest received device list
        const uuid = printer.uuid;
        const device: IDeviceConnection = this.getDeviceByUUID(uuid);
        const self = this;
        
        if (device.control && device.control.isConnected) {
            this.currentDevice = device;
            return { success: true }
        }
    
        ProgressActions.open(ProgressConstants.NONSTOP, sprintf(lang.message.connectingMachine, device.info.name));
    
        try {
            const controlSocket = new Control(uuid);
            await controlSocket.connect();
            device.control = controlSocket;
            this.currentDevice = device;
            SocketMaster.setWebSocket(controlSocket);
            // TODO: !!! Add Control.disconnected handler
            console.log("Connected to " + uuid);
            return {
                success: true
            };
        } catch (e) {
            console.error(e);
            if (e.error) e = e.error;
            const errorCode = e.replace(/^.*\:\s+(\w+)$/g, '$1').toUpperCase();
            if ([ConnectionError.AUTH_ERROR, ConnectionError.AUTH_FAILED].includes(errorCode)) {
                if (device.info.password) {
                    const authed = await self.showAuthDialog(uuid);
                    if (authed) {
                        return await self.selectDevice(printer);
                    }
                } else {
                    ProgressActions.open(ProgressConstants.NONSTOP, sprintf(lang.message.connectingMachine, device.info.name));
                    const authResult = await self.auth(uuid);
                    if (!authResult.success) {
                        ProgressActions.close();
                        Alert.popUp({
                            id: 'auth-error-with-diff-computer',//ADD new error code?
                            message: lang.message.auth_error,
                            type: AlertConstants.SHOW_POPUP_ERROR
                        });
                        return;
                    }
                    return await self.selectDevice(printer);
                }
            } else {
                let errCaption = '';
                let errMessage = lang.message.unknown_error;
                switch (errorCode) {
                    // TODO add error message localized
                    case ConnectionError.TIMEOUT:
                        errMessage = '#890 Device Connection Timeout'
                        break;
                    case ConnectionError.FLUXMONITOR_VERSION_IS_TOO_OLD:
                        errMessage = lang.message.monitor_too_old.content;
                        errCaption = lang.message.monitor_too_old.caption;
                        break;
                    case ConnectionError.NOT_FOUND:
                        errMessage = lang.message.unable_to_find_machine;
                        break;
                    case ConnectionError.DISCONNECTED:
                        errMessage = "#891 Device disconnected";
                        if (this.discoveredDevices.some(d => d.uuid === uuid)) {
                            errMessage = "#892 Device disconnected";
                        }
                        break;
                    case ConnectionError.UNKNOWN_DEVICE:
                        errMessage = lang.message.unknown_device;
                        break;
                    default:
                        errMessage = `#821 Unhandled Exception ${errorCode}`
                }

                Alert.popUp({
                    id: 'connection-error',
                    caption: errCaption,
                    message: errMessage,
                    type: AlertConstants.SHOW_POPUP_ERROR
                });
                return {
                    success: false,
                    error: ConnectionError.TIMEOUT
                }
            }
        } finally {
            ProgressActions.close();
        }
    }

    uploadToDirectory(data, path, fileName) {
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

    go(data) {
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

    goFromFile(path, fileName) {
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

    waitTillCompleted() {
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
                            this.quit().then(() => {
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

    runBeamboxCameraTest() {
        let d = $.Deferred();

        fetch(DeviceConstants.BEAMBOX_CAMERA_TEST).then(res => res.blob()).then(async blob => {
            const vc = VersionChecker(this.currentDevice.info.version);
            // TODO: Where is the origin defined?
            /*if (vc.meetRequirement('RELOCATE_ORIGIN')) {
                await setOriginX(origin.x);
                await setOriginY(origin.y);
            }*/
            this.go(blob)
                .fail(() => {
                    d.reject('UPLOAD_FAILED'); // Error while uploading task
                })
                .then(() => {
                    ProgressActions.open(ProgressConstants.STEPPING, lang.camera_calibration.drawing_calibration_image);
                    let taskTotalSecs = 30;
                    let elapsedSecs = 0;
                    let progressUpdateTimer = setInterval(() => {
                        elapsedSecs += 0.1;
                        if (elapsedSecs > taskTotalSecs) {
                            clearInterval(progressUpdateTimer);
                            return;
                        }
                        ProgressActions.updating(lang.camera_calibration.drawing_calibration_image, (elapsedSecs / taskTotalSecs) * 100);
                    }, 100);
                    this.waitTillCompleted()
                        .fail((err) => {
                            clearInterval(progressUpdateTimer);
                            ProgressActions.close();
                            d.reject(err); // Error while running test
                        })
                        .then(() => {
                            clearInterval(progressUpdateTimer);
                            ProgressActions.close();
                            d.resolve();
                        });

                });
        });

        return d.promise();
    }

    doDiodeCalibrationCut() {
        let d = $.Deferred();

        fetch(DeviceConstants.DIODE_CALIBRATION).then(res => res.blob()).then(async blob => {
            const vc = VersionChecker(this.currentDevice.info.version);
            // TODO: Where is the origin defined?
            /*if (vc.meetRequirement('RELOCATE_ORIGIN')) {
                await setOriginX(origin.x);
                await setOriginY(origin.y);
            }*/
            this.go(blob)
                .fail(() => {
                    d.reject('UPLOAD_FAILED'); // Error while uploading task
                })
                .then(() => {
                    ProgressActions.open(ProgressConstants.STEPPING, lang.diode_calibration.drawing_calibration_image);
                    let taskTotalSecs = 35;
                    let elapsedSecs = 0;
                    let progressUpdateTimer = setInterval(() => {
                        elapsedSecs += 0.1;
                        if (elapsedSecs > taskTotalSecs) {
                            clearInterval(progressUpdateTimer);
                            return;
                        }
                        ProgressActions.updating(lang.diode_calibration.drawing_calibration_image, (elapsedSecs / taskTotalSecs) * 100);
                    }, 100);
                    this.waitTillCompleted()
                        .fail((err) => {
                            clearInterval(progressUpdateTimer);
                            ProgressActions.close();
                            d.reject(err); // Error while running test
                        })
                        .then(() => {
                            clearInterval(progressUpdateTimer);
                            ProgressActions.close();
                            d.resolve();
                        });

                });
        });

        return d.promise();
    }

    resume() {
        return SocketMaster.addTask('resume')
    }

    pause() {
        return SocketMaster.addTask('pause');
    }

    stop() {
        let d = $.Deferred();
        SocketMaster.addTask('abort').then(r => {
            d.resolve(r);
        });
        return d.promise();
    }

    quit() {
        return SocketMaster.addTask('quit');
    }

    quitTask(mode?: string) {
        if (mode) {
            return SocketMaster.addTask('quitTask@' + mode);
        } else {
            return SocketMaster.addTask('quitTask');
        }
    }

    kick() {
        return SocketMaster.addTask('kick');
    }

    ls(path) {
        return SocketMaster.addTask('ls', path);
    }

    lsusb() {
        return SocketMaster.addTask('lsusb');
    }

    downloadLog(log) {
        return this.currentDevice.control.downloadLog(log);
    }

    fileInfo(path, fileName) {
        return SocketMaster.addTask('fileInfo', path, fileName);
    }

    deleteFile(path, fileName) {
        let fileNameWithPath = `${path}/${fileName}`;
        return SocketMaster.addTask('deleteFile', fileNameWithPath);
    }

    downloadFile(path, fileName) {
        return SocketMaster.addTask('downloadFile', `${path}/${fileName}`);
    }

    startToolheadOperation() {
        return SocketMaster.addTask('startToolheadOperation');
    }

    endToolheadOperation() {
        return SocketMaster.addTask('endToolheadOperation');
    }

    endLoadingDuringPause() {
        return SocketMaster.addTask('endLoadingDuringPause');
    }

    detectHead() {
        let d = $.Deferred();

        SocketMaster.addTask('getHeadInfo@maintain').then((response) => {
            response.module ? d.resolve() : d.reject(response);
        }).fail(() => {
            d.reject();
        });

        return d.promise();
    }

    rawHome() {
        return SocketMaster.addTask('rawHome');
    }

    rawMove(args) {
        return SocketMaster.addTask('rawMove', args);
    }

    rawSetRotary(on) {
        return SocketMaster.addTask('rawSetRotary', on);
    }

    enterRawMode() {
        return SocketMaster.addTask('enterRawMode');
    }

    endRawMode() {
        return SocketMaster.addTask('endRawMode');
    }

    maintainMove(args) {
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

    maintainHome() {
        return SocketMaster.addTask('maintainHome');
    }

    maintainCloseFan() {
        return SocketMaster.addTask('maintainCloseFan');
    }

    async enterMaintainMode() {
        const vc = VersionChecker(this.currentDevice.info.version);
        if (vc.meetRequirement('RELOCATE_ORIGIN')) {
            await this.setOriginX(0);
            await this.setOriginY(0);
        }
        return SocketMaster.addTask('enterMaintainMode');
    }

    endMaintainMode() {
        return SocketMaster.addTask('endMaintainMode');
    }

    getLaserPower() {
        return SocketMaster.addTask('getLaserPower');
    }

    getLaserSpeed() {
        return SocketMaster.addTask('getLaserSpeed');
    }

    getFan() {
        return SocketMaster.addTask('getFan');
    }

    setLaserPower(power) {
        return SocketMaster.addTask('setLaserPower', power);
    }

    setLaserPowerTemp(power) {
        return SocketMaster.addTask('setLaserPowerTemp', power);
    }

    setLaserSpeed(speed) {
        return SocketMaster.addTask('setLaserSpeed', speed);
    }

    setLaserSpeedTemp(speed) {
        return SocketMaster.addTask('setLaserSpeedTemp', speed);
    }

    setFan(fan) {
        return SocketMaster.addTask('setFan', fan);
    }

    setFanTemp(fan) {
        return SocketMaster.addTask('setFanTemp', fan);
    }

    setOriginX(x=0) {
        const vc = VersionChecker(this.currentDevice.info.version);
        if (vc.meetRequirement('RELOCATE_ORIGIN')) {
            return SocketMaster.addTask('setOriginX', x);
        } else {
            console.warn('This device does not support command setOriginX');
            return
        }
    }

    setOriginY(y=0) {
        const vc = VersionChecker(this.currentDevice.info.version);
        if (vc.meetRequirement('RELOCATE_ORIGIN')) {
            return SocketMaster.addTask('setOriginY', y);
        } else {
            console.warn('This device does not support command setOriginY');
            return
        }
    }

    async reconnect() {
        this.deviceConnections.delete(this.currentDevice.info.uuid);
        try {
            await this.currentDevice.control.killSelf();
        } catch(e) {
            console.error(`currentDevice.control.killSelf error ${e}`);
        }
        await this.selectDevice(this.currentDevice.info);
    }

    // get functions
    getReport() {
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

    getPreviewInfo() {
        let d = $.Deferred();
        SocketMaster.addTask('getPreview').then((result) => {
            d.resolve(result);
        });
        return d.promise();
    }

    updateFirmware(file) {
        return SocketMaster.addTask('fwUpdate', file);
    }

    updateToolhead(file) {
        return SocketMaster.addTask('toolheadUpdate', file);
    }

    headInfo() {
        return SocketMaster.addTask('getHeadInfo@maintain');
    }

    closeConnection() {
        this.currentDevice.control.connection.close();
        this.currentDevice.control = null;
    }

    async connectCamera(device: IDeviceInfo, shouldCrop: boolean = true) {
        const deviceConn = this.getDeviceByUUID(device.uuid);
        deviceConn.camera = new Camera(shouldCrop);
        await deviceConn.camera.createWs(device);
    }

    async takeOnePicture() {
        return await this.currentDevice.camera.oneShot();
    }

    async streamCamera(device, shouldCrop=true) {
        await this.connectCamera(device, shouldCrop);

        // return an instance of RxJS Observable.
        return this.currentDevice.camera.getLiveStreamSource();
    }

    disconnectCamera() {
        if (this.currentDevice?.camera) {
            this.currentDevice.camera.closeWs();
            this.currentDevice.camera = null;
        } else {
            console.warn("Unable to close websocket of", this.currentDevice.info.name);
        }
    }

    async showOutline(object_height, positions) {
        await SocketMaster.addTask('showOutline', object_height, positions);
    }

    home() {
        let d = $.Deferred();

        const processError = (resp: any) => {
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

    _scanDeviceError(devices: IDeviceInfo[]) {
        const self = this;
        devices.forEach(function (info) {
            const deviceConn = self.getDeviceByUUID(info.uuid);
            if (typeof deviceConn.errors === 'string') {
                if (deviceConn.errors !== info.error_label && info.error_label) {
                    if (window.debug) {
                        AlertActions.showError(info.name + ': ' + info.error_label);
                        deviceConn.errors = info.error_label;
                    }
                } else if (!info.error_label) {
                    deviceConn.errors = [];
                }
            } else {
                deviceConn.errors = [];
            }
            if (defaultPrinter) {
                if (defaultPrinter.serial === info.serial) {
                    if (
                        [DeviceConstants.status.PAUSED_FROM_RUNNING,
                        DeviceConstants.status.COMPLETED,
                        DeviceConstants.status.ABORTED].includes(info.st_id)
                    ) {
                        if (!this.defaultPrinterWarningShowed) {
                            let message = '';
                            if (deviceConn.info.st_id === DeviceConstants.status.COMPLETED) {
                                message = `${lang.device.completed}`;
                            } else if (deviceConn.info.st_id === DeviceConstants.status.ABORTED) {
                                message = `${lang.device.aborted}`;
                            } else {
                                message = `${lang.device.pausedFromError}`;
                                message = deviceConn.info.error_label === '' ? '' : message;
                            }

                            if (deviceConn.info.st_id === DeviceConstants.status.COMPLETED) {
                                AlertActions.showInfo(message, function (growl) {
                                    growl.remove(function () { });
                                    this.selectDevice(defaultPrinter).then(function () {
                                        GlobalActions.showMonitor(defaultPrinter);
                                    });
                                });
                            } else {
                                if (message !== '') {
                                    AlertActions.showWarning(message, function (growl) {
                                        growl.remove(function () { });
                                        this.selectDevice(defaultPrinter).then(function () {
                                            GlobalActions.showMonitor(defaultPrinter);
                                        });
                                    }, true);
                                }
                            }

                            this.defaultPrinterWarningShowed = true;

                            if (Config().read('notification') === '1') {
                                Notification.requestPermission((permission) => {
                                    if (permission === 'granted') {
                                        let notification = new Notification(deviceConn.info.name, {
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
                            this.defaultPrinterWarningShowed = false;
                        }
                    }
                }
            }
        });
    }

    // device are stored in array _devices
    getAvailableDevices() {
        return this.discoveredDevices;
    }

    getDeviceSetting(name) {
        return SocketMaster.addTask('getDeviceSetting', name);
    }

    getDeviceSettings(withBacklash, withUpgradeKit, withM666R_MMTest) {
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

    setDeviceSetting(name, value) {
        if (value === 'delete') {
            return SocketMaster.addTask('deleteDeviceSetting', name);
        }
        else {
            return SocketMaster.addTask('setDeviceSetting', name, value);
        }
    }

    getDeviceInfo() {
        return SocketMaster.addTask('deviceInfo');
    }

    downloadErrorLog() {
        return this.currentDevice.control.downloadErrorLog();
    }

    getHeadStatus() {
        return SocketMaster.addTask('getHeadStatus');
    }

    getDeviceBySerial(serial: string, callback) {
        let matchedDevice = this.discoveredDevices.filter(d => d.serial === serial);

        if (matchedDevice.length > 0) {
            callback.onSuccess(matchedDevice[0]);
            return;
        }

        if (callback.timeout > 0) {
            setTimeout(function () {
                callback.timeout -= 500;
                this.getDeviceBySerial(name, callback);
            }, 500);
        } else {
            callback.onTimeout();
        }
    }

    existDevice(serial: string) {
        return this.discoveredDevices.some((device) => device.serial == serial);
    }
}

const defaultPrinter:IDeviceInfo = Config().read('default-printer') as IDeviceInfo;
const deviceMaster = new DeviceMaster();
export default deviceMaster;