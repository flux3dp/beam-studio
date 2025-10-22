import { EventEmitter } from 'eventemitter3';
import { match } from 'ts-pattern';

import ErrorConstants from '@core/app/constants/error-constants';
import rsaKey from '@core/helpers/rsa-key';
import Websocket from '@core/helpers/websocket';
import type { FisheyeCameraParameters, RotationParameters3D } from '@core/interfaces/FisheyePreview';
import type IControlSocket from '@core/interfaces/IControlSocket';
import type { Mode } from '@core/interfaces/IControlSocket';
import type { FirmwareType, IDeviceDetailInfo, IReport } from '@core/interfaces/IDevice';
import type { WrappedWebSocket } from '@core/interfaces/WebSocket';

const EVENT_COMMAND_MESSAGE = 'command-message';
const EVENT_COMMAND_ERROR = 'command-error';
const EVENT_COMMAND_FATAL = 'command-fatal';
const EVENT_COMMAND_PROGRESS = 'command-progress';

const MAX_TASK_QUEUE = 30;
const CONNECTION_TIMEOUT = 30 * 1000;
const CONNECTION_TIMEOUT_ERROR = {
  error: 'TIMEOUT',
  info: 'connection timeout',
  status: 'error',
};

class Control extends EventEmitter implements IControlSocket {
  public isConnected = false;

  private taskQueue: Array<{
    args: any[];
    reject: Function;
    resolve: Function;
    taskFunction: Function;
  }> = [];

  private currentTask:
    | undefined
    | {
        args: any[];
        reject: Function;
        resolve: Function;
        taskFunction: Function;
      } = undefined;

  private isProcessingTask = false;

  private ws!: WrappedWebSocket;

  private dedicatedWs: WrappedWebSocket[] = [];

  private fileInfoWsId = 0;

  private mode: Mode = '';

  private _lineNumber = 0;

  private _isLineCheckMode = false;

  private _cartridgeTaskId = 0;

  protected uuid: string;

  constructor(uuid: string) {
    super();
    this.uuid = uuid;
    this.on('error', (error) => {
      console.log(`Control ${this.uuid} Socket Error:`, error);
    });
  }

  get connection() {
    return this.ws;
  }

  getMode() {
    return this.mode;
  }

  get isLineCheckMode() {
    return this._isLineCheckMode;
  }

  set isLineCheckMode(lineCheckMode: boolean) {
    this._isLineCheckMode = lineCheckMode;
  }

  get lineNumber() {
    return this._lineNumber;
  }

  set lineNumber(lineNumber) {
    this._lineNumber = lineNumber;
  }

  addTask<T>(taskFunction: (...args: any[]) => T, ...args: any[]): Promise<T> {
    if (this.taskQueue.length > MAX_TASK_QUEUE) {
      console.error(`Control ${this.uuid} task queue exceeds max queue length. Clear queue and then send task`);
      this.taskQueue = [];
      this.currentTask = undefined;
      this.isProcessingTask = false;
    }

    return new Promise<any>((resolve, reject) => {
      this.taskQueue.push({ args, reject, resolve, taskFunction });

      if (!this.isProcessingTask && !this.currentTask) {
        this.doTask();
      }
    });
  }

  async doTask() {
    this.currentTask = this.taskQueue.shift()!;

    const { args, reject, resolve, taskFunction } = this.currentTask;

    try {
      const res = await taskFunction(...args);

      resolve(res);
    } catch (error) {
      reject(error);
      console.error(`Control ${this.uuid} task error:`, error, taskFunction?.name, args);
    }

    if (this.taskQueue.length > 0) {
      this.doTask();
    } else {
      this.currentTask = undefined;
      this.isProcessingTask = false;
    }
  }

  async connect() {
    this.ws = await this.createWs();
  }

  async createWs() {
    const { uuid } = this;
    let timeoutTimer: NodeJS.Timeout | undefined = undefined;

    const ws = await new Promise<WrappedWebSocket>((resolve, reject) => {
      const newSocket = Websocket({
        autoReconnect: false,
        method: `control/${uuid}`,
        onClose: (response: CloseEvent) => {
          clearTimeout(timeoutTimer);
          reject(response);
          console.log(`Control of ${uuid} closed:`, response);
          this.isConnected = false;
          this.emit('close', response);
        },
        onError: (response: any) => {
          console.log(`Control of ${uuid} error:`, response);
          clearTimeout(timeoutTimer);
          this.emit('error', response);
          this.emit(EVENT_COMMAND_ERROR, response);
        },
        onFatal: (response: any) => {
          clearTimeout(timeoutTimer);
          reject(response);
          this.emit('fatal', response);
          this.emit(EVENT_COMMAND_FATAL, response);
        },
        onMessage: (data) => {
          switch (data.status) {
            case 'connecting':
              clearTimeout(timeoutTimer);
              timeoutTimer = setTimeout(() => {
                reject(CONNECTION_TIMEOUT_ERROR);
              }, CONNECTION_TIMEOUT);
              break;
            case 'connected':
              clearTimeout(timeoutTimer);
              this.isConnected = true;
              console.log('Control WS Connected', data);
              this.emit('connected', data);
              resolve(newSocket);
              break;
            default:
              this.emit('message', data);
              this.emit(EVENT_COMMAND_MESSAGE, data);
              break;
          }
        },
        onOpen() {
          newSocket.send(rsaKey());
        },
      });
    });

    return ws;
  }

  killSelf = async () => {
    for (const ws of this.dedicatedWs) {
      if (ws) {
        ws.send('kick');
        ws.close();
      }
    }

    this.ws?.send('kick');
    this.ws?.close();
    await new Promise((r) => setTimeout(r, 500));

    return null;
  };

  setProgressListener(listener: (...args: any[]) => void) {
    this.removeAllListeners(EVENT_COMMAND_PROGRESS);
    this.on(EVENT_COMMAND_PROGRESS, listener);
  }

  removeCommandListeners() {
    this.removeAllListeners(EVENT_COMMAND_MESSAGE);
    this.removeAllListeners(EVENT_COMMAND_ERROR);
    this.removeAllListeners(EVENT_COMMAND_FATAL);
    this.removeAllListeners(EVENT_COMMAND_PROGRESS);
  }

  setTimeoutTimer(reject: Function, timeout = 30000) {
    return setTimeout(() => {
      this.removeCommandListeners();
      reject({ error: 'TIMEOUT', status: 'error', text: 'TIMEOUT' });
    }, timeout);
  }

