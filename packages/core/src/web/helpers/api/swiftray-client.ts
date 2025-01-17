/* eslint-disable @typescript-eslint/no-explicit-any */
// Swiftray Client Typescript API Client
import EventEmitter from 'eventemitter3';

import communicator from 'implementations/communicator';
import deviceMaster from 'helpers/device-master';
import i18n from 'helpers/i18n';
import isWeb from 'helpers/is-web';
import MessageCaller, { MessageLevel } from 'app/actions/message-caller';
import TopBarController from 'app/views/beambox/TopBar/contexts/TopBarController';
import { booleanConfig, getDefaultConfig } from 'helpers/layer/layer-config-helper';
import { ButtonState } from 'interfaces/Promark';
import { getWorkarea, WorkAreaModel } from 'app/constants/workarea-constants';
import { IDeviceDetailInfo, IDeviceInfo, IReport } from 'interfaces/IDevice';
import { IWrappedSwiftrayTaskFile } from 'interfaces/IWrappedFile';
import { promarkModels } from 'app/actions/beambox/constant';

interface ErrorObject {
  code: number;
  message: string;
  details?: any;
}

interface DeviceSettings {
  workingRange: {
    x: number;
    y: number;
  };
  origin: {
    x: number;
    y: number;
  };
  calibrationData: string;
}

// SystemInfo
interface SystemInfo {
  swiftrayVersion: string;
  qtVersion: string;
  os: string;
  cpuArchitecture: string;
  totalMemory: number;
  availableMemory: number;
}

// PreferenceSettingsObject
interface PreferenceSettingsObject {
  convertSettings: {
    unitScaling: number;
    optimizePaths: boolean;
    joinCurves: boolean;
    filletCorners: boolean;
    simplifyGeometry: boolean;
  };
}

type TStatus = 'init' | 'connected' | 'disconnected';

class SwiftrayClient extends EventEmitter {
  private socket: WebSocket; // The websocket here is the browser websocket, not wrapped FLUX websocket

  private retryCount = 0;

  private maxRetries = 200;

  private retryDelay = 5000;

  private port = '';

  private instanceId = '';

  private status: TStatus = 'init';

  private lastPromark: IDeviceInfo = null;

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

  private connect() {
    this.socket = new WebSocket(this.url);
    this.socket.onopen = this.handleOpen.bind(this);
    this.socket.onclose = this.handleClose.bind(this);
    this.socket.onerror = this.handleError.bind(this);
    this.socket.onmessage = this.handleMessage.bind(this);
  }

