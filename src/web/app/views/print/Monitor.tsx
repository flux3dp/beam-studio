import $ from 'jquery';
import DeviceMaster from '../../../helpers/device-master';
import BeamboxPreference from '../../actions/beambox/beambox-preference';
import Constant from '../../actions/beambox/constant';
import AlertActions from '../../actions/alert-actions';
import ElectronDialogs from '../../actions/electron-dialogs';
import AlertStore from '../../stores/alert-store';
import Progress from '../../contexts/ProgressCaller';
import DeviceConstants from '../../constants/device-constants';
import GlobalActions from '../../actions/global-actions';
import GlobalConstants from '../../constants/global-constants';
import sprintf from '../../../helpers/sprintf';
import shortcuts from '../../../helpers/shortcuts';
import MainReducer from '../../reducer/index';
import MonitorHeader from './Monitor-Header';
import MonitorDisplay from './Monitor-Display';
import MonitorControl from './Monitor-Control';
import MonitorInfo from './Monitor-Info';
import MonitorActionCreator from '../../action-creators/monitor';
import DeviceActionCreator from '../../action-creators/device';
import DeviceErrorHandler from '../../../helpers/device-error-handler';
import VersionChecker from '../../../helpers/version-checker';
import { IProgress } from '../../../interfaces/IProgress';

const Redux = require('Redux');
const React = requireNode('react');
const ClassNames = requireNode('classnames');
const PropTypes = requireNode('prop-types');

let _id = 'MONITOR',
    start,
    scrollSize = 1,
    _history = [],
    usbExist = false,
    showingPopup = false,
    messageViewed = false,
    operationStatus,
    previewUrl = '',
    lang,
    lastAction,
    openedFrom,
    currentDirectoryContent,

    statusId = 0,
    refreshTime = 3000;

let fileToBeUpload: File;
let mode = {
    PRINT       : 'PRINT',
    PREVIEW     : 'PREVIEW',
    FILE        : 'FILE',
    FILE_PREVIEW: 'FILE_PREVIEW',
    CAMERA      : 'CAMERA',
    CAMERA_RELOCATE: 'CAMERA_RELOCATE',
};

let type = {
    FILE: 'FILE',
    FOLDER: 'FOLDER'
};

let source = {
    DEVICE_LIST : 'DEVICE_LIST',
    GO          : 'GO'
};

let store,
    leftButtonOn = true,
    middleButtonOn = true,
    rightButtonOn = true;

operationStatus = [
    DeviceConstants.RUNNING,
    DeviceConstants.PAUSED,
    DeviceConstants.RESUMING,
    DeviceConstants.ABORTED,
];

class Monitor extends React.Component{
    constructor(props) {
        super(props);

        lang        = this.props.lang;
        previewUrl  = this.props.previewUrl;
        statusId    = DeviceConstants.status.IDLE;

        let _mode = mode.PREVIEW;
        openedFrom = this.props.opener || GlobalConstants.DEVICE_LIST;
        if(openedFrom === GlobalConstants.DEVICE_LIST) {
            let { st_id } = this.props.selectedDevice;
            if(st_id === DeviceConstants.status.IDLE) {
                _mode = mode.FILE;
            }
            else {
                _mode = mode.PRINT;
            }
        }

        store = Redux.createStore(MainReducer);
        store.dispatch(MonitorActionCreator.changeMode(_mode));

        this.childContext = {
            store: store,
            slicingResult: this.props.slicingStatus,
            lang: this.props.lang
        };

        this._preFetchInfo();
    }

    componentDidMount() {
        AlertStore.onRetry(this._handleRetry);
        AlertStore.onCancel(this._handleCancel);
        AlertStore.onYes(this._handleYes);

        this._registerDeleteKey();
        this._startReport();
    }

    shouldComponentUpdate(nextProps, nextState) {
        return false;
    }