  setDefaultErrorResponse(reject: Function, timeoutTimer?: NodeJS.Timeout) {
    this.on(EVENT_COMMAND_ERROR, (response) => {
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
      }

      this.removeCommandListeners();
      reject(response);
    });
  }

  setDefaultFatalResponse(reject: Function, timeoutTimer?: NodeJS.Timeout) {
    this.on(EVENT_COMMAND_FATAL, (response) => {
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
      }

      this.removeCommandListeners();
      reject(response);
    });
  }

  useWaitAnyResponse(command: string, timeout = 30000) {
    // Resolve after any response, equals to useDefaultResponse in old Control
    return new Promise<any>((resolve, reject) => {
      const timeoutTimer = this.setTimeoutTimer(reject, timeout);

      this.on(EVENT_COMMAND_MESSAGE, (response) => {
        clearTimeout(timeoutTimer);
        this.removeCommandListeners();
        resolve(response);
      });
      this.setDefaultErrorResponse(reject, timeoutTimer);
      this.setDefaultFatalResponse(reject, timeoutTimer);
      this.ws.send(command);
    });
  }

  useRawWaitOKResponse = (command: string, timeout = 30000) => {
    // Resolve after get ok from raw response
    return new Promise<string>((resolve, reject) => {
      const timeoutTimer = this.setTimeoutTimer(reject, timeout);
      let responseString = '';

      this.on(EVENT_COMMAND_MESSAGE, (response) => {
        if (response && response.status === 'raw') {
          responseString += response.text;
        }

        const resps = responseString.split(/\r?\n/);

        if (resps.includes('ok')) {
          clearTimeout(timeoutTimer);

          this.removeCommandListeners();
          resolve(responseString);
        } else if (resps.some((r) => r.startsWith('error:'))) {
          clearTimeout(timeoutTimer);

          this.removeCommandListeners();
          reject(responseString);
        }
      });
      this.setDefaultErrorResponse(reject, timeoutTimer);
      this.setDefaultFatalResponse(reject, timeoutTimer);
      this.ws.send(command);
    });
  };

  useWaitOKResponse(command: string, timeout = 30000) {
    // Resolve after get response whose status is ok
    return new Promise<{ data: any[]; response: any }>((resolve, reject) => {
      const data: any[] = [];
      const timeoutTimer = this.setTimeoutTimer(reject, timeout);

      this.on(EVENT_COMMAND_MESSAGE, (response) => {
        data.push(response);

        if (response.status === 'ok') {
          clearTimeout(timeoutTimer);
          this.removeCommandListeners();
          resolve({ data, response });
        }
      });
      this.setDefaultErrorResponse(reject, timeoutTimer);
      this.setDefaultFatalResponse(reject, timeoutTimer);
      this.ws.send(command);
    });
  }

  useRawLineCheckCommand(command: string, timeout = 30000) {
    return new Promise<string>((resolve, reject) => {
      let timeoutTimer = this.setTimeoutTimer(reject, timeout);
      let responseString = '';

      this.on(EVENT_COMMAND_MESSAGE, (response) => {
        if (timeoutTimer) {
          clearTimeout(timeoutTimer);
        }

        if (response && response.status === 'raw') {
          console.log(response.text);
          responseString += response.text;

          let responseStrings = responseString.split(/\r?\n/);

          responseStrings = responseStrings.filter(
            (s, i) => !s.startsWith('DEBUG:') || i === responseStrings.length - 1,
          );

          const isCommandCompleted = responseStrings.some(
            (s) => s.startsWith(`LN${this._lineNumber} 0`) || s.startsWith(`L${this._lineNumber} 0`),
          );
          const hasERL = responseStrings.some((s) => {
            if (s.startsWith('ERL')) {
              const correctLineNumber = Number(response.text.substring(3).split(' ')[0]);

              this._lineNumber = correctLineNumber;

              return true;
            }

            return false;
          });
          const hasError = responseStrings.some((s) => s.startsWith('ER'));

          // responseString = responseStrings[responseStrings.length - 1];
          if (isCommandCompleted) {
            this._lineNumber += 1;
            this.removeCommandListeners();
            resolve(responseString);
          } else if (hasERL) {
            const cmd = this.buildLineCheckCommand(command);

            console.log(cmd);
            timeoutTimer = this.setTimeoutTimer(reject, timeout);
            this.ws.send(cmd);
          } else if (hasError) {
            const cmd = this.buildLineCheckCommand(command);

            timeoutTimer = this.setTimeoutTimer(reject, timeout);
            this.ws.send(cmd);
          }
        }

        if (response.text.includes('ER:RESET')) {
          this.removeCommandListeners();
          reject(response);
        } else if (response.text.includes('error:')) {
          this.removeCommandListeners();
          reject(response);
        }
      });
      this.setDefaultErrorResponse(reject, timeoutTimer);
      this.setDefaultFatalResponse(reject, timeoutTimer);

      const cmd = this.buildLineCheckCommand(command);

      console.log(cmd);
      this.ws.send(cmd);
    });
  }

  buildLineCheckCommand(command: string) {
    const newCommand = `N${this._lineNumber}${command}`;
    let crc = 0;

    for (let i = 0; i < newCommand.length; i += 1) {
      if (newCommand[i] !== ' ') {
        const charCode = newCommand.charCodeAt(i);

        crc ^= charCode;
        crc += charCode;
      }
    }
    crc %= 65536;

    return `${newCommand}*${crc}`;
  }

  ls = async (path: string) => (await this.useWaitOKResponse(`file ls ${path}`)).response;

  lsusb = () => this.useWaitAnyResponse('file lsusb');

  fileInfo = async (path: string, fileName: string): Promise<any[]> => {
    const { data } = await this.useWaitOKResponse(`file fileinfo ${path}/${fileName}`);

    return [fileName, ...(data as [{ [key: string]: number | string }, Blob, { [key: string]: number | string }])];
  };

  report = () =>
    new Promise<{ device_status: IReport }>((resolve, reject) => {
      let retryTime = 0;
      const timeoutTimer = this.setTimeoutTimer(reject, 3000);

      this.on(EVENT_COMMAND_MESSAGE, (response) => {
        if (response.status === 'ok') {
          clearTimeout(timeoutTimer);
          this.removeCommandListeners();
          resolve(response);
        } else if (retryTime < 3) {
          retryTime += 1;
          console.log('retry report');
          this.ws.send('play report');
        } else {
          reject(response);
        }
      });
      this.setDefaultErrorResponse(reject, timeoutTimer);
      this.setDefaultFatalResponse(reject, timeoutTimer);
      this.ws.send('play report');
    });

  prepareUpload = (data: any, resolve: Function, reject: Function) => {
    const CHUNK_PKG_SIZE = 4096;
    const length = data.length || data.size;

    this.on(EVENT_COMMAND_MESSAGE, (response) => {
      if (response.status === 'continue') {
        for (let i = 0; i < length; i += CHUNK_PKG_SIZE) {
          const chunk = data.slice(i, i + CHUNK_PKG_SIZE);

          this.ws.send(chunk);
        }
      } else if (response.status === 'uploading') {
        this.emit(EVENT_COMMAND_PROGRESS, { step: response.sent, total: data.size });
      } else if (response.status === 'ok') {
        this.removeCommandListeners();
        resolve();
      } else if (response.status === 'error') {
        this.removeCommandListeners();
        reject(response);
      }
    });
    this.setDefaultErrorResponse(reject);
    this.setDefaultFatalResponse(reject);
  };

  upload = (data: any, path?: string, fileName?: string) =>
    new Promise<void>((resolve, reject) => {
      this.prepareUpload(data, resolve, reject);

      const mimeTypes = {
        fc: 'application/fcode',
        jpg: 'image/jpeg',
        json: 'application/json',
        png: 'image/png',
      };

      if (data.size === 0) {
        throw new Error('File is empty');
      }

      if (path && fileName) {
        fileName = fileName.replace(/ /g, '_');

        const ext = fileName.split('.').at(-1) as 'fc' | 'gcode' | 'jpg' | 'json' | 'png';

        if (ext === 'gcode') {
          const newFileName = fileName.split('.');

          newFileName.pop();
          newFileName.push('fc');

          fileName = newFileName.join('.');
          this.ws.send(`upload text/gcode ${data.size} ${path}/${fileName}`);
        } else if (mimeTypes[ext]) {
          this.ws.send(`upload ${mimeTypes[ext]} ${data.size} ${path}/${fileName}`);
        } else {
          throw new Error(`Unsupported file type ${ext}`);
        }
      } else {
        this.ws.send(`file upload application/fcode ${data.size}`);
      }
    });

  abort = () =>
    new Promise<any>((resolve, reject) => {
      let retryTime = 0;
      const retryTimeInterval = 2000;
      let timeoutTimer: NodeJS.Timeout | null;

      const retry = (needsQuit = false) => {
        retryTime += 1;
        setTimeout(() => {
          timeoutTimer = this.setTimeoutTimer(reject, 10000);

          if (needsQuit) {
            this.ws.send('play abort');
          } else {
            this.ws.send('play report');
          }
        }, retryTimeInterval);
      };

      this.on(EVENT_COMMAND_MESSAGE, (response) => {
        if (timeoutTimer) {
          clearTimeout(timeoutTimer);
        }

        if (retryTime >= 3) {
          console.log('Control Abort Tried 3 times');

          if (response.cmd === 'play report') {
            if (response.device_status.st_id === 0) {
              this.removeCommandListeners();
              resolve(null);

              return;
            }

            if (response.device_status.st_id === 64) {
              this.ws.send('play quit');
            }
          }

          this.removeCommandListeners();
          reject(response);
        } else {
          const deviceStatus = response.device_status || {};

          if (deviceStatus.st_id === 0 || deviceStatus.st_id === 128) {
            this.removeCommandListeners();
            resolve(null);
          } else {
            retry(response.status !== 'ok');
          }
        }
      });

      this.on(EVENT_COMMAND_ERROR, (response) => {
        if (timeoutTimer) {
          clearTimeout(timeoutTimer);
        }

        if (retryTime >= 3) {
          this.removeCommandListeners();
          reject(response);
        } else {
          retry();
        }
      });

      this.on(EVENT_COMMAND_FATAL, (response) => {
        if (timeoutTimer) {
          clearTimeout(timeoutTimer);
        }

        if (retryTime >= 3) {
          this.removeCommandListeners();
          reject(response);
        } else {
          retry();
        }
      });

      timeoutTimer = this.setTimeoutTimer(reject, 10000);
      this.ws.send('play abort');
    });

  quit = () =>
    new Promise((resolve, reject) => {
      let retryTime = 0;
      const retryTimeInterval = 2000;
      let timeoutTimer: NodeJS.Timeout | null;

      const retry = (needsQuit = false) => {
        retryTime += 1;
        setTimeout(() => {
          timeoutTimer = this.setTimeoutTimer(reject, 10000);

          if (needsQuit) {
            this.ws.send('play quit');
          } else {
            this.ws.send('play report');
          }
        }, retryTimeInterval);
      };

      this.on(EVENT_COMMAND_MESSAGE, (response) => {
        if (timeoutTimer) {
          clearTimeout(timeoutTimer);
        }

        if (retryTime >= 3) {
          console.log('Control Quit Tried 3 times');

          if (response.cmd === 'play report') {
            if (response.device_status.st_id === 0) {
              this.removeCommandListeners();
              resolve(null);

              return;
            }
          }

          this.removeCommandListeners();
          reject(response);
        } else {
          const deviceStatus = response.device_status || {};

          if (deviceStatus.st_id === 0) {
            this.removeCommandListeners();
            resolve(null);
          } else {
            retry(response.status !== 'ok');
          }
        }
      });

      this.on(EVENT_COMMAND_ERROR, (response) => {
        if (timeoutTimer) {
          clearTimeout(timeoutTimer);
        }

        if (retryTime >= 3) {
          this.removeCommandListeners();
          reject(response);
        } else {
          retry();
        }
      });

      this.on(EVENT_COMMAND_FATAL, (response) => {
        if (timeoutTimer) {
          clearTimeout(timeoutTimer);
        }

        if (retryTime >= 3) {
          this.removeCommandListeners();
          reject(response);
        } else {
          retry();
        }
      });

      timeoutTimer = this.setTimeoutTimer(reject, 10000);
      this.ws.send('play quit');
    });

  start = () => this.useWaitAnyResponse('play start');

  pause = () => this.useWaitAnyResponse('play pause');

  resume = () => this.useWaitAnyResponse('play resume');

  restart = () => this.useWaitAnyResponse('play restart');

  kick = () => this.useWaitAnyResponse('kick');

  quitTask = () => {
    this.mode = '';

    return this.useWaitAnyResponse('task quit');
  };

  deviceDetailInfo = (): Promise<IDeviceDetailInfo> => {
    if (this.mode) {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }

    return this.useWaitAnyResponse('deviceinfo');
  };

  getPreview = async () => {
    const { data } = await this.useWaitOKResponse('play info');

    return data;
  };

  select = (path: string[], fileName: string) =>
    this.useWaitAnyResponse(fileName === '' ? `play select ${path.join('/')}` : `play select ${path}/${fileName}`);

  deleteFile = (fileNameWithPath: string) => this.useWaitAnyResponse(`file rmfile ${fileNameWithPath}`);

  downloadFile = (fileNameWithPath: string) =>
    new Promise<[string, Blob]>((resolve, reject) => {
      let metadata: any = null;

      this.on(EVENT_COMMAND_MESSAGE, (response) => {
        if (response.status === 'continue') {
          this.emit(EVENT_COMMAND_PROGRESS, response);
        } else if (!(response instanceof Blob)) {
          metadata = response;
        }

        if (response instanceof Blob) {
          this.removeCommandListeners();
          resolve([metadata, response]);
        }
      });
      this.setDefaultErrorResponse(reject);
      this.setDefaultFatalResponse(reject);

      this.ws.send(`file download ${fileNameWithPath}`);
    });

  downloadLog = (logName: string) =>
    new Promise<[string, Blob]>((resolve, reject) => {
      let metadata: any = null;

      this.on(EVENT_COMMAND_MESSAGE, (response) => {
        if (response.status === 'transfer') {
          this.emit(EVENT_COMMAND_PROGRESS, response);
        } else if (!Object.keys(response).includes('completed')) {
          metadata = response;
        }

        if (response instanceof Blob) {
          this.removeCommandListeners();
          resolve([metadata, response]);
        }
      });
      this.setDefaultErrorResponse(reject);
      this.setDefaultFatalResponse(reject);

      this.ws.send(`fetch_log ${logName}`);
    });

  fetchCameraCalibrateImage = (fileName?: string) =>
    new Promise<Blob>((resolve, reject) => {
      const file = [];

      this.on(EVENT_COMMAND_MESSAGE, (response) => {
        if (response.status === 'transfer') {
          this.emit(EVENT_COMMAND_PROGRESS, response);
        } else if (!Object.keys(response).includes('completed')) {
          file.push(response);
        }

        if (response instanceof Blob) {
          this.removeCommandListeners();
          resolve(response);
        }
      });
      this.setDefaultErrorResponse(reject);
      this.setDefaultFatalResponse(reject);

      this.ws.send(`fetch_camera_calib_pictures ${fileName}`);
    });

  fetchFisheyeParams = () =>
    new Promise<FisheyeCameraParameters>((resolve, reject) => {
      const file = [];

      this.on(EVENT_COMMAND_MESSAGE, async (response) => {
        console.log(response);

        if (response.status === 'transfer') {
          this.emit(EVENT_COMMAND_PROGRESS, response);
        } else if (!Object.keys(response).includes('completed')) {
          file.push(response);
        }

        if (response instanceof Blob) {
          this.removeCommandListeners();

          const fileReader = new FileReader();

          fileReader.onload = (e) => {
            try {
              const jsonString = e.target?.result as string;
              const data = JSON.parse(jsonString) as FisheyeCameraParameters;

              console.log(data);
              resolve(data);
            } catch (err) {
              reject(err);
            }
          };
          fileReader.readAsText(response);
        }
      });
      this.setDefaultErrorResponse(reject);
      this.setDefaultFatalResponse(reject);

      this.ws.send('fetch_fisheye_params');
    });

  fetchFisheye3DRotation = () =>
    new Promise<RotationParameters3D>((resolve, reject) => {
      const file = [];

      this.on(EVENT_COMMAND_MESSAGE, async (response) => {
        if (response.status === 'transfer') {
          this.emit(EVENT_COMMAND_PROGRESS, response);
        } else if (!Object.keys(response).includes('completed')) {
          file.push(response);
        }

        if (response instanceof Blob) {
          this.removeCommandListeners();

          const fileReader = new FileReader();

          fileReader.onload = (e) => {
            try {
              const jsonString = e.target?.result as string;
              const data = JSON.parse(jsonString) as RotationParameters3D;

              resolve(data);
            } catch (err) {
              reject(err);
            }
          };
          fileReader.readAsText(response);
        }
      });
      this.setDefaultErrorResponse(reject);
      this.setDefaultFatalResponse(reject);

      this.ws.send('fetch_fisheye_3d_rotation');
    });

  fetchAutoLevelingData = (dataType: 'bottom_cover' | 'hexa_platform' | 'offset') =>
    new Promise<{ [key: string]: number }>((resolve, reject) => {
      const file = [];

      this.on(EVENT_COMMAND_MESSAGE, (response) => {
        if (response.status === 'transfer') {
          this.emit(EVENT_COMMAND_PROGRESS, response);
        } else if (!Object.keys(response).includes('completed')) {
          file.push(response);
        }

        if (response instanceof Blob) {
          this.removeCommandListeners();

          const fileReader = new FileReader();

          fileReader.onload = (e) => {
            try {
              const jsonString = e.target?.result as string;
              const data = JSON.parse(jsonString) as { [key: string]: number };

              resolve(data);
            } catch (err) {
              reject(err);
            }
          };
          fileReader.readAsText(response);
        }
      });
      this.setDefaultErrorResponse(reject);
      this.setDefaultFatalResponse(reject);

      this.ws.send(`fetch_auto_leveling_data ${dataType}`);
    });

  getLaserPower = async () => (await this.useWaitOKResponse('play get_laser_power')).response;

  setLaserPower = async (power: number) => (await this.useWaitOKResponse(`play set_laser_power ${power}`)).response;

  setLaserPowerTemp = async (power: number) =>
    (await this.useWaitOKResponse(`play set_laser_power_temp ${power}`)).response;

  getLaserSpeed = async () => (await this.useWaitOKResponse('play get_laser_speed')).response;

  setLaserSpeed = async (speed: number) => (await this.useWaitOKResponse(`play set_laser_speed ${speed}`)).response;

  setLaserSpeedTemp = async (speed: number) =>
    (await this.useWaitOKResponse(`play set_laser_speed_temp ${speed}`)).response;

  getFan = async () => (await this.useWaitOKResponse('play get_fan')).response;

  setFan = async (fanSpeed: number) => (await this.useWaitOKResponse(`play set_fan ${fanSpeed}`)).response;

  setFanTemp = async (fanSpeed: number) => (await this.useWaitOKResponse(`play set_fan_temp ${fanSpeed}`)).response;

  setOriginX = async (x: number) => (await this.useWaitOKResponse(`play set_origin_x ${x}`)).response;

  setOriginY = async (y: number) => (await this.useWaitOKResponse(`play set_origin_y ${y}`)).response;

  setField = async () => {
    throw new Error('Method not implemented.');
  };

  setLensCorrection = async () => {
    throw new Error('Method not implemented.');
  };

  getDoorOpen = async () => (await this.useWaitOKResponse('play get_door_open')).response;

  getDeviceSetting = (name: string) => this.useWaitAnyResponse(`config get ${name}`);

  setDeviceSetting = (name: string, value: string) => this.useWaitAnyResponse(`config set ${name} ${value}`);

  deleteDeviceSetting = (name: string) => this.useWaitAnyResponse(`config del ${name}`);

  enterSubTask = async (mode: Mode, timeout = 0) => {
    const res = await this.useWaitAnyResponse(`task ${mode}`);

    if (timeout) await new Promise((resolve) => setTimeout(resolve, timeout));

    this.mode = mode;

    if (mode === 'cartridge_io') this._cartridgeTaskId = Math.floor(Math.random() * 2e9);

    return res;
  };

  endSubTask = () => {
    this.mode = '';
    this._cartridgeTaskId = 0;

    return this.useWaitAnyResponse('task quit');
  };

  getCartridgeChipData = async () => {
    if (this.mode !== 'cartridge_io') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }

    const command = JSON.stringify({
      id: this._cartridgeTaskId,
      method: 'cartridge.get_info',
    }).replace(/"/g, '\\"');
    const resp = await this.useWaitAnyResponse(`jsonrpc_req ${command}`);

    return resp;
  };

  cartridgeIOJsonRpcReq = async (method: string, params: unknown) => {
    if (this.mode !== 'cartridge_io') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }

    const command = JSON.stringify({ id: this._cartridgeTaskId, method, params }).replace(/"/g, '\\"');
    const resp = await this.useWaitAnyResponse(`jsonrpc_req "${command}"`);

    return resp;
  };

  /**
   * Because the fluxghost websocket wont send message if the control socket is kicked now.
   * This is a workaround to check if the task is kicked or the web socket is closed to send
   * an arbitrary message to see if the control socket is kicked.
   * It is better to replace the websocket of fluxghost to a more modern one though
   */
  checkTaskAlive = async () => {
    try {
      const resp = await this.useWaitAnyResponse(' ');
      const { data } = resp;

      return !data.includes('KICKED');
    } catch {
      return false;
    }
  };

  takeReferenceZ = async (args: { F?: number; H?: number; X?: number; Y?: number } = {}): Promise<number> => {
    if (this.mode !== 'red_laser_measure') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }

    const posCommand = (Object.keys(args) as Array<keyof typeof args>)
      .filter((key) => args[key] !== undefined)
      .map((key) => `${key}:${args[key]!.toFixed(3)}`)
      .join(',');
    const resp = await this.useWaitAnyResponse(`take_reference_z${posCommand ? `(${posCommand})` : ''}`, 180000);
    const { data } = resp;

    if (data) {
      if (data.startsWith('ok')) {
        const height = /take_reference_z(\([XYF:.,\d]*\))?: ([\d.]+)\b/.exec(data)?.[2];

        return Number(height);
      }

      if (data.startsWith('fail') || data.startsWith('error')) {
        throw new Error(data);
      }
    }

    throw new Error(JSON.stringify(resp));
  };

  measureZ = async (
    args: { F?: number; X?: number; Y?: number } = {},
  ): Promise<{ height: number; xOffset?: number; yOffset?: number }> => {
    if (this.mode !== 'red_laser_measure') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }

    const posCommand = (Object.keys(args) as Array<keyof typeof args>)
      .filter((key) => args[key] !== undefined)
      .map((key) => `${key}:${args[key]!.toFixed(3)}`)
      .join(',');
    const resp = await this.useWaitAnyResponse(`measure_z${posCommand ? `(${posCommand})` : ''}`, 60000);
    const { data } = resp;

    if (data) {
      if (data.startsWith('ok')) {
        const match = /measure_z\([^)]*\): (-?[\d.]+)(?:,(-?[\d.]+))?(?:,(-?[\d.]+))?/.exec(data);

        if (match) {
          const height = match[1];
          const xOffset = match[2];
          const yOffset = match[3];

          return {
            height: Number(height),
            xOffset: xOffset ? Number(xOffset) : undefined,
            yOffset: yOffset ? Number(yOffset) : undefined,
          };
        }

        throw new Error(`Invalid measure_z response: ${data}`);
      }

      if (data.startsWith('fail') || data.startsWith('error')) {
        throw new Error(data);
      }
    }

    throw new Error(JSON.stringify(resp));
  };

  zSpeedLimitTestSetSpeed = async (speed: number) => {
    if (this.mode !== 'z_speed_limit_test') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }

    const res = await this.useWaitAnyResponse(`set_speed ${speed}`);

    return res?.data === 'ok';
  };

  zSpeedLimitTestStart = async () => {
    if (this.mode !== 'z_speed_limit_test') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }

    const res = await this.useWaitOKResponse('start', 90000);

    return res?.response.data.includes('pass');
  };

  enterRawMode = async () => {
    const res = await this.useWaitAnyResponse('task raw');

    await new Promise((resolve) => setTimeout(resolve, 3000));
    this.mode = 'raw';

    return res;
  };

  rawHome = ({ cameraMode = false, zAxis = false }: { cameraMode?: boolean; zAxis?: boolean } = {}) => {
    if (this.mode !== 'raw') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }

    return new Promise<void>((resolve, reject) => {
      let didErrorOccur = false;
      let isCmdResent = false;
      let responseString = '';
      let retryTimes = 0;
      let timeoutTimer: NodeJS.Timeout | undefined;

      this.on(EVENT_COMMAND_MESSAGE, (response) => {
        clearTimeout(timeoutTimer);

        if (response && response.status === 'raw') {
          responseString += response.text;
          console.log('raw homing:\t', responseString);
        }

        const resps = responseString.split(/\r?\n/);

        if (resps.some((resp) => resp.includes('ok')) && !didErrorOccur) {
          this.removeCommandListeners();
          resolve();

          return;
        }

        if (
          response.text?.indexOf('ER:RESET') >= 0 ||
          response.text?.indexOf('DEBUG: RESET') >= 0 ||
          response.text?.indexOf('error:') >= 0 ||
          resps.some((resp) => resp.includes('ER:RESET')) ||
          resps.some((resp) => resp.includes('DEBUG: RESET')) ||
          resps.some((resp) => resp.includes('error:'))
        ) {
          didErrorOccur = true;

          if (retryTimes > 5) {
            this.removeCommandListeners();
            reject(response);

            return;
          }

          if (!isCmdResent) {
            isCmdResent = true;
            setTimeout(() => {
              didErrorOccur = false;
              isCmdResent = false;
              responseString = '';
              retryTimes += 1;
              timeoutTimer = this.setTimeoutTimer(reject, 10000);
              this.ws.send('raw home');
            }, 1000);
          }
        } else {
          timeoutTimer = this.setTimeoutTimer(reject, 10000);
        }

        responseString = resps[resps.length - 1] || '';
      });
      this.setDefaultErrorResponse(reject, timeoutTimer);
      this.setDefaultFatalResponse(reject, timeoutTimer);

      timeoutTimer = this.setTimeoutTimer(reject, 10000);

      if (cameraMode) {
        this.ws.send('$HCAM');
      } else if (zAxis) {
        this.ws.send('$HZ');
      } else {
        this.ws.send('raw home');
      }
    });
  };

  rawUnlock = () => {
    if (this.mode !== 'raw') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }

    return this.useRawWaitOKResponse('$X');
  };

  rawMoveZRel = (z: number) => {
    if (this.mode !== 'raw') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }

    const cmd = `M137P184Q${z}`;

    if (!this._isLineCheckMode) {
      return this.useWaitAnyResponse(cmd);
    }

    return this.useRawLineCheckCommand(cmd);
  };

  rawMoveZRelToLastHome = (z: number) => {
    if (this.mode !== 'raw') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }

    const cmd = `M137P185Q${z}`;

    if (!this._isLineCheckMode) {
      console.log('raw move z rel to last home:', cmd);

      return this.useWaitAnyResponse(cmd);
    }

    return this.useRawLineCheckCommand(cmd);
  };

  rawStartLineCheckMode = () => {
    if (this.mode !== 'raw') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }

    return new Promise<void>((resolve, reject) => {
      let isCmdResent = false;
      let responseString = '';
      const command = '$@';
      let retryTimes = 0;
      let timeoutTimer: NodeJS.Timeout | undefined;

      this.on(EVENT_COMMAND_MESSAGE, (response) => {
        clearTimeout(timeoutTimer);

        if (response && response.status === 'raw') {
          console.log('raw line check:\t', response.text);
          responseString += response.text;
        }

        const resps = responseString.split(/\r?\n/);
        const i = resps.findIndex((r) => r === 'CTRL LINECHECK_ENABLED' || r === 'ok');

        if (i < 0) {
          responseString = resps[resps.length - 1] || '';
        }

        if (i >= 0) {
          this._isLineCheckMode = true;
          this._lineNumber = 1;
          this.removeCommandListeners();
          resolve();

          return;
        }

        if (
          response.text.includes('ER:RESET') ||
          resps.some((resp) => resp.includes('ER:RESET')) ||
          response.text.includes('error:')
        ) {
          if (retryTimes >= 5) {
            this.removeCommandListeners();
            reject(response);

            return;
          }

          if (!isCmdResent) {
            isCmdResent = true;
            setTimeout(() => {
              isCmdResent = false;
              responseString = '';
              timeoutTimer = this.setTimeoutTimer(reject, 10000);
              this.ws.send(command);
              retryTimes += 1;
            }, 200);
          }
        } else {
          timeoutTimer = this.setTimeoutTimer(reject, 10000);
        }
      });
      this.setDefaultErrorResponse(reject, timeoutTimer);
      this.setDefaultFatalResponse(reject, timeoutTimer);

      timeoutTimer = this.setTimeoutTimer(reject, 10000);
      this.ws.send(command);
    });
  };

  rawEndLineCheckMode = () => {
    if (this.mode !== 'raw') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }

    return new Promise<void>((resolve, reject) => {
      let isCmdResent = false;
      let responseString = '';
      const command = 'M172';
      let retryTimes = 0;
      let timeoutTimer: NodeJS.Timeout | undefined;

      this.on(EVENT_COMMAND_MESSAGE, (response) => {
        clearTimeout(timeoutTimer);

        if (response && response.status === 'raw') {
          console.log('raw end line check:\t', response.text);
          responseString += response.text;
        }

        const resps = responseString.split(/\r?\n/);
        const i = resps.findIndex((r) => r === 'CTRL LINECHECK_DISABLED' || r === 'ok');

        if (i < 0) {
          responseString = resps[resps.length - 1] || '';
        }

        if (i >= 0) {
          this._isLineCheckMode = false;
          this.removeCommandListeners();
          resolve();

          return;
        }

        if (
          response.text.includes('ER:RESET') ||
          resps.some((resp) => resp.includes('ER:RESET')) ||
          response.text.includes('error:')
        ) {
          if (retryTimes >= 5) {
            this.removeCommandListeners();
            reject(response);

            return;
          }

          if (!isCmdResent) {
            isCmdResent = true;
            setTimeout(() => {
              isCmdResent = false;
              responseString = '';
              this.ws.send(command);
              retryTimes += 1;
            }, 200);
          }
        } else {
          timeoutTimer = this.setTimeoutTimer(reject, 10000);
        }
      });
      this.setDefaultErrorResponse(reject, timeoutTimer);
      this.setDefaultFatalResponse(reject, timeoutTimer);
      timeoutTimer = this.setTimeoutTimer(reject, 10000);

      this.ws.send(command);
    });
  };

  rawMove = (args: { a?: number; f?: number; x?: number; y?: number; z?: number }) => {
    if (this.mode !== 'raw') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }

    let command = 'G1';
    const f = args.f || 6000;

    command += `F${f}`;

    if (typeof args.x !== 'undefined') {
      command += `X${Math.round(args.x * 1000) / 1000}`;
    }

    if (typeof args.y !== 'undefined') {
      command += `Y${Math.round(args.y * 1000) / 1000}`;
    }

    if (typeof args.z !== 'undefined') {
      command += `Z${Math.round(args.z * 1000) / 1000}`;
    }

    if (typeof args.a !== 'undefined') {
      command += `A${Math.round(args.a * 1000) / 1000}`;
    }

    if (!this._isLineCheckMode) {
      console.log('raw move command:', command);

      return this.useWaitAnyResponse(command);
    }

    return this.useRawLineCheckCommand(command);
  };

  rawSetWaterPump = (on: boolean, fcodeVersion = 1) => {
    if (this.mode !== 'raw') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }

    let command: string;

    if (fcodeVersion === 2) {
      command = on ? 'M136P1' : 'M136P2';
    } else {
      command = on ? 'B1' : 'B2';
    }

    if (!this._isLineCheckMode) {
      return this.useWaitAnyResponse(command);
    }

    return this.useRawLineCheckCommand(command);
  };

  rawSetAirPump = (on: boolean, fcodeVersion = 1) => {
    if (this.mode !== 'raw') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }

    let command: string;

    if (fcodeVersion === 2) {
      command = on ? 'M136P3' : 'M136P4';
    } else {
      command = on ? 'B3' : 'B4';
    }

    if (!this._isLineCheckMode) {
      return this.useWaitAnyResponse(command);
    }

    return this.useRawLineCheckCommand(command);
  };

  rawSetFan = (on: boolean, fcodeVersion = 1) => {
    if (this.mode !== 'raw') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }

    let command: string;

    if (fcodeVersion === 2) {
      command = on ? 'M136P5' : 'M136P6';
    } else {
      command = on ? 'B5' : 'B6';
    }

    if (!this._isLineCheckMode) {
      return this.useWaitAnyResponse(command);
    }

    return this.useRawLineCheckCommand(command);
  };

  rawSetRotary = (on: boolean, fcodeVersion = 1) => {
    if (this.mode !== 'raw') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }

    let command: string;

    if (fcodeVersion === 2) {
      command = on ? 'M137P35' : 'M137P36';
    } else {
      command = on ? 'R1' : 'R0';
    }

    if (!this._isLineCheckMode || fcodeVersion === 1) {
      return this.useWaitAnyResponse(command);
    }

    return this.useRawLineCheckCommand(command);
  };

  rawLooseMotorOld = async () => {
    if (this.mode !== 'raw') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }

    await this.useWaitAnyResponse('$1=0');

    const command = 'B12';

    if (!this._isLineCheckMode) {
      await this.useWaitAnyResponse(command);
    } else {
      await this.useRawLineCheckCommand(command);
    }

    await new Promise((resolve) => setTimeout(resolve, 200));

    const res = await this.useWaitAnyResponse('$1=255');

    return res;
  };

  rawLooseMotor = (fcodeVersion = 1) => {
    if (this.mode !== 'raw') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }

    const command = fcodeVersion === 1 ? 'B34' : 'M137P34';

    if (!this._isLineCheckMode) {
      return this.useWaitAnyResponse(command);
    }

    return this.useRawLineCheckCommand(command);
  };

  rawSetLaser = (args: { on: boolean; s?: number }) => {
    if (this.mode !== 'raw') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }

    let command = args.on ? 'M3' : 'M5';

    if (typeof args.s !== 'undefined') {
      command += `S${args.s}`;
    }

    if (!this._isLineCheckMode) {
      return this.useRawWaitOKResponse(command);
    }

    return this.useRawLineCheckCommand(command);
  };

  rawSetRedLight = (on: boolean) => {
    if (this.mode !== 'raw') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }

    const command = on ? 'M136P196' : 'M136P197';

    if (!this._isLineCheckMode) {
      return this.useRawWaitOKResponse(command);
    }

    return this.useRawLineCheckCommand(command);
  };

  rawSetOrigin = (fcodeVersion = 1) => {
    if (this.mode !== 'raw') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }

    const command = fcodeVersion === 1 ? 'B47' : 'M137P186';

    if (!this._isLineCheckMode) {
      return this.useRawWaitOKResponse(command);
    }

    return this.useRawLineCheckCommand(command);
  };

  rawSet24V = (on: boolean) => {
    if (this.mode !== 'raw') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }

    const command = on ? 'M136P173' : 'M136P174';

    if (!this._isLineCheckMode) {
      return this.useRawWaitOKResponse(command);
    }

    return this.useRawLineCheckCommand(command);
  };

  rawAutoFocus = (version: 1 | 2, timeout = 20000): Promise<void> => {
    if (this.mode !== 'raw') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }

    return new Promise((resolve, reject) => {
      let responseString = '';
      // Version 1 uses B206, Version 2 uses M137P179Q1
      // Version 1 only supported by HEXA after 4.3.12
      // Version 2 supported by Ador and Beambox II
      const command = version === 2 ? 'M137P179Q1' : 'B206';

      console.log('raw auto focus command:', command);

      let timeoutTimer: NodeJS.Timeout | undefined;

      this.on(EVENT_COMMAND_MESSAGE, (response) => {
        if (timeoutTimer) clearTimeout(timeoutTimer);

        if (response?.status === 'raw') {
          console.log('raw auto focus:\t', response.text);
          responseString += response.text;
        }

        const responseSplit = responseString.split(/\r?\n/);

        if (responseSplit.findIndex((r) => r === 'ok') >= 0) {
          resolve();

          return;
        }

        responseString = responseSplit.at(-1) || '';

        if (
          response.text.includes('ER:RESET') ||
          responseSplit.some((resp) => resp.includes('ER:RESET')) ||
          response.text.includes('error:')
        ) {
          this.removeCommandListeners();
          reject(response);
        } else {
          timeoutTimer = this.setTimeoutTimer(reject, timeout);
        }
      });

      this.setDefaultErrorResponse(reject, timeoutTimer);
      this.setDefaultFatalResponse(reject, timeoutTimer);
      timeoutTimer = this.setTimeoutTimer(reject, timeout);
      this.ws?.send(command);
    });
  };

  /**
   * Send raw command, wait for ok and parse responses with regex
   */
  rawRegexCommand = <T>(
    command: string,
    regex: RegExp,
    handler: (match: RegExpMatchArray) => T,
    { silent = true }: { silent?: boolean } = {},
  ): Promise<T> => {
    if (this.mode !== 'raw') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }

    return new Promise((resolve, reject) => {
      let isCmdResent = false;
      let responseString = '';
      let retryTimes = 0;
      let timeoutTimer: NodeJS.Timeout | undefined;

      this.on(EVENT_COMMAND_MESSAGE, (response) => {
        clearTimeout(timeoutTimer);

        if (response && response.status === 'raw') {
          if (!silent) console.log(`raw ${command}:\t`, response.text);

          responseString += response.text;
        }

        const resps = responseString.split(/\r?\n/);
        const i = resps.findIndex((r) => r === 'ok');

        if (i >= 0) {
          const resIdx = resps.findIndex((r) => r.match(regex));

          if (resIdx >= 0) {
            const resStr = resps[resIdx];
            const match = resStr.match(regex)!;

            this.removeCommandListeners();

            resolve(handler(match));
          } else {
            this.removeCommandListeners();
            reject(response);
          }

          return;
        }

        if (
          response.text.includes('ER:RESET') ||
          resps.some((resp) => resp.includes('ER:RESET')) ||
          response.text.includes('error:')
        ) {
          if (retryTimes >= 5) {
            this.removeCommandListeners();
            reject(response);

            return;
          }

          if (!isCmdResent) {
            isCmdResent = true;
            setTimeout(() => {
              isCmdResent = false;
              responseString = '';
              this.ws.send(command);
              retryTimes += 1;
            }, 200);
          }
        } else {
          timeoutTimer = this.setTimeoutTimer(reject, 10000);
        }
      });
      this.setDefaultErrorResponse(reject, timeoutTimer);
      this.setDefaultFatalResponse(reject, timeoutTimer);
      timeoutTimer = this.setTimeoutTimer(reject, 10000);

      this.ws.send(command);
    });
  };

  rawGetProbePos = (): Promise<{ a: number; didAf: boolean; x: number; y: number; z: number }> => {
    if (this.mode !== 'raw') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }

    return this.rawRegexCommand('M136P254', /\[PRB:([-\d.]+),([-\d.]+),([-\d.]+),([-\d.]+):(\d)\]/, (match) => {
      const [, x, y, z, a, didAf] = match;

      return { a: Number(a), didAf: didAf === '1', x: Number(x), y: Number(y), z: Number(z) };
    });
  };

  rawGetLastPos = (): Promise<{ a: number; x: number; y: number; z: number }> => {
    if (this.mode !== 'raw') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }

    return this.rawRegexCommand('M136P255', /\[LAST_POS:([-\d.]+),([-\d.]+),([-\d.]+),([-\d.]+)/, (match) => {
      const [, x, y, z, a] = match;

      return { a: Number(a), x: Number(x), y: Number(y), z: Number(z) };
    });
  };

  rawGetStatePos = (): Promise<{ a: number; x: number; y: number; z: number }> => {
    if (this.mode !== 'raw') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }

    return this.rawRegexCommand('?', /[MW]Pos:([-\d.]+),([-\d.]+),([-\d.]+),([-\d.]+)\|/, (match) => {
      const [, x, y, z, a] = match;

      return { a: Number(a), x: Number(x), y: Number(y), z: Number(z) };
    });
  };

  rawGetDoorOpen = (): Promise<{
    backCover: number;
    bottomCover: number;
    interlock: number;
    remoteInterlock: number;
  }> => {
    if (this.mode !== 'raw') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }

    return this.rawRegexCommand(
      'M136P179',
      /Interlock: (\d+), Bottom cover: (\d+), Back cover: (\d+), Remote interlock: (\d+)/i,
      (match) => {
        const [, interlock, bottomCover, backCover, remoteInterlock] = match!;

        return {
          backCover: Number(backCover),
          bottomCover: Number(bottomCover),
          interlock: Number(interlock),
          remoteInterlock: Number(remoteInterlock),
        };
      },
    );
  };

  // Hexa
  rawMeasureHeight = (baseZ: number | undefined, timeout = 120000): Promise<number> => {
    if (this.mode !== 'raw') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }

    return new Promise<number>((resolve, reject) => {
      let responseString = '';
      const command = typeof baseZ === 'number' ? `B45Z${baseZ}` : 'B45';
      let timeoutTimer: NodeJS.Timeout | undefined;
      let retryTimes = 0;
      let isCmdResent = false;

      const sendCommand = async (firstTime = false) => {
        const handleMessage = (response: string, fromLineCheckMode = false) => {
          clearTimeout(timeoutTimer);
          responseString += response;

          const resps = responseString.split(/\r?\n/);

          console.log(resps);

          const finished = resps.includes('ok');

          if (finished || fromLineCheckMode) {
            const resIdx = resps.findIndex((r) => r.match(/z_pos/));

            if (resIdx >= 0) {
              this.removeCommandListeners();

              const resStr = resps[resIdx];
              const data = JSON.parse(resStr) as any;
              const { z_pos: zPos } = data;

              resolve(Number(zPos));
            } else {
              this.removeCommandListeners();
              reject(response);
            }

            return;
          }

          if (responseString.includes('error:')) {
            const match = responseString.match(/error:(d+)/);
            const errorCode = match ? Number(match[1]) : 0;

            console.log('Error Code', errorCode);

            // TODO: handle error code
            if (retryTimes >= 5) {
              this.removeCommandListeners();
              reject(response);

              return;
            }

            if (!isCmdResent) {
              isCmdResent = true;
              setTimeout(() => {
                isCmdResent = false;
                responseString = '';
                retryTimes += 1;
                sendCommand();
              }, 1000);
            }
          } else {
            timeoutTimer = this.setTimeoutTimer(reject, timeout);
          }
        };

        if (!this._isLineCheckMode) {
          if (firstTime) {
            this.on(EVENT_COMMAND_MESSAGE, (response) => {
              if (response && response.status === 'raw') {
                responseString += response.text;
              }

              handleMessage(responseString);
            });
          }

          this.ws.send(command);
        } else {
          const resp = await this.useRawLineCheckCommand(command);

          handleMessage(resp, true);
        }
      };

      this.setDefaultErrorResponse(reject, timeoutTimer);
      this.setDefaultFatalResponse(reject, timeoutTimer);
      timeoutTimer = this.setTimeoutTimer(reject, timeout);

      sendCommand(true);
    });
  };

  updateFirmware = (file: File, type: FirmwareType) =>
    new Promise((resolve, reject) => {
      const blob = new Blob([file], { type: 'binary/flux-firmware' });

      this.on(EVENT_COMMAND_MESSAGE, (response) => {
        if (response.status === 'ok') {
          this.removeCommandListeners();
          resolve(response);
        } else if (response.status === 'continue') {
          this.emit(EVENT_COMMAND_PROGRESS, response);
          this.ws.send(blob);
        } else if (response.status === 'uploading') {
          response.percentage = ((response.sent || 0) / blob.size) * 100;
          this.emit(EVENT_COMMAND_PROGRESS, response);
        } else {
          this.removeCommandListeners();
          reject(response);
        }
      });

      this.setDefaultErrorResponse(reject);
      this.setDefaultFatalResponse(reject);

      const command = match(type)
        .with('firmware', () => 'update_fw')
        .with('mainboard', () => 'update_mbfw')
        .with('headboard', () => 'update_hbfw')
        .exhaustive();

      this.ws.send(`${command} binary/flux-firmware ${blob.size}`);
    });

  uploadFisheyeParams = (data: string) =>
    new Promise<{ status: string }>((resolve, reject) => {
      const blob = new Blob([data], { type: 'application/json' });

      this.on(EVENT_COMMAND_MESSAGE, (response) => {
        if (response.status === 'ok') {
          this.removeCommandListeners();
          resolve(response);
        } else if (response.status === 'continue') {
          this.emit(EVENT_COMMAND_PROGRESS, response);
          this.ws.send(blob);
        } else if (response.status === 'uploading') {
          response.percentage = ((response.sent || 0) / blob.size) * 100;
          this.emit(EVENT_COMMAND_PROGRESS, response);
        } else {
          this.removeCommandListeners();
          reject(response);
        }
      });

      this.setDefaultErrorResponse(reject);
      this.setDefaultFatalResponse(reject);

      this.ws.send(`update_fisheye_params application/json ${blob.size}`);
    });

  updateFisheye3DRotation = (data: RotationParameters3D) =>
    new Promise<{ status: string }>((resolve, reject) => {
      const strData = JSON.stringify(data, (key, val) => {
        if (typeof val === 'number') {
          return Math.round(val * 1e2) / 1e2;
        }

        return val;
      });
      const blob = new Blob([strData], { type: 'application/json' });

      this.on(EVENT_COMMAND_MESSAGE, (response) => {
        if (response.status === 'ok') {
          this.removeCommandListeners();
          resolve(response);
        } else if (response.status === 'continue') {
          this.emit(EVENT_COMMAND_PROGRESS, response);
          this.ws.send(blob);
        } else if (response.status === 'uploading') {
          response.percentage = ((response.sent || 0) / blob.size) * 100;
          this.emit(EVENT_COMMAND_PROGRESS, response);
        } else {
          this.removeCommandListeners();
          reject(response);
        }
      });

      this.setDefaultErrorResponse(reject);
      this.setDefaultFatalResponse(reject);

      this.ws.send(`update_fisheye_3d_rotation application/json ${blob.size}`);
    });

  checkButton = async () => ({ pressed: false });
}

export default Control;
