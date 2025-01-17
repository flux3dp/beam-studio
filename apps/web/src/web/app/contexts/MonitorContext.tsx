/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable react/sort-comp */
import * as React from 'react';

import Alert from 'app/actions/alert-caller';
import AlertConstants from 'app/constants/alert-constants';
import BeamboxPreference from 'app/actions/beambox/beambox-preference';
import Constant, { promarkModels } from 'app/actions/beambox/constant';
import dialog from 'implementations/dialog';
import DeviceConstants from 'app/constants/device-constants';
import DeviceErrorHandler from 'helpers/device-error-handler';
import DeviceMaster from 'helpers/device-master';
import eventEmitterFactory from 'helpers/eventEmitterFactory';
import exportFuncs from 'app/actions/beambox/export-funcs';
import i18n from 'helpers/i18n';
import MonitorStatus from 'helpers/monitor-status';
import OutputError from 'helpers/output-error';
import Progress from 'app/actions/progress-caller';
import promarkButtonHandler from 'helpers/device/promark/promark-button-handler';
import VersionChecker from 'helpers/version-checker';
import { IDeviceInfo, IReport } from 'interfaces/IDevice';
import { IProgress } from 'interfaces/IProgress';
import { ItemType, Mode } from 'app/constants/monitor-constants';
import { swiftrayClient } from 'helpers/api/swiftray-client';

const eventEmitter = eventEmitterFactory.createEventEmitter('monitor');