    componentWillUnmount() {
        AlertStore.removeRetryListener(this._handleRetry);
        AlertStore.removeCancelListener(this._handleCancel);
        AlertStore.removeYesListener(this._handleYes);

        let { Monitor } = store.getState();
        if(Monitor.mode === GlobalConstants.CAMERA) {
            this._stopCamera();
        }

        if(Monitor.mode === GlobalConstants.CAMERA_RELOCATE) {
            DeviceMaster.endRawMode();
            this._stopCamera();
        }
        _history = [];
        messageViewed = false;

        DeviceMaster.disconnectCamera();
        GlobalActions.monitorClosed();

        clearInterval(this.reporter);
        this.unsubscribeDeleteKey();
    }

    _registerDeleteKey = () => {
        this.unsubscribeDeleteKey = shortcuts.on(['DEL'], (e) => {
            e.preventDefault();
            if(store.getState().Monitor.selectedItem && this.state.focused) {
                AlertActions.showPopupYesNo('DELETE_FILE', lang.monitor.confirmFileDelete);
            }
        });
    }

    _preFetchInfo = () => {
        let { Monitor } = store.getState();

        const go = (result) => {
            if(!result.done) {
                result.value.then(() => {
                    go(s.next());
                })
                .fail(error => {
                    console.log('monitor', error);
                    if(error.status === 'fatal') {
                        DeviceMaster.reconnect();
                    }
                });
            }
        };

        const starter = function*() {
            yield this._checkUSBFolderExistance();
            yield this._getInitialStatus();
            if(openedFrom === GlobalConstants.DEVICE_LIST) {
                if (Monitor.mode === mode.FILE) {
                    yield this._dispatchFolderContent('');
                }
                else {
                    yield this._getPreviewInfo();
                }
            }
        }.bind(this);

        let s = starter();
        go(s.next());
    }

    _getPreviewInfo = () => {
        let d = $.Deferred();
        DeviceMaster.getPreviewInfo().then((info) => {
            console.log('Device Master upload preview info', info);
            store.dispatch(DeviceActionCreator.updateJobInfo(info));
            d.resolve();
        });
        return d.promise();
    }

    _getInitialStatus = () => {
        let d = $.Deferred();
        DeviceMaster.getReport().then((result) => {
            store.dispatch(DeviceActionCreator.updateDeviceStatus(result));
            d.resolve();
        });
        return d.promise();
    }

    _hasFCode = () => {
        return this.props.fCode instanceof Blob;
    }

    _stopCamera = () => {
        DeviceMaster.disconnectCamera();
    }

    _refreshDirectory = () => {
        this._retrieveFolderContent(store.getState().Monitor.currentPath);
    }

    _existFileInDirectory = (path, fileName) => {
        let d = $.Deferred();
        fileName = fileName.replace('.gcode', '.fc');
        DeviceMaster.fileInfo(path, fileName).then(() => {
            d.resolve(true);
        }).fail(() => {
            d.resolve(false);
        });
        return d.promise();
    }

    _doFileUpload = (file) => {
        let reader = new FileReader();

        store.dispatch(MonitorActionCreator.setUploadProgress(0));
        reader.readAsArrayBuffer(file);
        reader.onload = () => {
            let fileInfo = file.name.split('.'),
                ext = fileInfo[fileInfo.length - 1],
                type,
                isValid = false;

            if(ext === 'fc') {
                type = {type: 'application/fcode'};
                isValid = true;
            }
            else if (ext === 'gcode') {
                type = {type: 'text/gcode'};
                isValid = true;
            }

            if(isValid) {
                let { Monitor } = store.getState();
                let blob = new Blob([reader.result], type);

                DeviceMaster.uploadToDirectory(blob, Monitor.currentPath, file.name).then(() => {
                    store.dispatch(MonitorActionCreator.setUploadProgress(''));
                    this._refreshDirectory();
                }).progress((progress: IProgress) => {
                    let p = Math.floor(progress.step / progress.total * 100);
                    store.dispatch(MonitorActionCreator.setUploadProgress(p));
                }).fail((error) => {
                    // TODO: show upload error
                });
            }
            else {
                AlertActions.showPopupInfo('', lang.monitor.extensionNotSupported);
            }
        };
    }

