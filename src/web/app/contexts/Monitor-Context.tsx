const React = requireNode('react');

import Alert from 'app/actions/alert-caller';
import BeamboxPreference from 'app/actions/beambox/beambox-preference';
import Constant from 'app/actions/beambox/constant';
import ElectronDialogs from 'app/actions/electron-dialogs';
import Progress from 'app/actions/progress-caller';
import AlertConstants from 'app/constants/alert-constants';
import DeviceConstants from 'app/constants/device-constants';
import { Mode, ItemType } from 'app/constants/monitor-constants';
import DeviceErrorHandler from 'helpers/device-error-handler';
import DeviceMaster from 'helpers/device-master';
import MonitorStatus from 'helpers/monitor-status';
import OutputError from 'helpers/output-error';
import VersionChecker from 'helpers/version-checker';
import i18n from 'helpers/i18n';
import { IReport } from 'interfaces/IDevice';
import { IProgress } from 'interfaces/IProgress';

let LANG = i18n.lang;
const updateLang = () => {
    LANG = i18n.lang;
}

const { createContext } = React;

const getFirstBlobInArray = (array: any[]) => {
    const id = array.findIndex((elem) => elem instanceof Blob);
    if (id >= 0) {
        return array[id];
    }
    return null;
};

const findKeyInObjectArray = (array: any[], key: string) => {
    const res = array.filter((o) => Object.keys(o).some(name => name === key));
    if (res.length > 0) {
        return res[0][key];
    }
    return null;
}

export const MonitorContext = createContext();

export class MonitorContextProvider extends React.Component {
    constructor(props) {
        super(props);
        const { mode, previewTask } = props;
        updateLang();
        this.didErrorPopped = false;
        this.modeBeforeCamera = mode;
        this.modeBeforeRelocate = mode;
        this.state = {
            mode,
            currentPath: [],
            highlightedItem: {},
            fileInfo: null,
            previewTask,
            workingTask: null,
            taskImageURL: mode === Mode.PREVIEW ? previewTask.taskImageURL : null,
            taskTime: mode === Mode.PREVIEW ? previewTask.taskTime : null,
            report: {},
            uploadProgress: null,
            downloadProgress: null,
            shouldUpdateFileList: false,
            currentPosition: { x: 0, y: 0 },
            relocateOrigin: { x: 0, y: 0 },
        };
    }

    async componentDidMount() {
        await this.fetchInitialInfo();
        this.startReport();
        const { mode } = this.state;
        if (mode === Mode.WORKING) {
            const taskInfo = await this.getWorkingTaskInfo();
            const { imageBlob, taskTime } = this.getTaskInfo(taskInfo);
            let taskImageURL = null;
            if (imageBlob) {
                taskImageURL = URL.createObjectURL(imageBlob);
            }
            this.setState({
                taskImageURL,
                taskTime,
                workingTask: taskInfo,
            });
        }
    }

    componentDidUpdate(prevProps, prevState) {
        const { taskImageURL, previewTask } = this.state;
        if (prevState.taskImageURL && prevState.taskImageURL !== taskImageURL) {
            if (previewTask && prevState.taskImageURL !== previewTask.taskImageURL) {
                URL.revokeObjectURL(prevState.taskImageURL);
            }
        }
    }

    componentWillUnmount() {
        this.stopReport();
        const { taskImageURL } = this.state;
        URL.revokeObjectURL(taskImageURL);
    }

    startReport() {
        this.reporter = setInterval(async () => {
            try {
                const report = await DeviceMaster.getReport();
                this.processReport(report);
            } catch (error) {
                if (error && error.status === 'raw') {
                    return;
                }
                console.error('Monitor report error:', error);
                DeviceMaster.reconnect();
                // this.processReport(error);
            }
        }, 1500)
    }

    stopReport() {
        clearInterval(this.reporter);
        this.reporter = null;
    }

    async fetchInitialInfo() {
        try {
            const report = await DeviceMaster.getReport();
            this.processReport(report);
        } catch (error) {
            console.log('monitor fetch initial info error:\n', error);
            if (error.status === 'fatal') {
                await DeviceMaster.reconnect();
            }
        }
    }

