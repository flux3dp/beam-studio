/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import EventEmitter from 'eventemitter3';

import ErrorConstants from 'app/constants/error-constants';
import IControlSocket, { Mode } from 'interfaces/IControlSocket';
import { Field, LensCorrection } from 'interfaces/Promark';
import { IDeviceDetailInfo } from 'interfaces/IDevice';

import { getDeviceClient, SwiftrayClient } from './swiftray-client';

const EVENT_COMMAND_MESSAGE = 'command-message';
const EVENT_COMMAND_ERROR = 'command-error';
const EVENT_COMMAND_FATAL = 'command-fatal';
const EVENT_COMMAND_PROGRESS = 'command-progress';

const MAX_TASK_QUEUE = 30;

class SwiftrayControl extends EventEmitter implements IControlSocket {
  public isConnected = false;

  private taskQueue: {
    taskFunction: Function;
    args: any[];
    resolve: Function;
    reject: Function;
  }[] = [];

  private currentTask: {
    taskFunction: Function;
    args: any[];
    resolve: Function;
    reject: Function;
  } | null = null;

  private isProcessingTask = false;

  private sc: SwiftrayClient;

  private mode: Mode = ''; // null, maintain or raw

  private _lineNumber = 0;

  private _isLineCheckMode = false;

  protected port: string;

  constructor(port: string) {
    super();
    this.port = port;
    this.on('error', (error) => {
      console.log(`SwiftrayControl ${this.port} Socket Error:`, error);
    });
  }