    _clearSelectedItem = () => {
        store.dispatch(MonitorActionCreator.selectItem({ name: '', type: '' }));
    }

    _handleClose = () => {
        this.props.onClose();
    }

    _handleRetry = (id) => {
        if(id === _id) {
            let { Device } = store.getState();
            if(Device.status.st_id === DeviceConstants.status.ABORTED) {
                DeviceMaster.quit().then(() => {
                    this._handleGo();
                });
            }
            else if(this._isPaused()) {
                DeviceMaster.resume();
                messageViewed = false;
                showingPopup = false;

                let resumeStatus = { st_label: 'RESUMING', st_id: 6 };
                store.dispatch(DeviceActionCreator.updateDeviceStatus(resumeStatus));
            }
        }
    }

    _handleCancel = () => {
        messageViewed = true;
        showingPopup = false;
    }

    _handleYes = (id) => {
        if(id === DeviceConstants.KICK) {
            DeviceMaster.kick();
        }
        else if(id === 'UPLOAD_FILE') {
            let info    = fileToBeUpload.name.split('.'),
                ext     = info[info.length - 1];

            if(ext === 'gcode') {
                setTimeout(function() {
                    AlertActions.showPopupYesNo('CONFIRM_G_TO_F', lang.monitor.confirmGToF);
                }, 1000);
            }
            else {
                this._doFileUpload(fileToBeUpload);
            }
        }
        else if(id === 'CONFIRM_G_TO_F') {
            this._doFileUpload(fileToBeUpload);
        }
        else if(id === 'DELETE_FILE') {
            let { Monitor } = store.getState();
            this._handleDeleteFile(Monitor.currentPath, Monitor.selectedItem.name);
        }
    }

    _handleBrowseFolder = () => {
        this._addHistory();
        this._dispatchFolderContent('');
        // avoid error occur, but don't know that will cause any bug, so mark it only.
        //this.unsubscribeEnterKey();
    }

    _handleFileCrossIconClick = () => {
        AlertActions.showPopupYesNo('DELETE_FILE', lang.monitor.confirmFileDelete);
    }

    _dispatchFolderContent = (path) => {
        let d = $.Deferred();
        this._stopCamera();

        this._retrieveFolderContent(path).then((content) => {
            store.dispatch(MonitorActionCreator.changePath(path, content));
            return d.resolve();
        });
        return d.promise();
    }

    _handleFolderclick = (event) => {
        const folderName = event.currentTarget.dataset.foldername;
        this.unsubscribeEnterKey = shortcuts.on(['RETURN'], e => {
            // if a folder is selected
            if(folderName) {
                this._handleFolderDoubleClick(folderName);
                this.unsubscribeEnterKey();
            }
        });
        store.dispatch(MonitorActionCreator.selectItem({
            name: folderName,
            type: type.FOLDER
        }));
    }

    _handleFolderDoubleClick = (event) => {
        const folderName = event.currentTarget.dataset.foldername;
        this._addHistory();
        this._dispatchFolderContent(store.getState().Monitor.currentPath + '/' + folderName);
    }

    _handleDeleteFile = (pathToFile, fileName) => {
        DeviceMaster.deleteFile(pathToFile, fileName).then(() => { this._refreshDirectory(); });
    }

    _handleBack = () => {
        if(typeof this.unsubscribeEnterKey === 'function') {
            this.unsubscribeEnterKey();
        }
        if(_history.length === 0) { return; }
        lastAction = _history.pop();

        let { Monitor } = store.getState();

        if(Monitor.mode === mode.CAMERA) {
            this._stopCamera();
        } else if (Monitor.mode === mode.CAMERA_RELOCATE) {
            DeviceMaster.endRawMode();
            this._stopCamera();
        } else if (Monitor.mode === mode.PREVIEW || Monitor.mode === mode.FILE_PREVIEW) {
            store.dispatch(MonitorActionCreator.setRelocateOrigin({x: 0, y: 0}));
        }

        let actions = {
            'PREVIEW' : () => {},
            'FILE_PREVIEW' : () => {},
            'FILE': () => {
                this._clearSelectedItem();
                this._dispatchFolderContent(lastAction.path);
            },
            'CAMERA': () => {},
            'CAMERA_RELOCATE': () => {},
            'PRINT': () => { store.dispatch(MonitorActionCreator.changeMode(GlobalConstants.PRINT)); }
        };

        if(actions[lastAction.mode]) {
            actions[lastAction.mode]();
            store.dispatch(MonitorActionCreator.changeMode(lastAction.mode));
        }
    }

