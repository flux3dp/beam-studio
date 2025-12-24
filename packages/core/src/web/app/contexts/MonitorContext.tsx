import * as React from 'react';

import Alert from '@core/app/actions/alert-caller';
import Constant, { promarkModels } from '@core/app/actions/beambox/constant';
import exportFuncs, { getConvertEngine } from '@core/app/actions/beambox/export-funcs';
import Progress from '@core/app/actions/progress-caller';
import AlertConstants from '@core/app/constants/alert-constants';
import DeviceConstants from '@core/app/constants/device-constants';
import type { ItemType } from '@core/app/constants/monitor-constants';
import { Mode } from '@core/app/constants/monitor-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { setVariableTextState, useVariableTextState } from '@core/app/stores/variableText';
import { swiftrayClient } from '@core/helpers/api/swiftray-client';
import doZSpeedLimitTest from '@core/helpers/device/doZSpeedLimitTest';
import promarkButtonHandler from '@core/helpers/device/promark/promark-button-handler';
import DeviceErrorHandler from '@core/helpers/device-error-handler';
import DeviceMaster from '@core/helpers/device-master';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { getOS } from '@core/helpers/getOS';
import i18n from '@core/helpers/i18n';
import MonitorStatus from '@core/helpers/monitor-status';
import OutputError from '@core/helpers/output-error';
import type { VariableTextElemHandler } from '@core/helpers/variableText';
import { convertVariableText } from '@core/helpers/variableText';
import VersionChecker from '@core/helpers/version-checker';
import dialog from '@core/implementations/dialog';
import type { IDeviceInfo, IReport } from '@core/interfaces/IDevice';
import type { IProgress } from '@core/interfaces/IProgress';
import type { TaskMetaData } from '@core/interfaces/ITask';

import { DEFAULT_CAMERA_OFFSET } from '../constants/cameraConstants';

const eventEmitter = eventEmitterFactory.createEventEmitter('monitor');

let LANG = i18n.lang;
const updateLang = () => {
  LANG = i18n.lang;
};

const getFirstBlobInArray = (array: any[]) => {
  const id = array.findIndex((elem) => elem instanceof Blob);

  if (id >= 0) {
    return array[id];
  }

  return null;
};

const findKeyInObjectArray = (array: any[], key: string) => {
  const res = array.filter((o) => Object.keys(o).includes(key));

  if (res.length > 0) {
    return res[0][key];
  }

  return null;
};

const {
  ABORTED,
  ALARM,
  COMPLETED,
  FATAL,
  IDLE,
  PAUSED,
  PAUSED_FROM_RUNNING,
  PAUSED_FROM_STARTING,
  PAUSING_FROM_RUNNING,
  PAUSING_FROM_STARTING,
  RECONNECTING,
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
  RECONNECTING,
]);

export interface PreviewTask {
  fcodeBlob: Blob;
  fileName: string;
  metadata: TaskMetaData;
  taskImageURL: string;
  taskTime: number;
  vtTaskTime?: number;
}

export interface VariableTextTask {
  fileTimeCost: number;
  taskCodeBlob: Blob;
}

interface Props {
  autoStart?: boolean;
  children?: React.ReactNode;
  device: IDeviceInfo;
  mode: Mode;
  onClose: () => void;
  previewTask?: PreviewTask;
  vtElemHandler?: VariableTextElemHandler;
  vtTaskTinfo?: VariableTextTask;
}

interface State {
  cameraOffset?: {
    angle: number;
    scaleRatioX: number;
    scaleRatioY: number;
    x: number;
    y: number;
  };
  currentPath: string[];
  currentPosition: { x: number; y: number };
  downloadProgress: null | { left: number; size: number };
  fileInfo: any[] | null;
  highlightedItem: {
    name?: string;
    type?: ItemType;
  };
  isMaintainMoving?: boolean;
  mode: Mode;
  previewTask?: PreviewTask;
  relocateOrigin: { x: number; y: number };
  report: IReport;
  shouldUpdateFileList: boolean;
  taskImageURL: null | string;
  taskTime: null | number;
  totalTaskTime: number;
  uploadProgress: null | number;
  workingTask: any;
}