  get connection() {
    return this.sc;
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

  addTask<T>(taskFunction: (...args) => T, ...args: any[]) {
    if (this.taskQueue.length > MAX_TASK_QUEUE) {
      console.error(
        `SwiftrayControl ${this.port} task queue exceeds max queue length. Clear queue and then sendGCode task`
      );
      this.taskQueue = [];
      this.currentTask = null;
      this.isProcessingTask = false;
    }

    const promise = new Promise<T>((resolve, reject) => {
      this.taskQueue.push({ taskFunction, args, resolve, reject });
      if (!this.isProcessingTask && !this.currentTask) {
        this.doTask();
      }
    });
    return promise;
  }

  async doTask() {
    this.currentTask = this.taskQueue.shift();
    const { taskFunction, args, resolve, reject } = this.currentTask;

    try {
      const res = await taskFunction(...args);
      resolve(res);
    } catch (error) {
      reject(error);
      console.error(`SwiftrayControl ${this.port} task error:`, error, taskFunction?.name, args);
    }
    if (this.taskQueue.length > 0) {
      this.doTask();
    } else {
      this.currentTask = null;
      this.isProcessingTask = false;
    }
  }

  async connect() {
    console.log(`SwiftrayControl ${this.port} connecting to Swiftray server`);
    this.sc = await getDeviceClient(this.port);
  }

  killSelf = async () => {
    console.warn(
      'SwiftrayControl.killSelf is not implemented in swiftray, or should not be implemented'
    );
    // this.sc.close();
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
    const timeoutTimer = setTimeout(() => {
      this.removeCommandListeners();
      reject({
        status: 'error',
        text: 'TIMEOUT',
        error: 'TIMEOUT',
      });
    }, timeout);
    return timeoutTimer;
  }

  setDefaultErrorResponse(reject: Function, timeoutTimer?: NodeJS.Timeout) {
    this.on(EVENT_COMMAND_ERROR, (response) => {
      if (timeoutTimer) clearTimeout(timeoutTimer);
      this.removeCommandListeners();
      reject(response);
    });
  }

  setDefaultFatalResponse(reject: Function, timeoutTimer?: NodeJS.Timeout) {
    this.on(EVENT_COMMAND_FATAL, (response) => {
      if (timeoutTimer) clearTimeout(timeoutTimer);
      this.removeCommandListeners();
      reject(response);
    });
  }

  useWaitAnyResponse(command: string, timeout = 30000) {
    // Resolve after any response, equals to useDefaultResponse in old SwiftrayControl
    return new Promise<any>((resolve, reject) => {
      const timeoutTimer = this.setTimeoutTimer(reject, timeout);
      this.on(EVENT_COMMAND_MESSAGE, (response) => {
        clearTimeout(timeoutTimer);
        this.removeCommandListeners();
        resolve(response);
      });
      this.setDefaultErrorResponse(reject, timeoutTimer);
      this.setDefaultFatalResponse(reject, timeoutTimer);
      this.sc.sendGCode(command);
    });
  }

  useRawWaitOKResponse(command: string, timeout = 30000) {
    // Resolve after get ok from raw response
    return new Promise<any>((resolve, reject) => {
      const timeoutTimer = this.setTimeoutTimer(reject, timeout);
      let responseString = '';
      this.on(EVENT_COMMAND_MESSAGE, (response) => {
        if (response && response.status === 'raw') responseString += response.text;
        const responses = responseString.split(/\r?\n/);
        if (responses.some((r) => r === 'ok')) {
          clearTimeout(timeoutTimer);
          this.removeCommandListeners();
          resolve(responseString);
        }
      });
      this.setDefaultErrorResponse(reject, timeoutTimer);
      this.setDefaultFatalResponse(reject, timeoutTimer);
      this.sc.sendGCode(command);
    });
  }

  useRawLineCheckCommand(command: string, timeout = 30000) {
    return new Promise<string>((resolve, reject) => {
      let timeoutTimer = this.setTimeoutTimer(reject, timeout);
      let responseString = '';
      this.on(EVENT_COMMAND_MESSAGE, (response) => {
        if (timeoutTimer) clearTimeout(timeoutTimer);
        if (response && response.status === 'raw') {
          console.log(response.text);
          responseString += response.text;
          let responseStrings = responseString.split(/\r?\n/);
          responseStrings = responseStrings.filter(
            (s, i) => !s.startsWith('DEBUG:') || i === responseStrings.length - 1
          );
          const isCommandCompleted = responseStrings.some(
            (s) => s.startsWith(`LN${this._lineNumber} 0`) || s.startsWith(`L${this._lineNumber} 0`)
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
            this.sc.sendGCode(cmd);
          } else if (hasError) {
            const cmd = this.buildLineCheckCommand(command);
            timeoutTimer = this.setTimeoutTimer(reject, timeout);
            this.sc.sendGCode(cmd);
          }
        }
        if (response.text.indexOf('ER:RESET') >= 0) {
          this.removeCommandListeners();
          reject(response);
        } else if (response.text.indexOf('error:') >= 0) {
          this.removeCommandListeners();
          reject(response);
        }
      });
      this.setDefaultErrorResponse(reject, timeoutTimer);
      this.setDefaultFatalResponse(reject, timeoutTimer);

      const cmd = this.buildLineCheckCommand(command);
      console.log(cmd);
      this.sc.sendGCode(cmd);
    });
  }

  buildLineCheckCommand(command: string) {
    const newCommand = `N${this._lineNumber}${command}`;
    let crc = 0;
    for (let i = 0; i < newCommand.length; i += 1) {
      if (newCommand[i] !== ' ') {
        const charCode = newCommand.charCodeAt(i);
        // eslint-disable-next-line no-bitwise
        crc ^= charCode;
        crc += charCode;
      }
    }
    crc %= 65536;
    return `${newCommand}*${crc}`;
  }

  ls = async (path: string) => {
    console.warn('SwiftrayControl.ls is not implemented in swiftray', path);
    return {
      files: [],
      directories: [],
    };
  };

  lsusb = async () => {
    console.warn('SwiftrayControl.lsusb is not implemented in swiftray');
    return { usbs: [] };
  };

  fileInfo = async (path: string, fileName: string) => {
    console.warn('SwiftrayControl.fileInfo is not implemented in swiftray', path, fileName);
    const data = [fileName];
    return [fileName, ...data];
  };

  report = async () => {
    console.warn('SwiftrayControl.report is not implemented well in swiftray');
    return { device_status: await this.sc.getDeviceStatus() };
  };

  upload = async (data: any, path?: string, fileName?: string): Promise<void> => {
    console.log('SwiftrayControl.upload');
    if (path && fileName) {
      // eslint-disable-next-line no-param-reassign
      fileName = fileName.replace(/ /g, '_');
      const ext = fileName.split('.').at(-1);
      await this.sc.upload(data, `${path}/${fileName}`);
    } else {
      await this.sc.upload(data);
    }
    console.log('SwiftrayControl.upload done');
  };

  abort = () => this.sc.stopTask();

  quit = async () => {
    console.warn('SwiftrayControl.quit is not implemented in swiftray');
    return this.sc.quitTask();
  };

  start = async () => {
    console.log('SwiftrayControl.start');
    return this.sc.startTask();
  };

  pause = async () => this.sc.pauseTask();

  resume = async () => this.sc.resumeTask();

  restart = async () => this.sc.startTask();

  kick = async () => this.sc.kick();

  quitTask = async () => {
    this.mode = '';
    return this.sc.endMode();
  };

  deviceDetailInfo = async (): Promise<IDeviceDetailInfo> => {
    console.warn('SwiftrayControl.deviceDetailInfo is not implemented well in swiftray');
    return this.sc.deviceInfo();
  };

  getPreview = async () => {
    console.warn('SwiftrayControl.getPreview is not implemented well in swiftray');
    return [{}, await this.sc.getPreview()];
  };

  startFraming = async (points?: [number, number][]) => {
    console.log('SwiftrayControl.startFraming');
    return this.sc.startFraming(points);
  };

  stopFraming = async () => {
    console.log('SwiftrayControl.stopFraming');
    return this.sc.stopFraming();
  };

  select = async (path, fileName: string) => {
    console.error('SwiftrayControl.select is not implemented in swiftray');
    return { status: 'OK' };
  };

  deleteFile = (fileNameWithPath: string) =>
    this.useWaitAnyResponse(`file rmfile ${fileNameWithPath}`);

  downloadFile = async (fileNameWithPath: string) => {
    const file = await this.sc.downloadFile(fileNameWithPath);
    return [fileNameWithPath, file] as [string, Blob];
  };

  downloadLog = async (logName: string) => {
    const file = await this.sc.downloadLog(logName);
    return [logName, file];
  };

  fetchAutoLevelingData = (dataType: 'hexa_platform' | 'bottom_cover' | 'offset') =>
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
              const jsonString = e.target.result as string;
              const data = JSON.parse(jsonString);
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

      this.sc.sendGCode(`fetch_auto_leveling_data ${dataType}`);
    });

  getLaserPower = async () => this.sc.getDeviceParam('laser_power');

  setLaserPower = async (power: number) => this.sc.setDeviceParam('laser_power', power);

  setLaserPowerTemp = async (power: number) => this.sc.setDeviceParam('laser_power_temp', power);

  getLaserSpeed = async () => this.sc.getDeviceParam('laser_speed');

  setLaserSpeed = async (speed: number) => this.sc.setDeviceParam('laser_speed', speed);

  setLaserSpeedTemp = async (speed: number) => this.sc.setDeviceParam('laser_speed_temp', speed);

  getFan = async () => this.sc.getDeviceParam('fan');

  setFan = async (fanSpeed: number) => this.sc.setDeviceParam('fan', fanSpeed);

  setFanTemp = async (fanSpeed: number) => this.sc.setDeviceParam('fan_temp', fanSpeed);

  setOriginX = async (x: number) => this.sc.setDeviceParam('origin_x', x);

  setOriginY = async (y: number) => this.sc.setDeviceParam('origin_y', y);

  setField = async (worksize: number, fieldData: Field) => {
    const data = {
      worksize,
      xOffset: fieldData.offsetX,
      yOffset: fieldData.offsetY,
      angle: fieldData.angle,
    };
    return this.sc.setScanaheadParams(data);
  };

  setLensCorrection = async (x: LensCorrection, y: LensCorrection) => {
    const data = {
      scaleX: x.scale,
      scaleY: y.scale,
      bucketX: x.bulge,
      bucketY: y.bulge,
      paralleX: x.skew,
      paralleY: y.skew,
      trapeX: x.trapezoid,
      trapeY: y.trapezoid,
    };
    return this.sc.setDeviceCorrection(data);
  };

  getDoorOpen = async () => this.sc.getDeviceParam<string>('door_open');

  getDeviceSetting = async (name: string) => this.sc.getDeviceParam<string>(name);

  setDeviceSetting = async (name: string, value: string) => this.sc.setDeviceParam(name, value);

  deleteDeviceSetting = async (name: string) => this.sc.deleteDeviceSettings(name);

  enterRawMode = async () => {
    const res = await this.sc.switchMode('raw');
    await new Promise((resolve) => setTimeout(resolve, 3000));
    this.mode = 'raw';
    return res;
  };

  endRawMode = async (): Promise<void> => {
    this.mode = '';
    await this.sc.endMode();
  };

  rawHome = (zAxis = false) => {
    if (this.mode !== 'raw') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }
    return new Promise<void>((resolve, reject) => {
      let didErrorOccur = false;
      let isCmdResent = false;
      let responseString = '';
      let retryTimes = 0;
      let timeoutTimer: null | NodeJS.Timeout;
      this.on(EVENT_COMMAND_MESSAGE, (response) => {
        clearTimeout(timeoutTimer);
        if (response && response.status === 'raw') {
          responseString += response.text;
          console.log('raw homing:\t', responseString);
        }
        const responses = responseString.split(/\r?\n/);
        if (responses.some((r) => r.includes('ok')) && !didErrorOccur) {
          this.removeCommandListeners();
          resolve();
          return;
        }
        if (
          response.text?.indexOf('ER:RESET') >= 0 ||
          response.text?.indexOf('DEBUG: RESET') >= 0 ||
          response.text?.indexOf('error:') >= 0 ||
          responses.some((r) => r.includes('ER:RESET')) ||
          responses.some((r) => r.includes('DEBUG: RESET')) ||
          responses.some((r) => r.includes('error:'))
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
              this.sc.sendGCode('raw home');
            }, 1000);
          }
        } else {
          timeoutTimer = this.setTimeoutTimer(reject, 10000);
        }
        responseString = responses[responses.length - 1] || '';
      });
      this.setDefaultErrorResponse(reject, timeoutTimer);
      this.setDefaultFatalResponse(reject, timeoutTimer);

      timeoutTimer = this.setTimeoutTimer(reject, 10000);
      if (!zAxis) this.sc.sendGCode('raw home');
      else this.sc.sendGCode('$HZ');
    });
  };

  rawUnlock(): Promise<void> {
    if (this.mode !== 'raw') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }
    return this.useRawWaitOKResponse('$X');
  }

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

  rawStartLineCheckMode = (): Promise<void> => {
    if (this.mode !== 'raw') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }
    return new Promise((resolve, reject) => {
      let isCmdResent = false;
      let responseString = '';
      const command = '$@';
      let retryTimes = 0;
      let timeoutTimer: null | NodeJS.Timeout;
      this.on(EVENT_COMMAND_MESSAGE, (response) => {
        clearTimeout(timeoutTimer);
        if (response && response.status === 'raw') {
          console.log('raw line check:\t', response.text);
          responseString += response.text;
        }
        const responses = responseString.split(/\r?\n/);
        const i = responses.findIndex((r) => r === 'CTRL LINECHECK_ENABLED' || r === 'ok');
        if (i < 0) responseString = responses[responses.length - 1] || '';
        if (i >= 0) {
          this._isLineCheckMode = true;
          this._lineNumber = 1;
          this.removeCommandListeners();
          resolve(null);
          return;
        }
        if (
          response.text.indexOf('ER:RESET') >= 0 ||
          responses.some((resp) => resp.includes('ER:RESET')) ||
          response.text.indexOf('error:') >= 0
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
              this.sc.sendGCode(command);
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
      this.sc.sendGCode(command);
    });
  };

  rawEndLineCheckMode = (): Promise<void> => {
    if (this.mode !== 'raw') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }
    return new Promise((resolve, reject) => {
      let isCmdResent = false;
      let responseString = '';
      const command = 'M172';
      let retryTimes = 0;
      let timeoutTimer: null | NodeJS.Timeout;
      this.on(EVENT_COMMAND_MESSAGE, (response) => {
        clearTimeout(timeoutTimer);
        if (response && response.status === 'raw') {
          console.log('raw end line check:\t', response.text);
          responseString += response.text;
        }
        const responses = responseString.split(/\r?\n/);
        const i = responses.findIndex((r) => r === 'CTRL LINECHECK_DISABLED' || r === 'ok');
        if (i < 0) responseString = responses[responses.length - 1] || '';
        if (i >= 0) {
          this._isLineCheckMode = false;
          this.removeCommandListeners();
          resolve(null);
          return;
        }
        if (
          response.text.indexOf('ER:RESET') >= 0 ||
          responses.some((resp) => resp.includes('ER:RESET')) ||
          response.text.indexOf('error:') >= 0
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
              this.sc.sendGCode(command);
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

      this.sc.sendGCode(command);
    });
  };

  rawMove = (args: { x?: number; y?: number; z?: number; f?: number }) => {
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
    if (fcodeVersion === 2) command = on ? 'M136P1' : 'M136P2';
    else command = on ? 'B1' : 'B2';
    if (!this._isLineCheckMode) return this.useWaitAnyResponse(command);
    return this.useRawLineCheckCommand(command);
  };

  rawSetAirPump = (on: boolean, fcodeVersion = 1) => {
    if (this.mode !== 'raw') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }
    let command: string;
    if (fcodeVersion === 2) command = on ? 'M136P3' : 'M136P4';
    else command = on ? 'B3' : 'B4';
    if (!this._isLineCheckMode) return this.useWaitAnyResponse(command);
    return this.useRawLineCheckCommand(command);
  };

  rawSetFan = (on: boolean, fcodeVersion = 1) => {
    if (this.mode !== 'raw') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }
    let command: string;
    if (fcodeVersion === 2) command = on ? 'M136P5' : 'M136P6';
    else command = on ? 'B5' : 'B6';
    if (!this._isLineCheckMode) return this.useWaitAnyResponse(command);
    return this.useRawLineCheckCommand(command);
  };

  rawSetRotary = (on: boolean, fcodeVersion = 1) => {
    if (this.mode !== 'raw') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }
    let command: string;
    if (fcodeVersion === 2) command = on ? 'M137P35' : 'M137P36';
    else command = on ? 'R1' : 'R0';
    if (!this._isLineCheckMode || fcodeVersion === 1) return this.useWaitAnyResponse(command);
    return this.useRawLineCheckCommand(command);
  };

  rawLooseMotor = (fcodeVersion = 1) => {
    if (this.mode !== 'raw') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }
    const command = fcodeVersion === 1 ? 'B34' : 'M137P34';
    if (!this._isLineCheckMode) return this.useWaitAnyResponse(command);
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

  rawSetLaser = (args: { on: boolean; s?: number }) => {
    if (this.mode !== 'raw') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }
    let command = args.on ? 'M3' : 'M5';
    if (typeof args.s !== 'undefined') {
      command += `S${args.s}`;
    }
    if (!this._isLineCheckMode) return this.useRawWaitOKResponse(command);
    return this.useRawLineCheckCommand(command);
  };

  rawSetRedLight = (on: boolean) => {
    if (this.mode !== 'raw') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }
    const command = on ? 'M136P196' : 'M136P197';
    if (!this._isLineCheckMode) return this.useRawWaitOKResponse(command);
    return this.useRawLineCheckCommand(command);
  };

  rawSetOrigin = (fcodeVersion = 1) => {
    if (this.mode !== 'raw') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }
    const command = fcodeVersion === 1 ? 'B47' : 'M137P186';
    if (!this._isLineCheckMode) return this.useRawWaitOKResponse(command);
    return this.useRawLineCheckCommand(command);
  };

  rawSet24V = (on: boolean) => {
    if (this.mode !== 'raw') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }
    const command = on ? 'M136P173' : 'M136P174';
    if (!this._isLineCheckMode) return this.useRawWaitOKResponse(command);
    return this.useRawLineCheckCommand(command);
  };

  rawAutoFocus = (timeout = 20000): Promise<void> => {
    if (this.mode !== 'raw') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }
    return new Promise((resolve, reject) => {
      let responseString = '';
      const command = 'M137P179Q1';
      let timeoutTimer: null | NodeJS.Timeout;
      this.on(EVENT_COMMAND_MESSAGE, (response) => {
        clearTimeout(timeoutTimer);
        if (response && response.status === 'raw') {
          console.log('raw auto focus:\t', response.text);
          responseString += response.text;
        }
        const responses = responseString.split(/\r?\n/);
        const i = responses.findIndex((r) => r === 'ok');
        if (i < 0) responseString = responses[responses.length - 1] || '';
        if (i >= 0) {
          resolve();
          return;
        }
        if (
          response.text.indexOf('ER:RESET') >= 0 ||
          responses.some((resp) => resp.includes('ER:RESET')) ||
          response.text.indexOf('error:') >= 0
        ) {
          this.removeCommandListeners();
          reject(response);
        } else timeoutTimer = this.setTimeoutTimer(reject, timeout);
      });
      this.setDefaultErrorResponse(reject, timeoutTimer);
      this.setDefaultFatalResponse(reject, timeoutTimer);
      timeoutTimer = this.setTimeoutTimer(reject, timeout);
      this.sc.sendGCode(command);
    });
  };

  rawGetProbePos = (): Promise<{ x: number; y: number; z: number; a: number; didAf: boolean }> => {
    if (this.mode !== 'raw') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }
    return new Promise((resolve, reject) => {
      let isCmdResent = false;
      let responseString = '';
      const command = 'M136P254';
      let retryTimes = 0;
      let timeoutTimer: null | NodeJS.Timeout;
      this.on(EVENT_COMMAND_MESSAGE, (response) => {
        clearTimeout(timeoutTimer);
        if (response && response.status === 'raw') {
          console.log('raw get probe position:\t', response.text);
          responseString += response.text;
        }
        const responses = responseString.split(/\r?\n/);
        const i = responses.findIndex((r) => r === 'ok');
        if (i >= 0) {
          const resIdx = responses.findIndex((r) =>
            r.match(/\[PRB:([-\d.]+),([-\d.]+),([-\d.]+),([-\d.]+):(\d)\]/)
          );
          if (resIdx >= 0) {
            const resStr = responses[resIdx];
            const match = resStr.match(/\[PRB:([-\d.]+),([-\d.]+),([-\d.]+),([-\d.]+):(\d)\]/);
            const [, x, y, z, a, didAf] = match;
            this.removeCommandListeners();
            resolve({
              x: Number(x),
              y: Number(y),
              z: Number(z),
              a: Number(a),
              didAf: didAf === '1',
            });
          } else {
            this.removeCommandListeners();
            reject(response);
          }
          return;
        }
        if (
          response.text.indexOf('ER:RESET') >= 0 ||
          responses.some((resp) => resp.includes('ER:RESET')) ||
          response.text.indexOf('error:') >= 0
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
              this.sc.sendGCode(command);
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

      this.sc.sendGCode(command);
    });
  };

  rawGetLastPos = (): Promise<{ x: number; y: number; z: number; a: number }> => {
    if (this.mode !== 'raw') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }
    return new Promise((resolve, reject) => {
      let responseString = '';
      const command = 'M136P255';
      let retryTimes = 0;
      let isCmdResent = false;
      let timeoutTimer: null | NodeJS.Timeout;
      this.on(EVENT_COMMAND_MESSAGE, (response) => {
        clearTimeout(timeoutTimer);
        if (response && response.status === 'raw') {
          console.log('raw get last position:\t', response.text);
          responseString += response.text;
        }
        const responses = responseString.split(/\r?\n/);
        const i = responses.findIndex((r) => r === 'ok');
        if (i < 0) responseString = responses[responses.length - 1] || '';
        if (i >= 0) {
          const resIdx = responses.findIndex((r) =>
            r.match(/\[LAST_POS:([-\d.]+),([-\d.]+),([-\d.]+),([-\d.]+)/)
          );
          if (resIdx >= 0) {
            const resStr = responses[resIdx];
            const match = resStr.match(/\[LAST_POS:([-\d.]+),([-\d.]+),([-\d.]+),([-\d.]+)/);
            const [, x, y, z, a] = match;
            this.removeCommandListeners();
            resolve({ x: Number(x), y: Number(y), z: Number(z), a: Number(a) });
          } else {
            this.removeCommandListeners();
            reject(response);
          }
          return;
        }
        if (
          response.text.indexOf('ER:RESET') >= 0 ||
          responses.some((resp) => resp.includes('ER:RESET')) ||
          response.text.indexOf('error:') >= 0
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
              this.sc.sendGCode(command);
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

      this.sc.sendGCode(command);
    });
  };

  // Hexa
  rawMeasureHeight = (baseZ: number | undefined, timeout = 120000): Promise<number> => {
    if (this.mode !== 'raw') {
      throw new Error(ErrorConstants.CONTROL_SOCKET_MODE_ERROR);
    }
    return new Promise<number>((resolve, reject) => {
      let responseString = '';
      const command = typeof baseZ === 'number' ? `B45Z${baseZ}` : 'B45';
      let timeoutTimer: null | NodeJS.Timeout;
      let retryTimes = 0;
      let isCmdResent = false;

      const sendCommand = async (firstTime = false) => {
        const handleMessage = (response: string, fromLineCheckMode = false) => {
          clearTimeout(timeoutTimer);
          responseString += response;
          const responses = responseString.split(/\r?\n/);
          console.log(responses);
          const finished = responses.some((r) => r === 'ok');
          if (finished || fromLineCheckMode) {
            const resIdx = responses.findIndex((r) => r.match(/z_pos/));
            if (resIdx >= 0) {
              this.removeCommandListeners();
              const resStr = responses[resIdx];
              const data = JSON.parse(resStr);
              const { z_pos: zPos } = data;
              resolve(Number(zPos));
            } else {
              this.removeCommandListeners();
              reject(response);
            }
            return;
          }
          if (responseString.indexOf('error:') >= 0) {
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
              if (response && response.status === 'raw') responseString += response.text;
              handleMessage(responseString);
            });
          }
          this.sc.sendGCode(command);
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

  fwUpdate = (file: File) =>
    new Promise((resolve, reject) => {
      const blob = new Blob([file], { type: 'binary/flux-firmware' });
      this.sc.on(EVENT_COMMAND_MESSAGE, (response) => {
        if (response.status === 'ok') {
          this.removeCommandListeners();
          resolve(response);
        } else if (response.status === 'uploading') {
          response.percentage = ((response.sent || 0) / blob.size) * 100;
          this.emit(EVENT_COMMAND_PROGRESS, response);
        } else {
          this.removeCommandListeners();
          reject(response);
        }
      });
      this.sc.updateFirmware(blob);

      this.setDefaultErrorResponse(reject);
      this.setDefaultFatalResponse(reject);
    });

  checkButton = () => this.sc.checkButton();
}

export default SwiftrayControl;