    _handleFileClick = (event) => {
        const { filename } = event.currentTarget.dataset;
        store.dispatch(MonitorActionCreator.selectItem({
            name: filename,
            type: type.FILE
        }));
    }

    _handleFileDoubleClick = (event) => {
        const { filename } = event.currentTarget.dataset;
        event.stopPropagation();

        const handlePreviewFile = () => {
            this._addHistory();
            let { Monitor } = store.getState();
            start = 0;
            currentDirectoryContent.files.length = 0; // clear folder content

            DeviceMaster.fileInfo(Monitor.currentPath, filename).then((info) => {
                if(info[1] instanceof Blob) {
                    previewUrl = info[1].size === 0 ? 'img/ph_l.png' : URL.createObjectURL(info[1]);
                }
                else {
                    previewUrl = 'img/ph_l.png';
                }
                if(info[2]) {
                    this._generatePreview([info[2]]);
                }
                store.dispatch(MonitorActionCreator.previewFile(info));
                this.forceUpdate();
            });
        };

        this.unsubscribeEnterKey = shortcuts.on(['RETURN'], e => {
            e.preventDefault();
            if(filename) {
                handlePreviewFile();
                this.unsubscribeEnterKey();
            }
        });
        handlePreviewFile();
    }

    _handleUpload = (e) => {
        const fileElem = e.target as HTMLInputElement;
        if(fileElem.files.length > 0) {
            fileToBeUpload = fileElem.files[0];
            this._existFileInDirectory(store.getState().Monitor.currentPath, fileToBeUpload.name.replace(/ /g, '_')).then((exist) => {
                if(exist) {
                    AlertActions.showPopupYesNo('UPLOAD_FILE', lang.monitor.fileExistContinue);
                }
                else {
                    let info = fileToBeUpload.name.split('.'),
                        ext  = info[info.length - 1];

                    if(ext === 'gcode') {
                        AlertActions.showPopupYesNo('CONFIRM_G_TO_F', lang.monitor.confirmGToF);
                    }
                    else {
                        this._doFileUpload(fileToBeUpload);
                    }
                }
            });
            e.target.value = null;
        }
    }

    _handleDownload = () => {
        const downloadProgressDisplay = (p) => {
            store.dispatch(MonitorActionCreator.setDownloadProgress(p));
        };
        let { Monitor } = store.getState();

        DeviceMaster.downloadFile(Monitor.currentPath, Monitor.selectedItem.name).then(async (file) => {
            store.dispatch(MonitorActionCreator.setDownloadProgress({size:'', left:''}));

            const targetFilePath = await ElectronDialogs.saveFileDialog(Monitor.selectedItem.name , Monitor.selectedItem.name, [], true);
            if (targetFilePath) {
                const fs = requireNode('fs');
                const arrBuf = await new Response(file[1]).arrayBuffer();
                const buf = Buffer.from(arrBuf);
                fs.writeFileSync(targetFilePath, buf);
            }
        }).progress((p) => {
            downloadProgressDisplay(p);
        }).fail((error) => {
            // TODO: show download error
        });
    }

    _handleToggleCamera = () => {
        let { Monitor } = store.getState();
        if(Monitor.mode === mode.CAMERA) {
            this._handleBack();
        }
        else {
            this._addHistory();
            store.dispatch(MonitorActionCreator.changeMode(GlobalConstants.CAMERA));
        }
    }

