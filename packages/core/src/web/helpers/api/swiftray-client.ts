// Swiftray Client Typescript API Client
import { EventEmitter } from 'eventemitter3';
import { match } from 'ts-pattern';

import alertCaller from '@core/app/actions/alert-caller';
import constant, { promarkModels } from '@core/app/actions/beambox/constant';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import alertConstants from '@core/app/constants/alert-constants';
import { BackendEvents } from '@core/app/constants/ipcEvents';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import workareaManager, { ExpansionType } from '@core/app/svgedit/workarea';
import TopBarController from '@core/app/views/beambox/TopBar/contexts/TopBarController';
import deviceMaster from '@core/helpers/device-master';
import { getOS } from '@core/helpers/getOS';
import i18n from '@core/helpers/i18n';
import isDev from '@core/helpers/is-dev';
import isWeb from '@core/helpers/is-web';
import { booleanConfig, getDefaultConfig } from '@core/helpers/layer/layer-config-helper';
import Logger from '@core/helpers/logger';
import type { RequirementKey } from '@core/helpers/version-checker';
import versionChecker from '@core/helpers/version-checker';
import communicator from '@core/implementations/communicator';
import type { SwiftrayConvertType, TPromarkFramingOpt } from '@core/interfaces/IControlSocket';
import type { FirmwareType, IDeviceDetailInfo, IDeviceInfo, IReport } from '@core/interfaces/IDevice';
import type { IWrappedSwiftrayTaskFile } from '@core/interfaces/IWrappedFile';
import type { ButtonState } from '@core/interfaces/Promark';

interface ErrorObject {
  code: number;
  details?: any;
  message: string;
}

interface DeviceSettings {
  calibrationData: string;
  origin: {
    x: number;
    y: number;
  };
  workingRange: {
    x: number;
    y: number;
  };
}

// SystemInfo
interface SystemInfo {
  availableMemory: number;
  cpuArchitecture: string;
  os: string;
  qtVersion: string;
  swiftrayVersion: string;
  totalMemory: number;
}

// PreferenceSettingsObject
interface PreferenceSettingsObject {
  convertSettings: {
    filletCorners: boolean;
    joinCurves: boolean;
    optimizePaths: boolean;
    simplifyGeometry: boolean;
    unitScaling: number;
  };
}

type TStatus = 'connected' | 'disconnected' | 'init';

class SwiftrayClient extends EventEmitter {
  private socket?: WebSocket; // The websocket here is the browser websocket, not wrapped FLUX websocket

  private logger = Logger('swiftray', 100);

  private retryCount = 0;

  private maxRetries = 200;

  private retryDelay = 5000;

  private port = '';

  private instanceId = '';

  private status: TStatus = 'init';

  private lastPromark: IDeviceInfo | null = null;

  public version: string = '1.0.0';

  constructor(private url: string) {
    super();
    this.instanceId = Math.random().toString(36).substr(2, 9);
    this.status = 'init';
    console.log(`Swiftray Client instance ${this.instanceId} created`);
    this.connect();
  }

  public get readyState(): number {
    // Defaults to CLOSED if socket is not initialized
    return this.socket?.readyState ?? WebSocket.CLOSED;
  }

  public checkVersion(key: RequirementKey): boolean {
    const vc = versionChecker(this.version);

    if (!vc.meetRequirement(key)) {
      alertCaller.popUp({
        buttonType: alertConstants.INFO,
        caption: i18n.lang.message.wrong_swiftray_version_title,
        id: 'swiftray-version-warning',
        message: i18n.lang.message.wrong_swiftray_version_message.replace('{version}', this.version),
      });

      return false;
    }

    return true;
  }

  private connect() {
    if (isWeb() && !isDev()) {
      console.warn('Bypassing Swiftray connection in web mode');

      return;
    }

    this.socket = new WebSocket(this.url);
    this.socket.onopen = this.handleOpen.bind(this);
    this.socket.onclose = this.handleClose.bind(this);
    this.socket.onerror = this.handleError.bind(this);
    this.socket.onmessage = this.handleMessage.bind(this);
  }

  private async updateStatus(newStatus: TStatus): Promise<void> {
    if (newStatus === 'disconnected') {
      if (this.status !== 'connected') {
        return;
      }

      MessageCaller.openMessage({
        content: i18n.lang.message.swiftray_disconnected,
        key: 'swiftray-error-hint',
        level: MessageLevel.ERROR,
      });
      this.emit('disconnected');

      const device = TopBarController.getSelectedDevice();

      this.lastPromark = promarkModels.has(device?.model) ? device : null;
    } else if (newStatus === 'connected' && this.status === 'disconnected') {
      // Reconnect to Promark
      let device = TopBarController.getSelectedDevice();
      let retry = 8;
      let reconnect = false;

      while (!device && this.lastPromark && retry > 0) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        device = TopBarController.getSelectedDevice();
        retry -= 1;
      }

      if (promarkModels.has(device?.model)) {
        const resp = await deviceMaster.select(device);

        reconnect = resp.success;
        console.log('Reconnect to Promark', reconnect);
      }

      MessageCaller.openMessage({
        content: i18n.lang.message.swiftray_reconnected,
        key: 'swiftray-error-hint',
        level: MessageLevel.SUCCESS,
      });
      this.emit('reconnected', reconnect);
    }