  private async updateStatus(newStatus: TStatus): Promise<void> {
    if (newStatus === 'disconnected') {
      if (this.status !== 'connected') return;
      MessageCaller.openMessage({
        key: 'swiftray-error-hint',
        content: i18n.lang.message.swiftray_disconnected,
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
        // eslint-disable-next-line no-await-in-loop
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
        key: 'swiftray-error-hint',
        content: i18n.lang.message.swiftray_reconnected,
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
    console.log(`Swiftray version ${resp?.info?.swiftrayVersion}`);
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
  }

  public async action<T>(path: string, action: string, params?: any): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36).substr(2, 9);
      const payload = { id, action, params };
      if (this.readyState !== WebSocket.OPEN && action !== 'list') {
        MessageCaller.openMessage({
          key: 'swiftray-error-hint',
          content: i18n.lang.message.swiftray_disconnected,
          level: MessageLevel.ERROR,
        });
      }
      this.socket.send(JSON.stringify({ type: 'action', path, data: payload }));

      const callback = (data) => {
        if (data.id === id) {
          this.removeListener('callback', callback);
          // console.log("SR Client Callback", data);
          resolve(data.result);
        }
      };
      this.addListener('callback', callback);
    });
  }

  // Parser API
  public async loadSVG(
    file: IWrappedSwiftrayTaskFile,
    eventListeners: {
      onProgressing: (progress) => void;
      onFinished: () => void;
      onError: (message: string) => void;
    },
    loadOptions: {
      model: string;
      rotaryMode: boolean;
      engraveDpi: number;
    }
  ): Promise<{ success: boolean; error?: ErrorObject }> {
    const defaultConfig: any = getDefaultConfig();
    booleanConfig.forEach((key) => {
      if (defaultConfig[key]) defaultConfig[key] = 1;
    });
    const uploadRes = await this.action<{ success: boolean; error?: ErrorObject }>(
      '/parser',
      'loadSVG',
      {
        file,
        model: loadOptions.model,
        rotaryMode: loadOptions.rotaryMode,
        engraveDpi: loadOptions.engraveDpi,
        defaultConfig,
      }
    );
    return uploadRes;
  }

  public async convert(
    type: 'gcode' | 'fcode' | 'preview',
    eventListeners: {
      onProgressing: (progress) => void;
      onFinished: (
        taskBlob: Blob,
        fileName: string,
        timeCost: number,
        metadata: Record<string, string>
      ) => void;
      onError: (message: string) => void;
    },
    convertOptions: {
      model: WorkAreaModel;
      isPromark: boolean;
      enableAutoFocus?: boolean;
      enableDiode?: boolean;
      shouldUseFastGradient?: boolean;
      shouldMockFastGradient?: boolean;
      vectorSpeedConstraint?: boolean;
      paddingAccel?: number;
      travelSpeed?: number;
    }
  ): Promise<{
    success: boolean;
    estimatedTime?: number;
    error?: ErrorObject;
  }> {
    const workarea = getWorkarea(convertOptions.model);
    const convertResult = await this.action<{
      success: boolean;
      fileName?: string;
      timeCost?: number;
      fcode?: string;
      gcode?: string;
      estimatedTime?: number;
      metadata?: Record<string, string>;
      error?: ErrorObject;
    }>('/parser', 'convert', {
      type,
      workarea: {
        width: workarea.width,
        height: workarea.displayHeight || workarea.height,
      },
      ...convertOptions,
    });
    const taskBlob = new Blob(
      [type === 'fcode' ? Buffer.from(convertResult.fcode, 'base64') : convertResult.gcode],
      { type: 'text/plain' }
    );
    eventListeners.onFinished(
      taskBlob,
      convertResult.fileName,
      convertResult.timeCost,
      convertResult.metadata
    );
    return {
      success: convertResult.success,
      error: convertResult.error,
    };
  }

  public async interruptCalculation(): Promise<{ success: boolean; error?: ErrorObject }> {
    return this.action('/parser', 'interrupt');
  }

  public async loadSettings(
    data: PreferenceSettingsObject
  ): Promise<{ success: boolean; error?: ErrorObject }> {
    return this.action('/parser', 'loadSettings', data);
  }

  // System API
  public async getSystemInfo(): Promise<{
    success: boolean;
    info?: SystemInfo;
    error?: ErrorObject;
  }> {
    return this.action('/ws/sr/system', 'getInfo');
  }

  // Device API
  public async listDevices(): Promise<{
    success: boolean;
    devices?: IDeviceInfo[];
    error?: ErrorObject;
  }> {
    return this.action('/devices', 'list');
  }

  public async connectDevice(port: string): Promise<{ success: boolean; error?: ErrorObject }> {
    this.port = port;
    return this.action(`/devices/${port}`, 'connect');
  }

  public async startTask(): Promise<{ success: boolean; error?: ErrorObject }> {
    return this.action(`/devices/${this.port}`, 'start');
  }

  public async pauseTask(): Promise<{ success: boolean; error?: ErrorObject }> {
    return this.action(`/devices/${this.port}`, 'pause');
  }

  public async resumeTask(): Promise<{ success: boolean; error?: ErrorObject }> {
    return this.action(`/devices/${this.port}`, 'resume');
  }

  public async stopTask(): Promise<{ success: boolean; error?: ErrorObject }> {
    return this.action(`/devices/${this.port}`, 'stop');
  }

  public async getDeviceParam<T = number>(name: string): Promise<{ status: string; value: T }> {
    return this.action(`/devices/${this.port}`, 'getParam', { name });
  }

  public async setDeviceParam(name: string, value: string | number): Promise<void> {
    return this.action(`/devices/${this.port}`, 'setParam', { name, value });
  }

  public async setScanaheadParams(params: Record<string, number>): Promise<boolean> {
    return this.action(`/devices/${this.port}`, 'setScanaheadParams', params);
  }

  public async setDeviceCorrection(data: { [key: string]: number }): Promise<boolean> {
    return this.action(`/devices/${this.port}`, 'setCorrection', data);
  }

  public async getDeviceSettings(): Promise<{
    success: boolean;
    settings?: DeviceSettings;
    error?: ErrorObject;
  }> {
    return this.action(`/devices/${this.port}`, 'getSettings');
  }

  public async updateDeviceSettings(settings: DeviceSettings): Promise<{
    success: boolean;
    error?: ErrorObject;
  }> {
    return this.action(`/devices/${this.port}`, 'updateSettings', settings);
  }

  public async deleteDeviceSettings(
    name: string
  ): Promise<{ success: boolean; error?: ErrorObject }> {
    return this.action(`/devices/${this.port}`, 'deleteSettings', { name });
  }

  public async updateFirmware(blob: Blob): Promise<{ success: boolean; error?: ErrorObject }> {
    return this.action(`/devices/${this.port}`, 'updateFirmware', blob);
  }

  public async endMode(): Promise<{ success: boolean; error?: ErrorObject }> {
    return this.action(`/devices/${this.port}`, 'endMode');
  }

  public async switchMode(mode: string): Promise<{ success: boolean; error?: ErrorObject }> {
    return this.action(`/devices/${this.port}`, 'switchMode', mode);
  }

  public async quitTask(): Promise<{ success: boolean; error?: ErrorObject }> {
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
    this.socket.close();
  }

  public async deviceInfo(): Promise<IDeviceDetailInfo> {
    return this.action(`/devices/${this.port}`, 'info');
  }

  public async getPreview(): Promise<Blob> {
    return this.action(`/devices/${this.port}`, 'getPreview');
  }

  public async startFraming(points?: [number, number][]): Promise<void> {
    const { width } = getWorkarea('fpm1');
    return this.action(`/devices/${this.port}`, 'startFraming', { points, width });
  }

  public async stopFraming(): Promise<void> {
    return this.action(`/devices/${this.port}`, 'stopFraming');
  }

  public async kick(): Promise<void> {
    return this.action(`/devices/${this.port}`, 'kick');
  }

  public async upload(data: Blob, path?: string): Promise<void> {
    try {
      const text = await data.text();
      return await this.action(`/devices/${this.port}`, 'upload', { data: text, path });
    } catch (e) {
      return this.action(`/devices/${this.port}`, 'upload', { data, path });
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
  const res = !isWeb() && window.os !== 'Linux';
  if (!res) return false;

  return communicator.sendSync('CHECK_SWIFTRAY');
};
const hasSwiftray = checkSwiftray();

const swiftrayClient = new SwiftrayClient('ws://localhost:6611');

const getDeviceClient = async (port: string): Promise<SwiftrayClient> => {
  console.log(`Connecting to device on port ${port}`);
  // TODO:SWIFTRAY - Open a new instance of Swiftray, and use different port number
  // const sc = new SwiftrayClient(`ws://localhost:6611/`);
  await swiftrayClient.connectDevice(port);
  return swiftrayClient;
};

export {
  hasSwiftray,
  swiftrayClient, // default connection to Swiftray server
  getDeviceClient,
  SwiftrayClient,
};