    _getCameraOffset = async () => {
        const isBorderless = BeamboxPreference.read('borderless') || false;
        const configName = isBorderless ? 'camera_offset_borderless' : 'camera_offset';
        const resp = await DeviceMaster.getDeviceSetting(configName);
        console.log(`Reading ${configName}\nResp = ${resp.value}`);
        resp.value = ` ${resp.value}`;
        let cameraOffset = {
            x:          Number(/ X:\s?(\-?\d+\.?\d+)/.exec(resp.value)[1]),
            y:          Number(/ Y:\s?(\-?\d+\.?\d+)/.exec(resp.value)[1]),
            angle:      Number(/R:\s?(\-?\d+\.?\d+)/.exec(resp.value)[1]),
            scaleRatioX: Number((/SX:\s?(\-?\d+\.?\d+)/.exec(resp.value) || /S:\s?(\-?\d+\.?\d+)/.exec(resp.value))[1]),
            scaleRatioY: Number((/SY:\s?(\-?\d+\.?\d+)/.exec(resp.value) || /S:\s?(\-?\d+\.?\d+)/.exec(resp.value))[1]),
        };
        console.log(`Got ${configName}`, cameraOffset);
        if ((cameraOffset.x === 0) && (cameraOffset.y === 0)) {
            cameraOffset = {
                x: Constant.camera.offsetX_ideal,
                y: Constant.camera.offsetY_ideal,
                angle: 0,
                scaleRatioX: Constant.camera.scaleRatio_ideal,
                scaleRatioY: Constant.camera.scaleRatio_ideal,
            };
        }
        store.dispatch(MonitorActionCreator.setCameraOffset(cameraOffset));
    }

    _handleToggleRelocate = async () => {
        const { Monitor } = store.getState();
        if( Monitor.mode === mode.CAMERA_RELOCATE ) {
            this._handleBack();
        }
        else {
            this._addHistory();
            Progress.openNonstopProgress({
                id: 'prepare-relocate',
                message: lang.monitor.prepareRelocate,
            });
            await this._getCameraOffset();
            await DeviceMaster.enterRawMode();
            await DeviceMaster.rawSetRotary(false); // Disable Rotary
            await DeviceMaster.rawHome();
            Progress.popById('prepare-relocate');
            store.dispatch(MonitorActionCreator.setCurrentPosition({x: 0, y: 0}));
            store.dispatch(MonitorActionCreator.changeMode(GlobalConstants.CAMERA_RELOCATE));
        }
    }

    _handleRelocate = () => {
        const { Monitor } = store.getState();
        const { currentPosition } = Monitor
        store.dispatch(MonitorActionCreator.setRelocateOrigin(currentPosition));
        this._handleBack();
    }

