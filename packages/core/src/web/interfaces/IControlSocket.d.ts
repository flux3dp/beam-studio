import type { EventEmitter } from 'eventemitter3';

import type { SwiftrayClient } from '@core/helpers/api/swiftray-client';

import type { RawChipSettings } from './Cartridge';
import type { FisheyeCameraParameters, RotationParameters3D } from './FisheyePreview';
import type { IDeviceDetailInfo, IReport } from './IDevice';
import type { ButtonState, Field, LensCorrection } from './Promark';
import type { WrappedWebSocket } from './WebSocket';

export type Mode = '' | 'cartridge_io' | 'raw' | 'red_laser_measure';

interface IControlSocket extends EventEmitter {
  abort(): Promise<unknown>;

  addTask<T>(taskFunction: (...args) => T, ...args: unknown[]): Promise<T>;
  cartridgeIOJsonRpcReq?: (
    method: string,
    params: unknown,
  ) => Promise<{ data: { result: { hash: string; sign: string } }; status: string }>;
  checkButton: () => Promise<ButtonState>;

  connect(): Promise<void>;
  connection: null | SwiftrayClient | WrappedWebSocket;
  deleteDeviceSetting(name: string): Promise<unknown>;
  deleteFile(fileNameWithPath: string): Promise<unknown>;
  deviceDetailInfo(): Promise<IDeviceDetailInfo>;
  downloadFile(fileNameWithPath: string): Promise<[string, Blob]>;

  downloadLog(logName: string): Promise<Array<Blob | string>>;
  endCartridgeIOMode?: () => Promise<void>;
  endRawMode(): Promise<unknown>;
  endRedLaserMeasureMode?: () => Promise<void>;
  enterCartridgeIOMode?: () => Promise<void>;
  enterRawMode(): Promise<unknown>;
  enterRedLaserMeasureMode?: () => Promise<void>;
  fetchAutoLevelingData?: (dataType: string) => Promise<{ [key: string]: number }>;
  // method not supported by SwiftrayClient
  fetchCameraCalibImage?: (name?: string) => Promise<Blob>;
  fetchFisheye3DRotation?: () => Promise<RotationParameters3D>;
  fetchFisheyeParams?: () => Promise<FisheyeCameraParameters>;
  fileInfo(path: string, fileName: string): Promise<unknown[]>;
  fwUpdate(file: File): Promise<unknown>;
  getCartridgeChipData?: () => Promise<{ data: { result: RawChipSettings }; status: string }>;
  getDeviceSetting(name: string): Promise<{ status: string; value: string }>;
  getDoorOpen(): Promise<{ value: string }>;
  getFan(): Promise<{ value: number }>;
  getLaserPower(): Promise<{ value: number }>;
  getLaserSpeed(): Promise<{ value: number }>;
  getMode(): Mode;
  getPreview(): Promise<unknown[]>;
  isConnected: boolean;
  isLineCheckMode: boolean;
  kick(): Promise<unknown>;
  killSelf(): Promise<null>;
  lineNumber: number;
  ls(path: string): Promise<{ directories: string[]; error?: string; files: string[] }>;
  lsusb(): Promise<{ usbs: string[] }>;
  measureZ?: (args?: { F?: number; X?: number; Y?: number }) => Promise<number>;
  pause(): Promise<unknown>;
  quit(): Promise<unknown>;
  quitTask(): Promise<unknown>;
  rawAutoFocus(timeout?: number): Promise<void>;
  rawEndLineCheckMode(): Promise<void>;
  rawGetLastPos: () => Promise<{ a: number; x: number; y: number; z: number }>;
  rawGetProbePos: () => Promise<{ a: number; didAf: boolean; x: number; y: number; z: number }>;
  rawHome(zAxis?: boolean): Promise<void>;
  rawLooseMotor(fcodeVersion?: number): Promise<string>;
  rawLooseMotorOld: () => Promise<string>;
  rawMeasureHeight: (baseZ: number | undefined, timeout?: number) => Promise<number>;
  rawMove(args: { f?: number; x?: number; y?: number; z?: number }): Promise<unknown>;
  rawMoveZRelToLastHome(z: number): Promise<unknown>;
  rawSet24V(on: boolean): Promise<unknown>;
  rawSetAirPump(on: boolean, fcodeVersion?: number): Promise<unknown>;
  rawSetFan(on: boolean, fcodeVersion?: number): Promise<unknown>;
  rawSetLaser(args: { on: boolean; s?: number }): Promise<unknown>;
  rawSetOrigin: (fcodeVersion?: number) => Promise<string>;
  rawSetRedLight(on: boolean): Promise<unknown>;
  rawSetRotary(on: boolean, fcodeVersion?: number): Promise<unknown>;
  rawSetWaterPump(on: boolean, fcodeVersion?: number): Promise<unknown>;
  rawStartLineCheckMode(): Promise<void>;
  rawUnlock(): Promise<string | void>;
  removeCommandListeners(): void;
  report(): Promise<{ device_status: IReport }>;
  restart(): Promise<unknown>;
  resume(): Promise<unknown>;
  select(path: string[], fileName: string): Promise<{ status: string }>;
  setDeviceSetting(name: string, value: string): Promise<unknown>;
  setFan(fanSpeed: number): Promise<unknown>;

  setFanTemp(fanSpeed: number): Promise<unknown>;
  setField(worksize: number, fieldData: Field): Promise<boolean>;
  setLaserPower(power: number): Promise<unknown>;
  setLaserPowerTemp(power: number): Promise<unknown>;
  setLaserSpeed(speed: number): Promise<unknown>;
  setLaserSpeedTemp(speed: number): Promise<unknown>;
  setLensCorrection(x: LensCorrection, y: LensCorrection): Promise<boolean>;
  setOriginX(x: number): Promise<unknown>;
  setOriginY(y: number): Promise<unknown>;
  setProgressListener(listener: (...args: unknown[]) => void): void;
  start(): Promise<unknown>;
  takeReferenceZ?: (args?: { F?: number; H?: number; X?: number; Y?: number }) => Promise<number>;
  updateFisheye3DRotation?: (data: RotationParameters3D) => Promise<{ status: string }>;
  upload(data: any, path?: string, fileName?: string): Promise<void>;
  uploadFisheyeParams?: (data: string) => Promise<{ status: string }>;
}

export default IControlSocket;