    async processReport(report: IReport) {
        const currentReport = this.state.report;
        for (let key in report) {
            const { mode } = this.state;
            if (currentReport[key] === undefined || JSON.stringify(currentReport[key]) !== JSON.stringify(report[key])) {
                console.log(key, 'changed');
                if (report.st_id > 0 && (mode !== Mode.WORKING || key === 'session')) {
                    const keepsCameraMode = mode === Mode.CAMERA && MonitorStatus.allowedCameraStatus.includes(report.st_id);
                    if (!keepsCameraMode) {
                        console.log('to work mode');
                        this.enterWorkingMode();
                    }
                } else if (report.st_id === DeviceConstants.status.IDLE) {
                    if (mode === Mode.WORKING || (mode === Mode.CAMERA && this.modeBeforeCamera === Mode.WORKING)) {
                        this.exitWorkingMode();
                    }
                }
                this.setState({ report });
                break;
            }
        }

        if (!report.error || report.error.length === 0) {
            return;
        }

        let error = report.error;
        error = (error instanceof Array ? error : [error]);

        if (error[0] === 'TIMEOUT') {
            try {
                await DeviceMaster.reconnect();
            } catch (e) {
                console.error('Error when reconnect in monitor', e);
                Alert.popUp({
                    id: 'monitor-error',
                    type: AlertConstants.SHOW_POPUP_ERROR,
                    message: LANG.message.connectionTimeout,
                });
                this.props.onClose();
            }
            return;
        }

        const state = [
            DeviceConstants.status.PAUSED_FROM_STARTING,
            DeviceConstants.status.PAUSED_FROM_RUNNING,
            DeviceConstants.status.ABORTED,
            DeviceConstants.status.PAUSING_FROM_RUNNING,
            DeviceConstants.status.PAUSING_FROM_STARTING
        ];

        if (state.includes(report.st_id)) {
            const errorMessage = DeviceErrorHandler.translate(error);

            const handleRetry = async () => {
                const pauseStates = [
                    DeviceConstants.status.PAUSED,
                    DeviceConstants.status.PAUSED_FROM_STARTING,
                    DeviceConstants.status.PAUSED_FROM_RUNNING,
                    DeviceConstants.status.PAUSING_FROM_STARTING,
                    DeviceConstants.status.PAUSING_FROM_RUNNING,
                ];
                if (report.st_id === DeviceConstants.status.ABORTED) {
                    await DeviceMaster.quit();
                    this.onPlay();
                } else if (pauseStates.includes(report.st_id)) {
                    DeviceMaster.resume();
                }
            };

            const handleReport = async () => {
                const targetFilePath = await ElectronDialogs.saveFileDialog(LANG.beambox.popup.bug_report, 'devicelogs.txt', [
                    { extensionName: 'txt', extensions: ['txt'] }
                ], false);
                if (!targetFilePath) return;

                const bxLogs = OutputError.getOutput();
                const fs = requireNode('fs');
                fs.writeFileSync(targetFilePath, bxLogs.join(''));

                this.stopReport();
                const { device } = this.props;
                const vc = VersionChecker(device.version);
                const playerLogName = vc.meetRequirement('NEW_PLAYER') ? 'playerd.log' : 'fluxplayerd.log';
                Progress.openSteppingProgress({ id: 'get_log', message: 'downloading' });
                const logFiles = await DeviceMaster.getLogsTexts([playerLogName, 'fluxrobotd.log'], (progress: { completed: number, size: number }) => {
                    Progress.update('get_log', { message: 'downloading', percentage: progress.completed / progress.size * 100 });
                });
                Progress.popById('get_log');
                this.startReport();

                for (let key in logFiles) {
                    const blob = getFirstBlobInArray(logFiles[key]);
                    if (blob) {
                        fs.appendFileSync(targetFilePath, `\n===\n${key}\n===\n`);
                        const arrBuf = await new Response(blob).arrayBuffer();
                        const buf = Buffer.from(arrBuf);
                        fs.appendFileSync(targetFilePath, buf);
                    }
                }
            }

            const id = error.join('_');
            if (!Alert.checkIdExist(id) && !this.didErrorPopped) {
                if (error[0] === 'HARDWARE_ERROR' || error[0] === 'USER_OPERATION') {
                    this.didErrorPopped = true;
                    Alert.popUp({
                        id,
                        type: AlertConstants.SHOW_POPUP_ERROR,
                        message: errorMessage,
                        buttonType: AlertConstants.RETRY_CANCEL,
                        onRetry: handleRetry,
                    });
                } else {
                    this.didErrorPopped = true;
                    Alert.popUp({
                        id,
                        type: AlertConstants.SHOW_POPUP_ERROR,
                        message: errorMessage,
                        primaryButtonIndex: 0,
                        buttonLabels: [LANG.alert.retry, LANG.monitor.bug_report, LANG.alert.cancel],
                        callbacks: [handleRetry, handleReport, () => { }],
                    });
                }
            }
        }
    }