interface Context extends State {
  onClose: () => void;
  onDeleteFile: () => void;
  onDownload: () => Promise<void>;
  onHighlightItem: (item: { name: string; type: ItemType }) => void;
  onMaintainMoveEnd: (x: number, y: number) => void;
  onMaintainMoveStart: () => void;
  onPause: () => void;
  onPlay: (forceResend?: boolean) => Promise<null | number>;
  onSelectFile: (fileName: string, fileInfo: any) => Promise<void>;
  onSelectFolder: (folderName: string, absolute?: boolean) => void;
  onStop: () => void;
  setMonitorMode: (value: Mode) => void;
  setShouldUpdateFileList: (val: boolean) => void;
  showUploadDialog: () => Promise<void>;
  uploadFile: (file: File) => Promise<void>;
}

export const MonitorContext = React.createContext<Context>(null as unknown as Context);

export class MonitorContextProvider extends React.Component<Props, State> {
  lastErrorId: null | string;

  modeBeforeCamera: Mode;

  modeBeforeRelocate: Mode;

  reporter?: NodeJS.Timeout;

  isGettingReport: boolean;

  isClosed: boolean; // for swiftray handler

  isPromark: boolean;

  autoStart?: boolean;

  constructor(props: Props) {
    super(props);

    const { autoStart, device, mode, previewTask, vtTaskTinfo } = props;
    const isPreviewingTask = mode === Mode.PREVIEW && previewTask;

    updateLang();
    this.isGettingReport = false;
    this.lastErrorId = null;
    this.modeBeforeCamera = mode;
    this.modeBeforeRelocate = mode;
    this.isClosed = false;
    this.autoStart = autoStart;
    this.isPromark = promarkModels.has(device.model);
    this.state = {
      currentPath: [],
      currentPosition: { x: 0, y: 0 },
      downloadProgress: null,
      fileInfo: null,
      highlightedItem: {},
      mode,
      previewTask,
      relocateOrigin: { x: 0, y: 0 },
      report: {} as IReport,
      shouldUpdateFileList: false,
      taskImageURL: isPreviewingTask ? previewTask.taskImageURL : null,
      taskTime: isPreviewingTask ? previewTask.taskTime : null,
      totalTaskTime: isPreviewingTask
        ? vtTaskTinfo?.fileTimeCost === undefined
          ? previewTask.taskTime
          : previewTask.taskTime + 4 + vtTaskTinfo.fileTimeCost
        : 0,
      uploadProgress: null,
      workingTask: null,
    };
  }

  getVariableTextTask = async (): Promise<null | VariableTextTask> => {
    if (!this.props.vtElemHandler) return null;

    this.props.vtElemHandler.extract();

    const revert = await convertVariableText();
    const { device } = this.props;
    const { convertEngine } = getConvertEngine(device);
    const res = await convertEngine(device);

    revert?.();
    this.props.vtElemHandler.revert();

    if (res) return { fileTimeCost: res.fileTimeCost, taskCodeBlob: res.taskCodeBlob };

    return null;
  };

  getTaskWithVariableText = async () => {
    const variableTextTask = await this.getVariableTextTask();

    if (variableTextTask?.taskCodeBlob) {
      return {
        // Note: this only works for Promark
        taskBlob: new Blob([variableTextTask.taskCodeBlob, this.state.previewTask!.fcodeBlob]),
        taskTime: variableTextTask.fileTimeCost + 4 + this.state.previewTask!.taskTime,
      };
    }

    return { taskBlob: this.state.previewTask!.fcodeBlob, taskTime: this.state.previewTask!.taskTime };
  };

  // Use arrow function to bind 'this'
  onSwiftrayDisconnected = (): void => {
    this.handlePromarkConnection('disconnected');
    swiftrayClient.once('reconnected', (success: boolean) => {
      if (!this.isClosed) {
        this.handlePromarkConnection('reconnected', success);
      }
    });
  };