    _handleGo = async () => {
        messageViewed = false;
        let { Monitor, Device } = store.getState();
        let startingStatus = { st_label: 'INIT', st_id: 1 };
        const { relocateOrigin } = Monitor;

        store.dispatch(DeviceActionCreator.updateDeviceStatus(startingStatus));

        if (Monitor.mode === GlobalConstants.CAMERA) {
            this._stopCamera();
        }
        store.dispatch(MonitorActionCreator.changeMode(GlobalConstants.PRINT));

        if(Device.status.st_label === DeviceConstants.IDLE) {
            let { fCode } = this.props;

            const device = DeviceMaster.currentDevice.info;
            const vc = VersionChecker(device.version);
            if (vc.meetRequirement('RELOCATE_ORIGIN')) {
                await DeviceMaster.setOriginX(relocateOrigin.x);
                await DeviceMaster.setOriginY(relocateOrigin.y);
            }

            if(fCode) {
                this._stopReport();
                DeviceMaster.go(fCode)
                .then(() => {
                    this._startReport();
                    store.dispatch(MonitorActionCreator.setUploadProgress(''));
                })
                .progress((progress: IProgress) => {
                    let p = Math.floor(progress.step / progress.total * 100);
                    store.dispatch(MonitorActionCreator.setUploadProgress(p));
                })
                .fail((error: {error: string[]}) => {
                    // TODO: figuire out what error is
                    // reset status
                    store.dispatch(MonitorActionCreator.setUploadProgress(''));
                    store.dispatch(MonitorActionCreator.changeMode(mode.PREVIEW));
                    this._startReport();
                    AlertActions.showPopupError('', lang.message.unable_to_start + error.error.join('_'));
                });
            }
            else {
                let executeGo = () => {
                    this._stopReport();
                    DeviceMaster.goFromFile(Monitor.currentPath, Monitor.selectedItem.name);
                    this._startReport();
                };

                if(this._isAbortedOrCompleted()) {
                    DeviceMaster.quit().then(() => {
                        executeGo();
                    });
                }
                else {
                    executeGo();
                }
            }
        }
        else if(this._isAbortedOrCompleted() && Monitor.mode === GlobalConstants.FILE_PREVIEW) {
            // TODO: this to be changed when alert action is restructured
            if(confirm(lang.monitor.forceStop)) {
                DeviceMaster.quit().then(async () => {
                    const device = DeviceMaster.currentDevice.info;
                    const vc = VersionChecker(device.version);
                    if (vc.meetRequirement('RELOCATE_ORIGIN')) {
                        await DeviceMaster.setOriginX(relocateOrigin.x);
                        await DeviceMaster.setOriginY(relocateOrigin.y);
                    }
                    DeviceMaster.goFromFile(Monitor.currentPath, Monitor.selectedItem.name);
                });
            }
        }
        else {
            DeviceMaster.resume();
        }
    }

    _handlePause = () => {
        DeviceMaster.pause();
    }

    _handleStop = () => {
        if(statusId < 0) {
            AlertActions.showPopupYesNo('KICK', lang.monitor.forceStop);
        }
        else {
            let { Monitor, Device } = store.getState();
            if(this._isAbortedOrCompleted()) {
                //DeviceMaster.quit();
                store.dispatch(MonitorActionCreator.showWait());
            }
            else if(this._isPaused()) {
                DeviceMaster.stop();
            }
            else {
                let p: any = $.Deferred();
                if(Device.status.st_id < 0) {
                    if(confirm(lang.monitor.forceStop)) {
                        p = DeviceMaster.kick();
                    }
                    else {
                        p.resolve();
                    }
                }
                else {
                    p = DeviceMaster.stop();
                }
                p.always(() => {
                    let mode = Monitor.selectedFileInfo.length > 0 ? GlobalConstants.FILE_PREVIEW : GlobalConstants.PREVIEW;
                    if(Device.status.st_id < 0) {
                        mode = GlobalConstants.FILE;
                        this._dispatchFolderContent('');
                    }
                    else if(Monitor.mode === GlobalConstants.CAMERA) {
                        mode = GlobalConstants.CAMERA;
                    }
                    store.dispatch(MonitorActionCreator.changeMode(mode));
                });
            }
        }
    }

    _addHistory = () => {
        let { Monitor } = store.getState(),
            history = { mode: Monitor.mode, previewUrl: previewUrl, path: Monitor.currentPath };

        _history.push(history);
    }

    _startReport = () => {
        this.reporter = setInterval(() => {
            // if(window.stopReport === true) { return; }
            DeviceMaster.getReport().fail((error) => {

                //Maybe we should handle SUBSYSTEM_ERROR rather than doing this. 2018/1/12
                //It was said that SUBSYSTEM_ERROR will not appear anymore 2018/1/13
                //so the following 2 lines can be deleted
                if(error.error && error.error[0] === "SUBSYSTEM_ERROR") {
                    this._processReport(error);
                } else {
                    clearInterval(this.reporter);
                    this._processReport(error);
                }
            }).then((result) => {
                store.dispatch(DeviceActionCreator.updateDeviceStatus(result));
                this._processReport(result);
            });
        }, refreshTime);
    }

    _stopReport = () => {
        clearInterval(this.reporter);
    }

    _generatePreview = (info) => {
        if(info === '') { return; }
        info = info || [];

        if(!this._hasFCode()) {
            let blobIndex = info.findIndex(o => o instanceof Blob);
            if(blobIndex > 0) {
                previewUrl = window.URL.createObjectURL(info[blobIndex]);
            }
        }

        this.forceUpdate();
    }