    async getWorkingTaskInfo() {
        const res = await DeviceMaster.getPreviewInfo();
        return res;
    }

    getTaskInfo(info: any[]) {
        const imageBlob = getFirstBlobInArray(info);
        const taskTime = findKeyInObjectArray(info, 'TIME_COST');

        return { imageBlob, taskTime };
    }

    enterWorkingMode = async (task?: { taskImageURL: string, taskTime: number }) => {
        if (!task) {
            const taskInfo = await this.getWorkingTaskInfo();
            const { imageBlob, taskTime } = this.getTaskInfo(taskInfo);
            let taskImageURL = null;
            if (imageBlob) {
                taskImageURL = URL.createObjectURL(imageBlob);
            }
            this.setState({
                mode: Mode.WORKING,
                taskImageURL,
                taskTime,
            });
        } else {
            this.setState({
                mode: Mode.WORKING,
                taskImageURL: task.taskImageURL,
                taskTime: task.taskTime,
            });
        }
    }

    exitWorkingMode = () => {
        const { mode, fileInfo, previewTask } = this.state;
        console.log(fileInfo);
        if (previewTask) {
            this.setState({
                mode: mode === Mode.CAMERA ? Mode.CAMERA : Mode.PREVIEW,
                taskImageURL: previewTask.taskImageURL,
                taskTime: previewTask.taskTime,
            });
            this.modeBeforeCamera = Mode.PREVIEW;
        } else if (fileInfo) {
            const { imageBlob, taskTime } = this.getTaskInfo(fileInfo);
            const taskImageURL = URL.createObjectURL(imageBlob); 
            this.setState({
                mode: mode === Mode.CAMERA ? Mode.CAMERA : Mode.FILE_PREVIEW,
                taskImageURL,
                taskTime,
            });
            this.modeBeforeCamera = Mode.FILE_PREVIEW;
        } else {
            this.setState({
                mode: mode === Mode.CAMERA ? Mode.CAMERA : Mode.FILE
            });
            this.modeBeforeCamera = Mode.FILE;
        }
    }

    toggleCamera = () => {
        const { mode } = this.state;
        if (mode !== Mode.CAMERA) {
            this.modeBeforeCamera = mode;
            this.setState({ mode: Mode.CAMERA });
        } else {
            this.setState({ mode: this.modeBeforeCamera });
        }
    }