let LANG = i18n.lang;
const updateLang = () => {
  LANG = i18n.lang;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getFirstBlobInArray = (array: any[]) => {
  const id = array.findIndex((elem) => elem instanceof Blob);
  if (id >= 0) {
    return array[id];
  }
  return null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const findKeyInObjectArray = (array: any[], key: string) => {
  const res = array.filter((o) => Object.keys(o).some((name: string) => name === key));
  if (res.length > 0) {
    return res[0][key];
  }
  return null;
};

const {
  IDLE,
  PAUSED,
  PAUSED_FROM_STARTING,
  PAUSING_FROM_STARTING,
  PAUSED_FROM_RUNNING,
  PAUSING_FROM_RUNNING,
  ABORTED,
  ALARM,
  FATAL,
  COMPLETED,
  TOOLHEAD_CHANGE,
} = DeviceConstants.status;
const reportStates = new Set([
  PAUSED_FROM_STARTING,
  PAUSED_FROM_RUNNING,
  ABORTED,
  PAUSING_FROM_RUNNING,
  PAUSING_FROM_STARTING,
  ALARM,
  FATAL,
  TOOLHEAD_CHANGE,
  COMPLETED,
]);

interface Props {
  mode: Mode;
  previewTask?: { fcodeBlob: Blob; taskImageURL: string; taskTime: number; fileName: string };
  autoStart?: boolean;
  device: IDeviceInfo;
  children?: React.ReactNode;
  onClose: () => void;
}

interface State {
  mode: Mode;
  currentPath: string[];
  highlightedItem: {
    type?: ItemType;
    name?: string;
  };
  fileInfo: any[];
  previewTask: { fcodeBlob: Blob; taskImageURL: string; taskTime: number; fileName: string };
  workingTask: any;
  taskImageURL: string | null;
  taskTime: number | null;
  report: IReport;
  uploadProgress: number | null;
  downloadProgress: { left: number; size: number } | null;
  shouldUpdateFileList: boolean;
  currentPosition: { x: number; y: number };
  relocateOrigin: { x: number; y: number };
  cameraOffset?: {
    x: number;
    y: number;
    angle: number;
    scaleRatioX: number;
    scaleRatioY: number;
  };
  isMaintainMoving?: boolean;
}

interface Context extends State {
  onClose: () => void;
  onHighlightItem: (item: { name: string; type: ItemType }) => void;
  onSelectFolder: (folderName: string, absolute?: boolean) => void;
  onSelectFile: (fileName: string, fileInfo: any) => Promise<void>;
  uploadFile: (file: File) => Promise<void>;
  setShouldUpdateFileList: (val: boolean) => void;
  onDeleteFile: () => void;
  onMaintainMoveStart: () => void;
  onMaintainMoveEnd: (x: number, y: number) => void;
  setMonitorMode: (value: Mode) => void;
  onPlay: (forceResend?: boolean) => void;
  onPause: () => void;
  onStop: () => void;
  onDownload: () => Promise<void>;
  showUploadDialog: () => Promise<void>;
}

export const MonitorContext = React.createContext<Context>(null);

export class MonitorContextProvider extends React.Component<Props, State> {
  lastErrorId: string;

  modeBeforeCamera: Mode;

  modeBeforeRelocate: Mode;

  reporter: NodeJS.Timeout;

  isGettingReport: boolean;

  isClosed: boolean; // for swiftray handler

  autoStart: boolean;

  constructor(props: Props) {
    super(props);
    const { mode, previewTask, autoStart } = props;
    updateLang();
    this.isGettingReport = false;
    this.lastErrorId = null;
    this.modeBeforeCamera = mode;
    this.modeBeforeRelocate = mode;
    this.isClosed = false;
    this.autoStart = autoStart;
    this.state = {
      mode,
      currentPath: [],
      highlightedItem: {},
      fileInfo: null,
      previewTask,
      workingTask: null,
      taskImageURL: mode === Mode.PREVIEW ? previewTask.taskImageURL : null,
      taskTime: mode === Mode.PREVIEW ? previewTask.taskTime : null,
      report: {} as IReport,
      uploadProgress: null,
      downloadProgress: null,
      shouldUpdateFileList: false,
      currentPosition: { x: 0, y: 0 },
      relocateOrigin: { x: 0, y: 0 },
    };
  }

  // Use arrow function to bind 'this'
  onSwiftrayDisconnected = (): void => {
    this.handlePromarkConnection('disconnected');
    swiftrayClient.once('reconnected', (success: boolean) => {
      if (!this.isClosed) this.handlePromarkConnection('reconnected', success);
    });
  };

  async componentDidMount(): Promise<void> {
    await this.fetchInitialInfo();
    this.startReport();
    const { mode } = this.state;
    const { device } = this.props;
    if (promarkModels.has(device.model)) {
      swiftrayClient.on('disconnected', this.onSwiftrayDisconnected);
    }
    if (mode === Mode.WORKING) {
      if (promarkModels.has(device.model)) {
        const cachedTask = exportFuncs.getCachedPromarkTask(device.serial);
        if (cachedTask) {
          this.setState({
            taskImageURL: cachedTask.url,
            taskTime: cachedTask.timeCost,
          });
        }
      } else {
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
  }

  componentDidUpdate(prevProps: Props, prevState: State): void {
    const { taskImageURL, previewTask, report } = this.state;
    if (prevState.taskImageURL && prevState.taskImageURL !== taskImageURL) {
      if (previewTask && prevState.taskImageURL !== previewTask.taskImageURL) {
        URL.revokeObjectURL(prevState.taskImageURL);
      }
    }
    if (report.st_id === IDLE && this.autoStart) {
      this.autoStart = false;
      this.onPlay();
    }
  }

  componentWillUnmount(): void {
    this.stopReport();
    const { taskImageURL } = this.state;
    URL.revokeObjectURL(taskImageURL);
    swiftrayClient.off('disconnected', this.onSwiftrayDisconnected);
    this.isClosed = true;
  }

  handlePromarkConnection(type: string, success?: boolean): void {
    const id = 'promark-connection';
    const { onClose } = this.props;
    Alert.popById(id);
    Progress.popById(id);
    if (type === 'Promark') {
      // Promark disconnected
      Alert.popUp({
        id,
        message: i18n.lang.message.promark_disconnected,
      });
    } else if (type === 'disconnected') {
      // Swiftray disconnected
      Progress.openNonstopProgress({
        id,
        message: i18n.lang.message.swiftray_disconnected,
        onCancel: onClose,
      });
      this.setState((prev) => ({
        report: { ...prev.report, st_id: DeviceConstants.status.ABORTED },
      }));
    } else if (success) {
      // Swiftray and Promark reconnected
      Alert.popUp({
        id,
        message: i18n.lang.message.swiftray_reconnected,
        buttonType: AlertConstants.CONFIRM_CANCEL,
        onCancel: onClose,
        onConfirm: () => {},
      });
    } else {
      // Swiftray reconnected but Promark not
      Alert.popUp({
        id,
        message: i18n.lang.message.swiftray_reconnected,
        buttonType: AlertConstants.CUSTOM,
        buttonLabels: [i18n.lang.alert.confirm],
        callbacks: [onClose],
      });
    }
  }

  startReport(): void {
    if (this.reporter) clearInterval(this.reporter);
    this.reporter = setInterval(async () => {
      try {
        if (this.isGettingReport) return;
        this.isGettingReport = true;
        const report = await DeviceMaster.getReport();
        this.processReport(report);
      } catch (error) {
        if (error && error.status === 'raw') {
          return;
        }
        console.error('Monitor report error:', error);
        this.stopReport();
        const res = await DeviceMaster.reconnect();
        console.log(res);
        if (res.success) {
          this.startReport();
        } else {
          const { onClose } = this.props;
          const askRetryReconnect = () =>
            new Promise<boolean>((resolve) => {
              Alert.popUp({
                id: 'monitor-reconnect',
                type: AlertConstants.SHOW_POPUP_ERROR,
                buttonType: AlertConstants.RETRY_CANCEL,
                message: LANG.monitor.ask_reconnect,
                onRetry: async () => {
                  const res2 = await DeviceMaster.reconnect();
                  if (res2.success) {
                    Alert.popById('connection-error');
                    resolve(true);
                  } else {
                    const doRetry = await askRetryReconnect();
                    resolve(doRetry);
                  }
                },
                onCancel: () => resolve(false),
              });
            });
          if (!Alert.checkIdExist('monitor-reconnect')) {
            const doRetry = await askRetryReconnect();
            if (doRetry) {
              this.startReport();
            } else {
              onClose();
            }
          }
        }
      } finally {
        this.isGettingReport = false;
      }
    }, 1500);
  }

  stopReport(): void {
    clearInterval(this.reporter);
    this.reporter = null;
  }

  async fetchInitialInfo(): Promise<void> {
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

  clearErrorPopup = (): void => {
    if (this.lastErrorId) {
      Alert.popById(this.lastErrorId);
      this.lastErrorId = null;
    }
  };

  async processReport(report: IReport): Promise<void> {
    const { report: currentReport, mode } = this.state;
    const keys = Object.keys(report);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      if (
        currentReport[key] === undefined ||
        JSON.stringify(currentReport[key]) !== JSON.stringify(report[key])
      ) {
        // console.log(key, 'changed');
        if (report.st_id > 0 && (mode !== Mode.WORKING || key === 'session')) {
          const keepsCameraMode =
            mode === Mode.CAMERA && MonitorStatus.allowedCameraStatus.includes(report.st_id);
          const keepsFileMode = mode === Mode.FILE_PREVIEW || mode === Mode.FILE;
          if (!keepsCameraMode && !keepsFileMode) {
            console.log('to work mode');
            this.enterWorkingMode();
          }
        } else if (report.st_id === IDLE) {
          if (
            mode === Mode.WORKING ||
            (mode === Mode.CAMERA && this.modeBeforeCamera === Mode.WORKING)
          ) {
            this.exitWorkingMode();
          }
        }
        this.setState({ report });
        break;
      }
    }

    if (!report.error || report.error.length === 0) {
      this.clearErrorPopup();
      return;
    }

    let { error } = report;
    error = error instanceof Array ? error : [error];
    console.error(error);
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
        const { onClose } = this.props;
        onClose();
      }
      return;
    }
    if (error[0] === 'DISCONNECTED') {
      if (this.lastErrorId === 'DISCONNECTED') return;
      this.handlePromarkConnection('Promark');
      this.lastErrorId = 'DISCONNECTED';
      return;
    }
    const errorId = error.join('_');
    if (this.lastErrorId && this.lastErrorId !== errorId) {
      this.clearErrorPopup();
    }

    if (reportStates.has(report.st_id)) {
      const handleRetry = async () => {
        this.clearErrorPopup();
        const pauseStates = [
          PAUSED,
          PAUSED_FROM_STARTING,
          PAUSED_FROM_RUNNING,
          PAUSING_FROM_STARTING,
          PAUSING_FROM_RUNNING,
        ];
        if (report.st_id === ABORTED) {
          await DeviceMaster.quit();
          this.onPlay();
        } else if (pauseStates.includes(report.st_id)) {
          DeviceMaster.resume();
        }
      };

      const handleReport = async () => {
        const getContent = async () => {
          const contents = [];
          const bxLogs = OutputError.getOutput();
          contents.push(...bxLogs);

          this.stopReport();
          const { device } = this.props;
          const vc = VersionChecker(device.version);
          const playerLogName = vc.meetRequirement('NEW_PLAYER')
            ? 'playerd.log'
            : 'fluxplayerd.log';
          Progress.openSteppingProgress({ id: 'get_log', message: 'downloading' });
          const logFiles = await DeviceMaster.getLogsTexts(
            [playerLogName, 'fluxrobotd.log'],
            (progress: { completed: number; size: number }) =>
              Progress.update('get_log', {
                message: 'downloading',
                percentage: (progress.completed / progress.size) * 100,
              })
          );
          Progress.popById('get_log');
          this.startReport();
          const logKeys = Object.keys(logFiles);
          for (let i = 0; i < logKeys.length; i += 1) {
            const key = logKeys[i];
            const blob = getFirstBlobInArray(logFiles[key]);
            if (blob) {
              contents.push(`\n===\n${key}\n===\n`);
              contents.push(blob);
            }
          }
          return new Blob(contents);
        };
        await dialog.writeFileDialog(getContent, LANG.beambox.popup.bug_report, 'devicelogs.txt', [
          {
            name: window.os === 'MacOS' ? 'txt (*.txt)' : 'txt',
            extensions: ['txt'],
          },
        ]);
      };
      const errorMessage = DeviceErrorHandler.translate(error);
      if (!Alert.checkIdExist(errorId) && !this.lastErrorId) {
        if ([ALARM, FATAL].includes(report.st_id)) {
          Alert.popUp({
            id: errorId,
            type: AlertConstants.SHOW_POPUP_ERROR,
            message: errorMessage,
            primaryButtonIndex: 0,
            buttonLabels: [LANG.alert.abort],
            callbacks: [() => DeviceMaster.stop()],
          });
        } else if (error[0] === 'HARDWARE_ERROR' || error[0] === 'USER_OPERATION') {
          if (error[1] !== 'REMOVE_CARTRIDGE') {
            Alert.popUp({
              id: errorId,
              type:
                error[0] === 'USER_OPERATION'
                  ? AlertConstants.SHOW_POPUP_INSTRUCTION
                  : AlertConstants.SHOW_POPUP_ERROR,
              message: errorMessage,
              buttonType: AlertConstants.RETRY_CANCEL,
              onRetry: handleRetry,
            });
          } else {
            Alert.popUp({
              id: errorId,
              type:
                error[0] === 'USER_OPERATION'
                  ? AlertConstants.SHOW_POPUP_INSTRUCTION
                  : AlertConstants.SHOW_POPUP_ERROR,
              message: errorMessage,
            });
          }
        } else {
          Alert.popUp({
            id: errorId,
            type: AlertConstants.SHOW_POPUP_ERROR,
            message: errorMessage,
            primaryButtonIndex: 0,
            buttonLabels: [LANG.alert.retry, LANG.monitor.bug_report, LANG.alert.cancel],
            callbacks: [handleRetry, handleReport, () => {}],
          });
        }
        this.lastErrorId = errorId;
      }
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async getWorkingTaskInfo(): Promise<any> {
    const res = await DeviceMaster.getPreviewInfo();
    if (res == null) console.error('Error when getting working task info');
    return res;
  }

  // eslint-disable-next-line class-methods-use-this
  getTaskInfo(info: any[]): { imageBlob: Blob; taskTime: number } {
    console.log('Loading task info', info);
    const imageBlob = getFirstBlobInArray(info);
    const taskTime =
      findKeyInObjectArray(info, 'TIME_COST') || findKeyInObjectArray(info, 'time_cost');
    return { imageBlob, taskTime };
  }

  enterWorkingMode = async (task?: { taskImageURL: string; taskTime: number }): Promise<void> => {
    if (!task) {
      const taskInfo = await this.getWorkingTaskInfo();
      const { imageBlob, taskTime: newTaskTime } = this.getTaskInfo(taskInfo);
      let { taskImageURL, taskTime } = this.state;
      if (imageBlob) {
        taskImageURL = URL.createObjectURL(imageBlob);
      }
      if (newTaskTime) {
        // Ignore 0 task time after swiftray restart
        taskTime = newTaskTime;
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
  };

  exitWorkingMode = (): void => {
    const { mode, fileInfo, previewTask } = this.state;
    console.warn(fileInfo);
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
        mode: mode === Mode.CAMERA ? Mode.CAMERA : Mode.FILE,
      });
      this.modeBeforeCamera = Mode.FILE;
    }
  };

  startRelocate = async (): Promise<void> => {
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
        x: Number(/ X:\s?(-?\d+\.?\d+)/.exec(resp.value)[1]),
        y: Number(/ Y:\s?(-?\d+\.?\d+)/.exec(resp.value)[1]),
        angle: Number(/R:\s?(-?\d+\.?\d+)/.exec(resp.value)[1]),
        scaleRatioX: Number(
          (/SX:\s?(-?\d+\.?\d+)/.exec(resp.value) || /S:\s?(-?\d+\.?\d+)/.exec(resp.value))[1]
        ),
        scaleRatioY: Number(
          (/SY:\s?(-?\d+\.?\d+)/.exec(resp.value) || /S:\s?(-?\d+\.?\d+)/.exec(resp.value))[1]
        ),
      };
      console.log(`Got ${configName}`, cameraOffset);
      if (cameraOffset.x === 0 && cameraOffset.y === 0) {
        cameraOffset = {
          x: Constant.camera.offsetX_ideal,
          y: Constant.camera.offsetY_ideal,
          angle: 0,
          scaleRatioX: Constant.camera.scaleRatio_ideal,
          scaleRatioY: Constant.camera.scaleRatio_ideal,
        };
      }
      return cameraOffset;
    };

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
        currentPosition: { x: 0, y: 0 },
      });
    } catch (error) {
      console.error('Error when entering relocate mode', error);
      this.startReport();
    }
    Progress.popById('prepare-relocate');
  };

  endRelocate = (): void => {
    this.setState({ mode: this.modeBeforeRelocate }, () => {
      if (!this.reporter) {
        this.startReport();
      }
    });
  };

  onHighlightItem = (item: { name: string; type: ItemType }): void => {
    const { highlightedItem } = this.state;
    if (
      !highlightedItem ||
      highlightedItem.name !== item.name ||
      highlightedItem.type !== item.type
    ) {
      this.setState({ highlightedItem: item });
    } else {
      this.setState({ highlightedItem: {} });
    }
  };

  setMonitorMode = (value: Mode): void => {
    this.setState({ mode: value });
  };

  onSelectFolder = (folderName: string, absolute = false): void => {
    let { currentPath } = this.state;
    if (!absolute) {
      currentPath.push(folderName);
    } else if (folderName === '') {
      currentPath = [];
    } else {
      currentPath = folderName.split('/');
    }
    this.setState({
      currentPath,
      highlightedItem: {},
    });
    console.info('Current Path', currentPath);
  };

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  onSelectFile = async (fileName: string, fileInfo: any): Promise<void> => {
    const { currentPath } = this.state;
    const path = currentPath.join('/');
    let info = fileInfo;
    if (!info) {
      info = await DeviceMaster.fileInfo(path, fileName);
    }
    console.info(info);
    const { imageBlob, taskTime } = this.getTaskInfo(info);
    let taskImageURL = null;
    if (imageBlob) {
      taskImageURL = URL.createObjectURL(imageBlob);
    }
    console.log(info);
    this.setState({
      mode: Mode.FILE_PREVIEW,
      fileInfo: info,
      taskImageURL,
      taskTime,
    });
  };

  setShouldUpdateFileList = (val: boolean): void => {
    this.setState({ shouldUpdateFileList: val });
  };

  private doesFileExistInDirectory = async (path: string, fileName: string) => {
    const name = fileName.replace('.gcode', '.fc');
    try {
      const res = (await DeviceMaster.fileInfo(path, name)) as any;
      if (!res.error || res.error.length === 0) {
        console.log(res.error, res.error.length === 0);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  uploadFile = async (file: File): Promise<void> => {
    const { currentPath } = this.state;
    const path = currentPath.join('/');
    if (!path) return;
    const name = file.name.split(/[\\/]/).at(-1).replace(/ /g, '_');
    const fileExist = await this.doesFileExistInDirectory(path, name);
    if (fileExist) {
      const res = await new Promise((resolve) => {
        Alert.popUp({
          type: AlertConstants.SHOW_POPUP_INFO,
          message: LANG.monitor.fileExistContinue,
          buttonType: AlertConstants.YES_NO,
          onYes: () => resolve(true),
          onNo: () => resolve(false),
        });
      });
      if (!res) return;
    }

    this.setState({ uploadProgress: 0 });
    const reader = new FileReader();
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
        await DeviceMaster.uploadToDirectory(blob, path, name, (progress: IProgress) => {
          const p = Math.floor((progress.step / progress.total) * 100);
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
    reader.readAsArrayBuffer(file);
  };

  showUploadDialog = async (): Promise<void> => {
    const file = (await dialog.getFileFromDialog({
      filters: [{ name: 'task', extensions: ['fc'] }],
    })) as File;
    if (!file) return;
    this.uploadFile(file);
  };

  onDownload = async (): Promise<void> => {
    try {
      const { currentPath, highlightedItem } = this.state;
      const { name } = highlightedItem;
      const path = currentPath.join('/');
      const file = await DeviceMaster.downloadFile(path, name, (p) => {
        this.setState({ downloadProgress: p });
      });
      this.setState({ downloadProgress: null });
      const getContent = async () => file[1] as Blob;
      await dialog.writeFileDialog(getContent, name, name, [
        {
          name: i18n.lang.topmenu.file.all_files,
          extensions: ['*'],
        },
      ]);
    } catch (e) {
      console.error('Error when downloading file', e);
    }
  };

  onDeleteFile = (): void => {
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
    });
  };

  onPlay = async (forceResend = false): Promise<void> => {
    const { device } = this.props;
    const { mode, report, currentPath, fileInfo, relocateOrigin } = this.state;

    this.clearErrorPopup();

    if (report.st_id === IDLE || forceResend) {
      const vc = VersionChecker(device.version);
      console.log(device.version);

      if (vc.meetRequirement('RELOCATE_ORIGIN')) {
        console.log(relocateOrigin);
        await DeviceMaster.setOriginX(relocateOrigin.x);
        await DeviceMaster.setOriginY(relocateOrigin.y);
      }

      if (mode === Mode.PREVIEW || forceResend) {
        const { previewTask } = this.state;
        const fCode = previewTask.fcodeBlob;
        try {
          await DeviceMaster.go(fCode, ({ step, total }: IProgress) => {
            this.setState({ uploadProgress: Math.floor((step / total) * 100) });
          });
          this.setState({ uploadProgress: null });
          setTimeout(() => promarkButtonHandler.setStatus('listening'), 1000);
        } catch (error) {
          this.setState({ uploadProgress: null });
          Alert.popUp({
            type: AlertConstants.SHOW_POPUP_ERROR,
            message: LANG.message.unable_to_start + error.error?.join('_'),
          });
          promarkButtonHandler.setStatus('listening');
        }
      } else if (mode === Mode.FILE_PREVIEW) {
        await DeviceMaster.goFromFile(currentPath.join('/'), fileInfo[0]);
      } else if (MonitorStatus.isAbortedOrCompleted(report)) {
        DeviceMaster.restart();
      } else {
        // PAUSED
        DeviceMaster.resume();
      }
    }

    eventEmitter.emit('PLAY');
  };

  onPause = (): void => {
    DeviceMaster.pause();
  };

  onStop = (): void => {
    DeviceMaster.stop();
  };

  onMaintainMoveStart = (): void => {
    this.setState({ isMaintainMoving: true });
  };

  onMaintainMoveEnd = (x: number, y: number): void => {
    this.setState({
      isMaintainMoving: false,
      currentPosition: { x, y },
    });
  };

  onRelocate = (): void => {
    const { currentPosition } = this.state;
    const { x, y } = currentPosition;
    this.setState({
      relocateOrigin: { x, y },
      mode: this.modeBeforeRelocate,
    });
  };

  render(): JSX.Element {
    const { onClose, children } = this.props;
    const {
      onHighlightItem,
      onSelectFolder,
      onSelectFile,
      setShouldUpdateFileList,
      uploadFile,
      onDeleteFile,
      onPlay,
      onPause,
      onStop,
      onMaintainMoveStart,
      onMaintainMoveEnd,
      onDownload,
      showUploadDialog,
      setMonitorMode,
    } = this;
    return (
      <MonitorContext.Provider
        value={{
          onClose,
          ...this.state,
          onHighlightItem,
          onSelectFolder,
          onSelectFile,
          setShouldUpdateFileList,
          uploadFile,
          onDeleteFile,
          onPlay,
          onPause,
          onStop,
          onMaintainMoveStart,
          onMaintainMoveEnd,
          setMonitorMode,
          onDownload,
          showUploadDialog,
        }}
      >
        {children}
      </MonitorContext.Provider>
    );
  }
}