    _processReport = (report) => {
        let { Monitor } = store.getState();
        if(!report.error) {
            if(this._isAbortedOrCompleted() && openedFrom !== GlobalConstants.DEVICE_LIST) {
                //DeviceMaster.quit();
            }
            if(showingPopup) {
                showingPopup = false;
                AlertActions.closePopup();
            }
        }
        else {
            let error = report.error;
            let state = [
                DeviceConstants.status.PAUSED_FROM_STARTING,
                DeviceConstants.status.PAUSED_FROM_RUNNING,
                DeviceConstants.status.ABORTED,
                DeviceConstants.status.PAUSING_FROM_RUNNING,
                DeviceConstants.status.PAUSING_FROM_STARTING
            ];

            // always process as error, hard fix for backend
            error = (error instanceof Array ? error : [error]);

            if(showingPopup) {
                if(error.length === 0) {
                    showingPopup = false;
                    AlertActions.closePopup();
                }
            }

            if(error[0] === 'TIMEOUT') {
                if(this.reconnected) {
                    AlertActions.showPopupError('', lang.message.connectionTimeout);
                    this.props.onClose();
                }
                else {
                    this.reconnected = true;
                    DeviceMaster.reconnect();
                }

                return;
            }

            // only display error during these state
            if(state.indexOf(report.st_id) >= 0) {
                // jug down errors as main and sub error for later use

                let errorMessage = DeviceErrorHandler.translate(error);
                console.log("ERR ", errorMessage, error);

                if(
                    !messageViewed &&
                    !showingPopup &&
                    errorMessage.length > 0
                ) {
                    AlertActions.showPopupRetry(_id, errorMessage);
                    showingPopup = true;
                }
            }

            if(this._isAbortedOrCompleted()) {
                //DeviceMaster.quit();
                if (Monitor.mode !== GlobalConstants.CAMERA) {
                    store.dispatch(MonitorActionCreator.changeMode(mode.PREVIEW));
                }
            }
        }
    }

    _isError = (s) => {
        return operationStatus.indexOf(s) < 0;
    }

    _isAbortedOrCompleted = () => {
        let { Device } = store.getState();
        return (
            Device.status.st_id === DeviceConstants.status.ABORTED ||
            Device.status.st_id === DeviceConstants.status.COMPLETED
        );
    }

    _isPaused = () => {
        let { Device } = store.getState();
        let s = [
            DeviceConstants.status.PAUSED,
            DeviceConstants.status.PAUSED_FROM_STARTING,
            DeviceConstants.status.PAUSING_FROM_STARTING,
            DeviceConstants.status.PAUSED_FROM_RUNNING,
            DeviceConstants.status.PAUSING_FROM_RUNNING
        ];
        return s.indexOf(Device.status.st_id) > 0;
    }

    _retrieveFolderContent = (path) => {
        let d = $.Deferred();

        DeviceMaster.ls(path).then((result) => {
            if(result.error) {
                if(result.error !== DeviceConstants.NOT_EXIST) {
                    AlertActions.showPopupError('ls error', result.error);
                    result.directories = [];
                }
            }
            currentDirectoryContent = result;
            start = 0;
            if(!usbExist && path === '') {
                let i = currentDirectoryContent.directories.indexOf('USB');
                if(i >= 0) {
                    currentDirectoryContent.directories.splice(i, 1);
                }
            }
            currentDirectoryContent.files = currentDirectoryContent.files.map((file) => {
                let a = [];
                a.push(file);
                return a;
            });
            this._renderFolderFilesWithPreview();
            d.resolve(currentDirectoryContent);
        });

        return d.promise();
    }