    this.status = newStatus;
  }

  private async handleOpen() {
    console.log('Connected to Swiftray server 🎉');
    this.updateStatus('connected');
    this.retryCount = 0;

    const resp = await this.getSystemInfo();

    this.version = resp?.info?.swiftrayVersion ?? '1.0.0';

    console.log(`Swiftray version ${this.version}`);
  }

  private handleClose() {
    console.log('Disconnected from Swiftray server');
    this.updateStatus('disconnected');
    this.retry();
  }

  private handleError(error: Error) {
    console.error('Error connecting to Swiftray server:', error, this.retryCount);
  }

  private retry() {
    if (this.retryCount < this.maxRetries) {
      this.retryCount += 1;
      console.log(`Retrying connection (attempt ${this.retryCount})`);
      setTimeout(() => {
        this.connect();
      }, this.retryDelay);
    } else {
      throw new Error('Failed to connect to Swiftray server after maximum retries');
    }
  }

  private handleMessage(event: MessageEvent) {
    const data = JSON.parse(event.data);

    this.emit(data.type, data);

    if (data.type === 'callback') {
      let callbackData: any = data;

      if (callbackData.result?.gcode || callbackData.result?.fcode) {
        callbackData = JSON.parse(event.data);
        callbackData.result.gcode = `gcode, size: ${callbackData.result.gcode?.length}`;
        callbackData.result.fcode = `fcode, size: ${callbackData.result.fcode?.length}`;
      }

      this.logger.append(callbackData);
    }
  }

  public async action<T>(
    path: string,
    action: string,
    params?: any,
    handlers?: Array<{ handler: (data: any) => void; type: string }>,
  ): Promise<T> {
    const eventListeners: Array<{ listener: (data: any) => void; type: string }> = [];

    const res: T = await new Promise((resolve) => {
      const id = Math.random().toString(36).substr(2, 9);
      const payload = { action, id, params };

      if (this.readyState !== WebSocket.OPEN && action !== 'list') {
        MessageCaller.openMessage({
          content: i18n.lang.message.swiftray_disconnected,
          key: 'swiftray-error-hint',
          level: MessageLevel.ERROR,
        });
      }

      const dataString = JSON.stringify({ data: payload, path, type: 'action' });
      const vc = versionChecker(this.version);

      // Add to logger without large data
      if (payload.params?.file) {
        payload.params.file = '[file object]';
      }

      this.logger.append(payload);

      if (this.socket?.readyState === WebSocket.OPEN) {
        if (dataString.length < 4096 || !vc.meetRequirement('SWIFTRAY_SUPPORT_BINARY')) {
          this.socket.send(dataString);
        } else {
          // Change to binary string to avoid non-utf8 characters due to frame size limit
          this.socket.send(Buffer.from(dataString));
        }
      }

      const callback = (data: any) => {
        if (data.id === id) {
          this.removeListener('callback', callback);
          // console.log("SR Client Callback", data);
          resolve(data.result);
        }
      };

      handlers?.forEach(({ handler, type }) => {
        const listener = (data: any) => {
          if (data.id === id) {
            handler(data.result);
          }
        };

        eventListeners.push({ listener, type });
        this.addListener(type, listener);
      });
      this.addListener('callback', callback);
    });

    eventListeners.forEach(({ listener, type }) => {
      this.removeListener(type, listener);
    });

    return res;
  }

  // Parser API
  public async loadSVG(
    file: IWrappedSwiftrayTaskFile,
    eventListeners: {
      onError: (message: string) => void;
      onFinished: () => void;
      onProgressing: (progress) => void;
    },
    loadOptions: {
      engraveDpi: number;
      model: string;
      rotaryMode: boolean;
    },
  ): Promise<{ error?: ErrorObject; success: boolean }> {
    const defaultConfig: any = getDefaultConfig();

    booleanConfig.forEach((key) => delete defaultConfig[key]);

    const uploadRes = await this.action<{ error?: ErrorObject; success: boolean }>('/parser', 'loadSVG', {
      defaultConfig,
      engraveDpi: loadOptions.engraveDpi,
      file,
      model: loadOptions.model,
      rotaryMode: loadOptions.rotaryMode,
    });

    if (!uploadRes.success) {
      eventListeners.onError(uploadRes.error?.message ?? 'Unknown error');
    }

    return uploadRes;
  }

  public async convert(
    type: SwiftrayConvertType,
    eventListeners: {
      onError: (message: string) => void;
      onFinished: (taskBlob: Blob, timeCost: number, metadata: Record<string, string>) => void;
      onProgressing: (progress: { message: string; percentage: number }) => void;
    },
    convertOptions: {
      enableAutoFocus?: boolean;
      enableDiode?: boolean;
      isPromark: boolean;
      model: WorkAreaModel;
      paddingAccel?: number;
      shouldMockFastGradient?: boolean;
      shouldUseFastGradient?: boolean;
      travelSpeed?: number;
      useActualWorkarea?: boolean;
    },
  ): Promise<{
    error?: ErrorObject;
    estimatedTime?: number;
    success: boolean;
  }> {
    let height: number;
    let width: number;

    const workarea = getWorkarea(convertOptions.model);
    const deviceHeight = workarea.displayHeight || workarea.height;

    if (convertOptions.useActualWorkarea) {
      width = workareaManager.width / constant.dpmm;
      height =
        workareaManager.expansionType === ExpansionType.PASS_THROUGH
          ? deviceHeight
          : workareaManager.height / constant.dpmm;
    } else {
      height = deviceHeight;
      width = workarea.width;
    }

    const vc = versionChecker(this.version);

    let fullCode = '';
    const convertResult = await this.action<{
      error?: ErrorObject;
      estimatedTime?: number;
      fcode?: string;
      fileName?: string;
      gcode?: string;
      metadata?: Record<string, string>;
      success: boolean;
      timeCost?: number;
    }>(
      '/parser',
      'convert',
      {
        type: type === 'preview' && !vc.meetRequirement('SWIFTRAY_CONVERT_PREVIEW') ? 'fcode' : type,
        workarea: {
          height,
          width,
        },
        ...convertOptions,
      },
      [
        { handler: eventListeners.onProgressing, type: 'progress' },
        {
          handler: (data: { chunk: string }) => {
            fullCode += data.chunk;
          },
          type: 'chunk',
        },
      ],
    );

    if (fullCode) {
      this.logger.append(`convert fcode chunk size: ${fullCode.length}`);
    }

    if (convertResult.success) {
      const taskBlob = new Blob(
        [
          type === 'fcode'
            ? Buffer.from(fullCode.length ? fullCode : convertResult.fcode!, 'base64')
            : convertResult.gcode!,
        ],
        { type: 'text/plain' },
      );

      eventListeners.onFinished(taskBlob, convertResult.timeCost ?? 0, convertResult.metadata ?? {});
    } else {
      eventListeners.onError(convertResult.error?.message ?? 'Unknown error');
    }

    return {
      error: convertResult.error,
      success: convertResult.success,
    };
  }

  public async interruptCalculation(): Promise<{ error?: ErrorObject; success: boolean }> {
    return this.action('/parser', 'interrupt');
  }

  public async loadSettings(data: PreferenceSettingsObject): Promise<{ error?: ErrorObject; success: boolean }> {
    return this.action('/parser', 'loadSettings', data);
  }

  // System API
  public async getSystemInfo(): Promise<{
    error?: ErrorObject;
    info?: SystemInfo;
    success: boolean;
  }> {
    return this.action('/ws/sr/system', 'getInfo');
  }

  // Device API
  public async listDevices(): Promise<{
    devices?: IDeviceInfo[];
    error?: ErrorObject;
    success: boolean;
  }> {
    return this.action('/devices', 'list');
  }

  public async connectDevice(port: string): Promise<{ error?: ErrorObject; success: boolean }> {
    this.port = port;

    return this.action(`/devices/${port}`, 'connect');
  }

  public async startTask(taskTime?: number): Promise<{ error?: ErrorObject; success: boolean }> {
    return this.action(`/devices/${this.port}`, 'start', { taskTime });
  }

  public async pauseTask(): Promise<{ error?: ErrorObject; success: boolean }> {
    return this.action(`/devices/${this.port}`, 'pause');
  }

  public async resumeTask(): Promise<{ error?: ErrorObject; success: boolean }> {
    return this.action(`/devices/${this.port}`, 'resume');
  }

  public async stopTask(): Promise<{ error?: ErrorObject; success: boolean }> {
    return this.action(`/devices/${this.port}`, 'stop');
  }

  public async getDeviceParam<T = number>(name: string): Promise<{ status: string; value: T }> {
    return this.action(`/devices/${this.port}`, 'getParam', { name });
  }

  public async setDeviceParam(name: string, value: number | string): Promise<void> {
    return this.action(`/devices/${this.port}`, 'setParam', { name, value });
  }

  public async setScanaheadParams(params: Record<string, number>): Promise<boolean> {
    return this.action(`/devices/${this.port}`, 'setScanaheadParams', params);
  }

  public async setDeviceCorrection(data: { [key: string]: number }): Promise<boolean> {
    return this.action(`/devices/${this.port}`, 'setCorrection', data);
  }

  public async getDeviceSettings(): Promise<{
    error?: ErrorObject;
    settings?: DeviceSettings;
    success: boolean;
  }> {
    return this.action(`/devices/${this.port}`, 'getSettings');
  }

  public async updateDeviceSettings(settings: DeviceSettings): Promise<{
    error?: ErrorObject;
    success: boolean;
  }> {
    return this.action(`/devices/${this.port}`, 'updateSettings', settings);
  }

  public async deleteDeviceSettings(name: string): Promise<{ error?: ErrorObject; success: boolean }> {
    return this.action(`/devices/${this.port}`, 'deleteSettings', { name });
  }

  public async updateFirmware(blob: Blob, type: FirmwareType): Promise<{ error?: ErrorObject; success: boolean }> {
    const command = match(type)
      .with('firmware', () => 'updateFirmware')
      .with('headboard', () => 'updateHeadboard')
      .with('mainboard', () => 'updateMainboard')
      .exhaustive();

    return this.action(`/devices/${this.port}`, command, blob);
  }

  public async endMode(): Promise<{ error?: ErrorObject; success: boolean }> {
    return this.action(`/devices/${this.port}`, 'endMode');
  }

  public async switchMode(mode: string): Promise<{ error?: ErrorObject; success: boolean }> {
    return this.action(`/devices/${this.port}`, 'switchMode', mode);
  }

  public async quitTask(): Promise<{ error?: ErrorObject; success: boolean }> {
    return this.action(`/devices/${this.port}`, 'quit');
  }

  public async downloadLog(logName: string): Promise<Blob> {
    return this.action(`/devices/${this.port}`, 'downloadLog', logName);
  }

  public async downloadFile(fileNameWithPath: string): Promise<Blob> {
    return this.action(`/devices/${this.port}`, 'downloadFile', fileNameWithPath);
  }

  public async close(): Promise<void> {
    console.error('Someone trying to close the Swiftray client');
    console.trace();
    this.socket?.close();
  }

  public async deviceInfo(): Promise<IDeviceDetailInfo> {
    return this.action(`/devices/${this.port}`, 'info');
  }

  public async getPreview(): Promise<Blob> {
    return this.action(`/devices/${this.port}`, 'getPreview');
  }

  public async startFraming(opt?: TPromarkFramingOpt): Promise<void> {
    const { width } = getWorkarea('fpm1');

    return this.action(`/devices/${this.port}`, 'startFraming', { ...opt, width });
  }

  public async stopFraming(): Promise<void> {
    return this.action(`/devices/${this.port}`, 'stopFraming');
  }

  public async kick(): Promise<void> {
    return this.action(`/devices/${this.port}`, 'kick');
  }

  public async upload(data: Blob, path?: string): Promise<void> {
    const checkDoor = useDocumentStore.getState()['promark-safety-door'];

    try {
      const text = await data.text();

      return await this.action(`/devices/${this.port}`, 'upload', { checkDoor, data: text, path });
    } catch {
      return this.action(`/devices/${this.port}`, 'upload', { checkDoor, data, path });
    }
  }

  public async sendGCode(command: string): Promise<void> {
    return this.action(`/devices/${this.port}`, 'sendGCode', command);
  }

  public async getDeviceStatus(): Promise<IReport> {
    return this.action<IReport>(`/devices/${this.port}`, 'getStatus');
  }

  public async home(): Promise<void> {
    return this.action(`/devices/${this.port}`, 'home');
  }

  public async checkButton(): Promise<ButtonState> {
    return this.action<ButtonState>(`/devices/${this.port}`, 'checkButton');
  }
}

const checkSwiftray = (): boolean => {
  const res = !isWeb() && getOS() !== 'Linux';

  if (!res) {
    return false;
  }

  return communicator.sendSync(BackendEvents.CheckSwiftray);
};
const hasSwiftray = checkSwiftray();

const swiftrayHost = localStorage.getItem('swiftrayHost') || 'localhost';
const swiftrayClient = new SwiftrayClient(`ws://${swiftrayHost}:6611`);

const getDeviceClient = async (port: string): Promise<SwiftrayClient> => {
  console.log(`Connecting to device on port ${port}`);
  // TODO:SWIFTRAY - Open a new instance of Swiftray, and use different port number
  // const sc = new SwiftrayClient(`ws://localhost:6611/`);
  await swiftrayClient.connectDevice(port);

  return swiftrayClient;
};

export {
  getDeviceClient,
  hasSwiftray,
  swiftrayClient, // default connection to Swiftray server
  SwiftrayClient,
};