  async componentDidMount(): Promise<void> {
    await this.fetchInitialInfo();
    this.startReport();

    const { mode } = this.state;
    const { device } = this.props;

    if (this.isPromark) {
      swiftrayClient.on('disconnected', this.onSwiftrayDisconnected);
    }

    if (mode === Mode.WORKING) {
      if (this.isPromark) {
        const cachedTask = exportFuncs.getCachedPromarkTask(device.serial);

        if (cachedTask) {
          this.setState({
            previewTask: cachedTask,
            taskImageURL: cachedTask.taskImageURL,
            taskTime: cachedTask.taskTime,
            totalTaskTime: cachedTask.vtTaskTime
              ? cachedTask.vtTaskTime + 4 + cachedTask.taskTime
              : cachedTask.taskTime,
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
          totalTaskTime: taskTime,
          workingTask: taskInfo,
        });
      }
    }
  }

  componentDidUpdate(prevProps: Props, prevState: State): void {
    const { previewTask, report, taskImageURL } = this.state;

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

    if (taskImageURL) URL.revokeObjectURL(taskImageURL);

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
        buttonType: AlertConstants.CONFIRM_CANCEL,
        id,
        message: i18n.lang.message.swiftray_reconnected,
        onCancel: onClose,
        onConfirm: () => {},
      });
    } else {
      // Swiftray reconnected but Promark not
      Alert.popUp({
        buttonLabels: [i18n.lang.alert.confirm],
        buttonType: AlertConstants.CUSTOM,
        callbacks: [onClose],
        id,
        message: i18n.lang.message.swiftray_reconnected,
      });
    }
  }

  startReport(): void {
    if (this.reporter) {
      clearInterval(this.reporter);
    }

    this.reporter = setInterval(async () => {
      try {
        if (this.isGettingReport) {
          return;
        }

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
                buttonType: AlertConstants.RETRY_CANCEL,
                id: 'monitor-reconnect',
                message: LANG.monitor.ask_reconnect,
                onCancel: () => resolve(false),
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
                type: AlertConstants.SHOW_POPUP_ERROR,
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
    this.reporter = undefined;
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
    const { mode, report: currentReport } = this.state;
    const keys = Object.keys(report) as Array<keyof IReport>;

    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];

      if (currentReport[key] === undefined || JSON.stringify(currentReport[key]) !== JSON.stringify(report[key])) {
        // console.log(key, 'changed');
        if (report.st_id > 0 && (mode !== Mode.WORKING || key === 'session')) {
          const keepsCameraMode = mode === Mode.CAMERA && MonitorStatus.allowedCameraStatus.includes(report.st_id);
          const keepsFileMode = mode === Mode.FILE_PREVIEW || mode === Mode.FILE;

          if (!keepsCameraMode && !keepsFileMode) {
            console.log('to work mode');
            this.enterWorkingMode();
          }
        } else if (report.st_id === IDLE && !this.isPromark) {
          if (mode === Mode.WORKING || (mode === Mode.CAMERA && this.modeBeforeCamera === Mode.WORKING)) {
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

    error = Array.isArray(error) ? error : [error];
    console.error(error);

    if (error[0] === 'TIMEOUT') {
      try {
        await DeviceMaster.reconnect();
      } catch (e) {
        console.error('Error when reconnect in monitor', e);
        Alert.popUp({
          id: 'monitor-error',
          message: LANG.message.connectionTimeout,
          type: AlertConstants.SHOW_POPUP_ERROR,
        });

        const { onClose } = this.props;

        onClose();
      }

      return;
    }

    const errorId = error.join('_');

    if (this.lastErrorId && this.lastErrorId !== errorId) {
      this.clearErrorPopup();
    }

    if (error[0] === 'DISCONNECTED') {
      if (this.lastErrorId === 'DISCONNECTED') {
        return;
      }

      this.handlePromarkConnection('Promark');
      this.lastErrorId = 'DISCONNECTED';

      return;
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
          const playerLogName = vc.meetRequirement('NEW_PLAYER') ? 'playerd.log' : 'fluxplayerd.log';

          Progress.openSteppingProgress({ id: 'get_log', message: 'downloading' });

          const logFiles = await DeviceMaster.getLogsTexts(
            [playerLogName, 'fluxrobotd.log'],
            (progress: { completed: number; size: number }) =>
              Progress.update('get_log', {
                message: 'downloading',
                percentage: (progress.completed / progress.size) * 100,
              }),
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
            extensions: ['txt'],
            name: getOS() === 'MacOS' ? 'txt (*.txt)' : 'txt',
          },
        ]);
      };
      const errorMessage = DeviceErrorHandler.translate(error);

      if (!Alert.checkIdExist(errorId) && !this.lastErrorId) {
        if ([ALARM, FATAL].includes(report.st_id)) {
          Alert.popUp({
            buttonLabels: [LANG.alert.abort],
            callbacks: [() => DeviceMaster.stop()],
            id: errorId,
            message: errorMessage,
            primaryButtonIndex: 0,
            type: AlertConstants.SHOW_POPUP_ERROR,
          });
        } else if (error[0] === 'HARDWARE_ERROR' || error[0] === 'USER_OPERATION') {
          if (error[1] !== 'REMOVE_CARTRIDGE') {
            Alert.popUp({
              buttonType: AlertConstants.RETRY_CANCEL,
              id: errorId,
              message: errorMessage,
              onRetry: handleRetry,
              type:
                error[0] === 'USER_OPERATION' ? AlertConstants.SHOW_POPUP_INSTRUCTION : AlertConstants.SHOW_POPUP_ERROR,
            });
          } else {
            Alert.popUp({
              id: errorId,
              message: errorMessage,
              type:
                error[0] === 'USER_OPERATION' ? AlertConstants.SHOW_POPUP_INSTRUCTION : AlertConstants.SHOW_POPUP_ERROR,
            });
          }
        } else {
          Alert.popUp({
            buttonLabels: [LANG.alert.retry, LANG.monitor.bug_report, LANG.alert.cancel],
            callbacks: [handleRetry, handleReport, () => {}],
            id: errorId,
            message: errorMessage,
            primaryButtonIndex: 0,
            type: AlertConstants.SHOW_POPUP_ERROR,
          });
        }

        this.lastErrorId = errorId;
      }
    }
  }

  async getWorkingTaskInfo(): Promise<any> {
    const res = await DeviceMaster.getPreviewInfo();

    if (res == null) {
      console.error('Error when getting working task info');
    }

    return res;
  }

  getTaskInfo(info: any[]): { imageBlob: Blob; taskTime: number } {
    console.log('Loading task info', info);

    const imageBlob = getFirstBlobInArray(info);
    const taskTime = findKeyInObjectArray(info, 'TIME_COST') || findKeyInObjectArray(info, 'time_cost');

    return { imageBlob, taskTime };
  }

  enterWorkingMode = async (task?: { taskImageURL: string; taskTime: number }): Promise<void> => {
    if (!task) {
      const taskInfo = await this.getWorkingTaskInfo();
      const { imageBlob, taskTime: newTaskTime } = this.getTaskInfo(taskInfo);
      let { taskImageURL, taskTime, totalTaskTime } = this.state;

      if (imageBlob) {
        taskImageURL = URL.createObjectURL(imageBlob);
      }

      if (!this.isPromark) {
        taskTime = newTaskTime;
        totalTaskTime = newTaskTime ?? 0;
      }

      this.setState({
        mode: Mode.WORKING,
        taskImageURL,
        taskTime,
        totalTaskTime,
      });
    } else {
      this.setState({
        mode: Mode.WORKING,
        taskImageURL: task.taskImageURL,
        taskTime: task.taskTime,
        totalTaskTime: task.taskTime,
      });
    }
  };

  exitWorkingMode = (): void => {
    const { fileInfo, mode, previewTask } = this.state;

    console.warn(fileInfo);

    if (previewTask) {
      this.setState({
        mode: mode === Mode.CAMERA ? Mode.CAMERA : Mode.PREVIEW,
        taskImageURL: previewTask.taskImageURL,
        taskTime: previewTask.taskTime,
        totalTaskTime: previewTask.taskTime,
      });
      this.modeBeforeCamera = Mode.PREVIEW;
    } else if (fileInfo) {
      const { imageBlob, taskTime } = this.getTaskInfo(fileInfo);
      const taskImageURL = URL.createObjectURL(imageBlob);

      this.setState({
        mode: mode === Mode.CAMERA ? Mode.CAMERA : Mode.FILE_PREVIEW,
        taskImageURL,
        taskTime,
        totalTaskTime: taskTime,
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

    if (mode === Mode.CAMERA_RELOCATE) {
      return;
    }

    this.modeBeforeRelocate = mode;

    const getCameraOffset = async () => {
      const configName = useDocumentStore.getState().borderless ? 'camera_offset_borderless' : 'camera_offset';
      const resp = await DeviceMaster.getDeviceSetting(configName);

      console.log(`Reading ${configName}\nResp = ${resp.value}`);
      resp.value = ` ${resp.value}`;

      let cameraOffset = {
        angle: Number(/R:\s?(-?\d+\.?\d+)/.exec(resp.value)?.[1] ?? DEFAULT_CAMERA_OFFSET.R),
        scaleRatioX: Number(
          (/SX:\s?(-?\d+\.?\d+)/.exec(resp.value) || /S:\s?(-?\d+\.?\d+)/.exec(resp.value))?.[1] ??
            DEFAULT_CAMERA_OFFSET.SX,
        ),
        scaleRatioY: Number(
          (/SY:\s?(-?\d+\.?\d+)/.exec(resp.value) || /S:\s?(-?\d+\.?\d+)/.exec(resp.value))?.[1] ??
            DEFAULT_CAMERA_OFFSET.SY,
        ),
        x: Number(/ X:\s?(-?\d+\.?\d+)/.exec(resp.value)?.[1] ?? DEFAULT_CAMERA_OFFSET.X),
        y: Number(/ Y:\s?(-?\d+\.?\d+)/.exec(resp.value)?.[1] ?? DEFAULT_CAMERA_OFFSET.Y),
      };

      console.log(`Got ${configName}`, cameraOffset);

      if (cameraOffset.x === 0 && cameraOffset.y === 0) {
        cameraOffset = {
          angle: 0,
          scaleRatioX: Constant.camera.scaleRatio_ideal,
          scaleRatioY: Constant.camera.scaleRatio_ideal,
          x: Constant.camera.offsetX_ideal,
          y: Constant.camera.offsetY_ideal,
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
        cameraOffset,
        currentPosition: { x: 0, y: 0 },
        mode: Mode.CAMERA_RELOCATE,
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

    if (!highlightedItem || highlightedItem.name !== item.name || highlightedItem.type !== item.type) {
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
      fileInfo: info,
      mode: Mode.FILE_PREVIEW,
      taskImageURL,
      taskTime,
      totalTaskTime: taskTime,
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
    } catch {
      return false;
    }
  };

  uploadFile = async (file: File): Promise<void> => {
    const { currentPath } = this.state;
    const path = currentPath.join('/');

    if (!path) {
      return;
    }

    const name = file.name.split(/[\\/]/).at(-1)!.replace(/ /g, '_');
    const fileExist = await this.doesFileExistInDirectory(path, name);

    if (fileExist) {
      const res = await new Promise((resolve) => {
        Alert.popUp({
          buttonType: AlertConstants.YES_NO,
          message: LANG.monitor.fileExistContinue,
          onNo: () => resolve(false),
          onYes: () => resolve(true),
          type: AlertConstants.SHOW_POPUP_INFO,
        });
      });

      if (!res) {
        return;
      }
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
        const blob = new Blob([reader.result as ArrayBuffer], type);

        await DeviceMaster.uploadToDirectory(blob, path, name, (progress: IProgress) => {
          const p = Math.floor((progress.step / progress.total) * 100);

          this.setState({ uploadProgress: p });
        });

        this.setState({ uploadProgress: null });
        this.setShouldUpdateFileList(true);
      } else {
        Alert.popUp({
          message: LANG.monitor.extensionNotSupported,
          type: AlertConstants.SHOW_POPUP_INFO,
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  showUploadDialog = async (): Promise<void> => {
    const file = (await dialog.getFileFromDialog({
      filters: [{ extensions: ['fc'], name: 'task' }],
    })) as File;

    if (!file) {
      return;
    }

    this.uploadFile(file);
  };

  onDownload = async (): Promise<void> => {
    try {
      const {
        currentPath,
        highlightedItem: { name },
      } = this.state;

      if (!name) return;

      const path = currentPath.join('/');
      const file = await DeviceMaster.downloadFile(path, name, (p) => {
        this.setState({ downloadProgress: p });
      });

      this.setState({ downloadProgress: null });

      const getContent = async () => file[1] as Blob;

      await dialog.writeFileDialog(getContent, name, name, [
        {
          extensions: ['*'],
          name: i18n.lang.topmenu.file.all_files,
        },
      ]);
    } catch (e) {
      console.error('Error when downloading file', e);
    }
  };

  onDeleteFile = (): void => {
    const {
      currentPath,
      highlightedItem: { name },
    } = this.state;
    const path = currentPath.join('/');

    if (!name) return;

    Alert.popUp({
      buttonType: AlertConstants.YES_NO,
      message: LANG.monitor.confirmFileDelete,
      onYes: async () => {
        await DeviceMaster.deleteFile(path, name);
        this.setShouldUpdateFileList(true);
      },
      type: AlertConstants.SHOW_POPUP_INFO,
    });
  };

  onPlay = async (forceResend = false): Promise<null | number> => {
    const { device } = this.props;
    const { currentPath, fileInfo, mode, relocateOrigin, report } = this.state;
    let { totalTaskTime } = this.state;

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
        const { taskBlob, taskTime } = await this.getTaskWithVariableText();

        if (previewTask?.metadata['3D_CURVE_TASK'] === '1' && device.model !== 'fbm2') {
          this.stopReport();

          const res = await doZSpeedLimitTest(device);

          this.startReport();

          if (!res) return null;
        }

        totalTaskTime = taskTime;
        this.setState({ totalTaskTime });
        try {
          await DeviceMaster.go(
            taskBlob,
            ({ step, total }: IProgress) => {
              this.setState({ uploadProgress: Math.floor((step / total) * 100) });
            },
            totalTaskTime,
          );

          const { advanceBy, autoAdvance, current } = useVariableTextState.getState();

          if (autoAdvance) setVariableTextState({ current: current + advanceBy });

          this.setState({ uploadProgress: null });
          setTimeout(() => promarkButtonHandler.setStatus('listening'), 1000);
        } catch (error) {
          this.setState({ uploadProgress: null });
          Alert.popUp({
            message: LANG.message.unable_to_start + error.error?.join('_'),
            type: AlertConstants.SHOW_POPUP_ERROR,
          });
          promarkButtonHandler.setStatus('listening');
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

    eventEmitter.emit('PLAY');

    return totalTaskTime;
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
      currentPosition: { x, y },
      isMaintainMoving: false,
    });
  };

  onRelocate = (): void => {
    const { currentPosition } = this.state;
    const { x, y } = currentPosition;

    this.setState({
      mode: this.modeBeforeRelocate,
      relocateOrigin: { x, y },
    });
  };

  render(): React.JSX.Element {
    const { children, onClose } = this.props;
    const {
      onDeleteFile,
      onDownload,
      onHighlightItem,
      onMaintainMoveEnd,
      onMaintainMoveStart,
      onPause,
      onPlay,
      onSelectFile,
      onSelectFolder,
      onStop,
      setMonitorMode,
      setShouldUpdateFileList,
      showUploadDialog,
      uploadFile,
    } = this;

    return (
      <MonitorContext.Provider
        value={{
          onClose,
          ...this.state,
          onDeleteFile,
          onDownload,
          onHighlightItem,
          onMaintainMoveEnd,
          onMaintainMoveStart,
          onPause,
          onPlay,
          onSelectFile,
          onSelectFolder,
          onStop,
          setMonitorMode,
          setShouldUpdateFileList,
          showUploadDialog,
          uploadFile,
        }}
      >
        {children}
      </MonitorContext.Provider>
    );
  }
}