    _renderFolderFilesWithPreview = () => {
        if(
            start > currentDirectoryContent.files.length ||
            currentDirectoryContent.files.length === 0
        ) {
            return;
        }

        const handleCallback = (filesArray) => {
            if(start > currentDirectoryContent.files.length) { return; }
            let files = currentDirectoryContent.files;

            Array.prototype.splice.apply(files, [start, filesArray.length].concat(filesArray));
            let content = store.getState().Monitor.currentFolderContent;
            content.files = files;
            store.dispatch(MonitorActionCreator.updateFoldercontent(content));
            start = start + scrollSize;
            if(end < currentDirectoryContent.files.length) {
                this._renderFolderFilesWithPreview();
            }
        };

        let end = start + scrollSize;
        if(end > currentDirectoryContent.files.length) {
            end = currentDirectoryContent.files.length;
        }
        this._retrieveFileInfo(start, end, handleCallback);
    }

    _retrieveFileInfo = (index, end, callback, filesArray: any[] = []) => {
        if(index < end) {
            if(currentDirectoryContent.files.length === 0) { return; }
            DeviceMaster.fileInfo(
                currentDirectoryContent.path,
                currentDirectoryContent.files[index][0]
            ).then((r) => {
                r.error ? filesArray.push(currentDirectoryContent.files[index]) : filesArray.push(r);
                this._retrieveFileInfo(index + 1, end, callback, filesArray);
            }).fail((error) => {
                // TODO: display file info error
            });
        }
        else {
            callback(filesArray);
        }
    }

    _checkUSBFolderExistance = () => {
        let d = $.Deferred();
        DeviceMaster.ls('USB').then(() => {
            store.dispatch(DeviceActionCreator.updateUsbFolderExistance(true));
            d.resolve();
        }).fail(() => {
            store.dispatch(DeviceActionCreator.updateUsbFolderExistance(false));
            d.resolve();
        });

        return d.promise();
    }

    _findObjectContainsProperty = (infoArray, propertyName) => {
        return infoArray.filter((o) => Object.keys(o).some(o => o === propertyName));
    }

    onBlur = (e) => {
        e.preventDefault();
        this.setState({ focused: false });
    }

    onFocus = (e) => {
        e.preventDefault();
        this.setState({ focused: true });
    }

    render() {
        let subClass = ClassNames('sub', { 'hide': false });

        return (
            <div className="flux-monitor" tabIndex={1} onBlur={this.onBlur} onFocus={this.onFocus}>
                <div className="main">
                    <MonitorHeader
                        name={DeviceMaster.currentDevice.info.name}
                        source = {openedFrom}
                        history = {_history}
                        context = {this.childContext}
                        onBackClick = {this._handleBack}
                        onFolderClick = {this._handleBrowseFolder}
                        onCloseClick = {this._handleClose} />
                    <MonitorDisplay
                        selectedDevice = {this.props.selectedDevice}
                        previewUrl = {previewUrl}
                        context = {this.childContext}
                        onFolderClick = {this._handleFolderclick}
                        onFolderDoubleClick = {this._handleFolderDoubleClick}
                        onFileClick = {this._handleFileClick}
                        onFileDoubleClick = {this._handleFileDoubleClick}
                        onFileCrossIconClick = {this._handleFileCrossIconClick}
                        onToggleRelocate= {this._handleToggleRelocate}/>
                    <MonitorControl
                        source = {openedFrom}
                        previewUrl = {previewUrl}
                        context = {this.childContext}
                        onGo = {this._handleGo}
                        onPause = {this._handlePause}
                        onStop = {this._handleStop}
                        onUpload = {this._handleUpload}
                        onDownload = {this._handleDownload}
                        onToggleCamera = {this._handleToggleCamera}
                        onCancelRelocate = {this._handleBack}
                        onRelocate = {this._handleRelocate} />
                </div>
                <div className={subClass}>
                    <MonitorInfo
                        context = {this.childContext} />
                </div>
            </div>
        );
    }
};

Monitor.propTypes = {
    lang: PropTypes.object,
    selectedDevice: PropTypes.object,
    fCode: PropTypes.object,
    slicingStatus: PropTypes.object,
    previewUrl: PropTypes.string,
    opener: PropTypes.string,
    onClose: PropTypes.func
}

export default Monitor;