    startRelocate = async () => {
        const { mode } = this.state;
        if (mode === Mode.CAMERA_RELOCATE) return;

        this.modeBeforeRelocate = mode;
        const getCameraOffset = async () => {
            const isBorderless = BeamboxPreference.read('borderless') || false;
            const configName = isBorderless ? 'camera_offset_borderless' : 'camera_offset';
            const resp = await DeviceMaster.getDeviceSetting(configName);
            console.log(`Reading ${configName}\nResp = ${resp.value}`);
            resp.value = ` ${resp.value}`;
            let cameraOffset = {
                x: Number(/ X:\s?(\-?\d+\.?\d+)/.exec(resp.value)[1]),
                y: Number(/ Y:\s?(\-?\d+\.?\d+)/.exec(resp.value)[1]),
                angle: Number(/R:\s?(\-?\d+\.?\d+)/.exec(resp.value)[1]),
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
            return cameraOffset;
        }

        Progress.popById('prepare-relocate');
        Progress.openNonstopProgress({
            id: 'prepare-relocate',
            message: LANG.monitor.prepareRelocate,
        });
        this.stopReport();
        try {
            const cameraOffset = await getCameraOffset();
            await DeviceMaster.enterRawMode();
            await DeviceMaster.rawSetRotary(false);
            await DeviceMaster.rawHome();
            this.setState({
                mode: Mode.CAMERA_RELOCATE,
                cameraOffset,
                currentPosition: { x: 0, y: 0 }
            });
        } catch (error) {
            console.error('Error when entering relocate mode', error);
            this.startReport();
        }
        Progress.popById('prepare-relocate');
    }

    endRelocate = () => {
        this.setState({ mode: this.modeBeforeRelocate }, () => {
            if (!this.reporter) {
                this.startReport();
            }
        });
    }

    onNavigationBtnClick = () => {
        const { mode, currentPath, previewTask } = this.state;
        if (mode === Mode.FILE) {
            if (currentPath.length > 0) {
                currentPath.pop();
                this.setState({
                    currentPath,
                    highlightedItem: {},
                });
            } else if (!!previewTask) {
                console.log(previewTask.taskImageURL);
                this.setState({
                    mode: Mode.PREVIEW,
                    taskImageURL: previewTask.taskImageURL,
                    taskTime: previewTask.taskTime
                });
            }
        } else if (mode === Mode.PREVIEW || mode === Mode.FILE_PREVIEW) {
            this.setState({
                mode: Mode.FILE,
                fileInfo: null,
                highlightedItem: {},
            });
        } else if (mode === Mode.CAMERA) {
            this.toggleCamera();
        } else if (mode === Mode.CAMERA_RELOCATE) {
            this.endRelocate();
        }
    }

    onHighlightItem = (item: { name: string, type: ItemType }) => {
        const { highlightedItem } = this.state;
        if (!highlightedItem || highlightedItem.name !== item.name || highlightedItem.type !== item.type) {
            this.setState({ highlightedItem: item });
        }
        return;
    }

    onSelectFolder = (folderName: string) => {
        const { currentPath } = this.state;
        currentPath.push(folderName);
        this.setState({
            currentPath,
            highlightedItem: {},
        });
    }

    onSelectFile = async (fileName: string, fileInfo) => {
        const { currentPath } = this.state;
        const path = currentPath.join('/')
        if (!fileInfo) {
            fileInfo = await DeviceMaster.fileInfo(path, fileName);
        }
        console.log(fileInfo);
        const { imageBlob, taskTime } = this.getTaskInfo(fileInfo);
        let taskImageURL = null;
        if (imageBlob) {
            taskImageURL = URL.createObjectURL(imageBlob);
        }
        console.log(fileInfo);
        this.setState({
            mode: Mode.FILE_PREVIEW,
            fileInfo: fileInfo,
            taskImageURL,
            taskTime,
        });
    }

    setShouldUpdateFileList = (val: boolean) => {
        this.setState({ shouldUpdateFileList: val });
    }

    onUpload = async (e) => {
        const fileElem = e.target as HTMLInputElement;
        if (fileElem.files.length > 0) {
            const doesFileExistInDirectory = async (path: string, fileName: string) => {
                fileName = fileName.replace('.gcode', '.fc');
                try {
                    const res = await DeviceMaster.fileInfo(path, fileName);
                    if (!res.error || res.error.length === 0) {
                        console.log(res.error, res.error.length === 0);
                        return true;
                    }
                    return false;
                } catch (error) {
                    return false;
                }
            };
            const { currentPath } = this.state;
            const path = currentPath.join('/');
            const fileToBeUpload = fileElem.files[0];
            const fileExist = await doesFileExistInDirectory(path, fileToBeUpload.name.replace(/ /g, '_'));

            const doUpload = (file: File) => {
                this.setState({ uploadProgress: 0 });
                const reader = new FileReader();
                reader.readAsArrayBuffer(file);
                reader.onload = async () => {
                    const fileInfo = file.name.split('.');
                    const ext = fileInfo[fileInfo.length - 1];
                    let type;
                    let isValid = false;

                    if (ext === 'fc') {
                        type = { type: 'application/fcode' };
                        isValid = true;
                    } else if (ext === 'gcode') {
                        type = { type: 'text/gcode' };
                        isValid = true;
                    }

                    if (isValid) {
                        const blob = new Blob([reader.result], type);

                        await DeviceMaster.uploadToDirectory(blob, path, file.name, (progress: IProgress) => {
                            let p = Math.floor(progress.step / progress.total * 100);
                            this.setState({ uploadProgress: p });
                        });

                        this.setState({ uploadProgress: null });
                        this.setShouldUpdateFileList(true);
                    } else {
                        Alert.popUp({
                            type: AlertConstants.SHOW_POPUP_INFO,
                            message: LANG.monitor.extensionNotSupported,
                        });
                    }
                };
            };

            if (fileExist) {
                Alert.popUp({
                    type: AlertConstants.SHOW_POPUP_INFO,
                    message: LANG.monitor.fileExistContinue,
                    buttonType: AlertConstants.YES_NO,
                    onYes: () => doUpload(fileToBeUpload),
                });
            } else {
                doUpload(fileToBeUpload);
            }
        }
    }

    onDownload = async () => {
        try {
            const { currentPath, highlightedItem } = this.state;
            const path = currentPath.join('/');
            const file = await DeviceMaster.downloadFile(path, highlightedItem.name, (p) => {
                this.setState({ downloadProgress: p });
            });
            this.setState({ downloadProgress: null });
            const targetFilePath = await ElectronDialogs.saveFileDialog(highlightedItem.name, highlightedItem.name, [], true);
            if (targetFilePath) {
                const fs = requireNode('fs');
                const arrBuf = await new Response(file[1]).arrayBuffer();
                const buf = Buffer.from(arrBuf);
                fs.writeFileSync(targetFilePath, buf);
            }
        } catch (e) {
            console.error('Error when downloading file', e);
        }
    }

    onDeleteFile = () => {
        const { currentPath, highlightedItem } = this.state;
        const path = currentPath.join('/');
        Alert.popUp({
            type: AlertConstants.SHOW_POPUP_INFO,
            message: LANG.monitor.confirmFileDelete,
            buttonType: AlertConstants.YES_NO,
            onYes: async () => {
                await DeviceMaster.deleteFile(path, highlightedItem.name);
                this.setShouldUpdateFileList(true);
            },
        })
    }

    onPlay = async () => {
        const { device } = this.props;
        const { mode, report, currentPath, fileInfo, relocateOrigin } = this.state;
        this.didErrorPopped = false;

        if (report.st_id === DeviceConstants.status.IDLE) {
            const vc = VersionChecker(device.version);
            console.log(device.version);
            if (vc.meetRequirement('RELOCATE_ORIGIN')) {
                console.log(relocateOrigin);
                await DeviceMaster.setOriginX(relocateOrigin.x);
                await DeviceMaster.setOriginY(relocateOrigin.y);
            }

            if (mode === Mode.PREVIEW) {
                const { previewTask } = this.state;
                const fCode = previewTask.fcodeBlob;
                try {
                    await DeviceMaster.go(fCode, (progress: IProgress) => {
                        let p = Math.floor(progress.step / progress.total * 100);
                        this.setState({ uploadProgress: p });
                    });
                    this.setState({ uploadProgress: null });
                } catch (error) {
                    this.setState({ uploadProgress: null });
                    Alert.popUp({ type: AlertConstants.SHOW_POPUP_ERROR, message: LANG.message.unable_to_start + error.error.join('_') });
                }
            } else if (mode === Mode.FILE_PREVIEW) {
                await DeviceMaster.goFromFile(currentPath.join('/'), fileInfo[0]);
            }
        } else if (MonitorStatus.isAbortedOrCompleted(report)) {
            DeviceMaster.restart();
        } else {
            // PAUSED
            DeviceMaster.resume();
        }
    }

    onPause() {
        DeviceMaster.pause();
    }

    onStop = async () => {
        DeviceMaster.stop();
    }

    onMaintainMoveStart = () => {
        this.setState({ isMaintainMoving: true });
    }

    onMaintainMoveEnd = (x: number, y: number) => {
        this.setState({
            isMaintainMoving: false,
            currentPosition: { x, y },
        });
    }

    onRelocate = () => {
        const { currentPosition } = this.state;
        const { x, y } = currentPosition;
        this.setState({
            relocateOrigin: { x, y },
            mode: this.modeBeforeRelocate,
        })
    }

    render() {
        const { onClose } = this.props;
        const {
            enterWorkingMode,
            toggleCamera,
            startRelocate,
            endRelocate,
            onNavigationBtnClick,
            onHighlightItem,
            onSelectFolder,
            onSelectFile,
            setShouldUpdateFileList,
            onUpload,
            onDownload,
            onDeleteFile,
            onPlay,
            onPause,
            onStop,
            onMaintainMoveStart,
            onMaintainMoveEnd,
            onRelocate,
        } = this;
        return (
            <MonitorContext.Provider value={{
                onClose,
                ...this.state,
                enterWorkingMode,
                toggleCamera,
                startRelocate,
                endRelocate,
                onNavigationBtnClick,
                onHighlightItem,
                onSelectFolder,
                onSelectFile,
                setShouldUpdateFileList,
                onUpload,
                onDownload,
                onDeleteFile,
                onPlay,
                onPause,
                onStop,
                onMaintainMoveStart,
                onMaintainMoveEnd,
                onRelocate,
            }}>
                {this.props.children}
            </MonitorContext.Provider>
        );
    }
};