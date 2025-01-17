import EventEmitter from 'eventemitter3';

import { SwiftrayClient } from 'helpers/api/swiftray-client';

import { ButtonState, Field, LensCorrection } from './Promark';
// eslint-disable-next-line import/no-cycle
import { FisheyeCameraParameters, RotationParameters3D } from './FisheyePreview';
import { IDeviceDetailInfo, IReport } from './IDevice';
import { RawChipSettings } from './Cartridge';
import { WrappedWebSocket } from './WebSocket';

export type Mode = '' | 'raw' | 'cartridge_io' | 'red_laser_measure';

interface IControlSocket extends EventEmitter {
  isConnected: boolean;
  connection: WrappedWebSocket | SwiftrayClient | null;
  isLineCheckMode: boolean;
  lineNumber: number;

  getMode(): Mode;
  // eslint-disable-next-line @typescript-eslint/ban-types
  addTask<T>(taskFunction: (...args) => T, ...args: unknown[]): Promise<T>;
  connect(): Promise<void>;
  killSelf(): Promise<null>;
  setProgressListener(listener: (...args: unknown[]) => void): void;
  removeCommandListeners(): void;

  ls(path: string): Promise<{ files: string[]; directories: string[]; error?: string }>;
  lsusb(): Promise<{ usbs: string[] }>;
  fileInfo(path: string, fileName: string): Promise<unknown[]>;
  report(): Promise<{ device_status: IReport }>;
  upload(data: any, path?: string, fileName?: string): Promise<void>;
  abort(): Promise<unknown>;
  quit(): Promise<unknown>;
  start(): Promise<unknown>;
  pause(): Promise<unknown>;
  resume(): Promise<unknown>;
  restart(): Promise<unknown>;
  kick(): Promise<unknown>;
  quitTask(): Promise<unknown>;
  deviceDetailInfo(): Promise<IDeviceDetailInfo>;
  getPreview(): Promise<unknown[]>;
  select(path: string[], fileName: string): Promise<{ status: string }>;
  deleteFile(fileNameWithPath: string): Promise<unknown>;
  downloadFile(fileNameWithPath: string): Promise<[string, Blob]>;
  downloadLog(logName: string): Promise<(string | Blob)[]>;
  getLaserPower(): Promise<{ value: number }>;
  setLaserPower(power: number): Promise<unknown>;
  setLaserPowerTemp(power: number): Promise<unknown>;
  getLaserSpeed(): Promise<{ value: number }>;
  setLaserSpeed(speed: number): Promise<unknown>;
  setLaserSpeedTemp(speed: number): Promise<unknown>;
  getFan(): Promise<{ value: number }>;
  setFan(fanSpeed: number): Promise<unknown>;
  setFanTemp(fanSpeed: number): Promise<unknown>;
  setOriginX(x: number): Promise<unknown>;
  setOriginY(y: number): Promise<unknown>;
  setField(worksize: number, fieldData: Field): Promise<boolean>;
  setLensCorrection(x: LensCorrection, y: LensCorrection): Promise<boolean>;
  getDoorOpen(): Promise<{ value: string }>;
  getDeviceSetting(name: string): Promise<{ status: string; value: string }>;
  setDeviceSetting(name: string, value: string): Promise<unknown>;
  deleteDeviceSetting(name: string): Promise<unknown>;
  enterRawMode(): Promise<unknown>;
  endRawMode(): Promise<unknown>;
  rawHome(zAxis?: boolean): Promise<void>;
  rawUnlock(): Promise<string | void>;
  rawMoveZRelToLastHome(z: number): Promise<unknown>;
  rawStartLineCheckMode(): Promise<void>;
  rawEndLineCheckMode(): Promise<void>;
  rawMove(args: { x?: number; y?: number; z?: number; f?: number }): Promise<unknown>;
  rawSetWaterPump(on: boolean, fcodeVersion?: number): Promise<unknown>;
  rawSetAirPump(on: boolean, fcodeVersion?: number): Promise<unknown>;
  rawSetFan(on: boolean, fcodeVersion?: number): Promise<unknown>;
  rawSetRotary(on: boolean, fcodeVersion?: number): Promise<unknown>;
  rawLooseMotor(fcodeVersion?: number): Promise<string>;
  rawLooseMotorOld: () => Promise<string>;
  rawSetLaser(args: { on: boolean; s?: number }): Promise<unknown>;
  rawSetRedLight(on: boolean): Promise<unknown>;
  rawSet24V(on: boolean): Promise<unknown>;
  rawAutoFocus(timeout?: number): Promise<void>;
  fwUpdate(file: File): Promise<unknown>;
  rawGetProbePos: () => Promise<{ x: number; y: number; z: number; a: number; didAf: boolean }>;
  rawGetLastPos: () => Promise<{ x: number; y: number; z: number; a: number }>;
  rawMeasureHeight: (baseZ: number | undefined, timeout?: number) => Promise<number>;
  rawSetOrigin: (fcodeVersion?: number) => Promise<string>;

  // method not supported by SwiftrayClient
  fetchCameraCalibImage?: (name?: string) => Promise<Blob>;
  enterCartridgeIOMode?: () => Promise<void>;
  endCartridgeIOMode?: () => Promise<void>;
  getCartridgeChipData?: () => Promise<{ status: string; data: { result: RawChipSettings } }>;
  cartridgeIOJsonRpcReq?: (
    method: string,
    params: unknown
  ) => Promise<{ status: string; data: { result: { hash: string; sign: string } } }>;
  enterRedLaserMeasureMode?: () => Promise<void>;
  endRedLaserMeasureMode?: () => Promise<void>;
  takeReferenceZ?: (args?: { X?: number; Y?: number; F?: number; H?: number }) => Promise<number>;
  measureZ?: (args?: { X?: number; Y?: number; F?: number }) => Promise<number>;
  fetchFisheyeParams?: () => Promise<FisheyeCameraParameters>;
  uploadFisheyeParams?: (data: string) => Promise<{ status: string }>;
  fetchFisheye3DRotation?: () => Promise<RotationParameters3D>;
  updateFisheye3DRotation?: (data: RotationParameters3D) => Promise<{ status: string }>;
  fetchAutoLevelingData?: (dataType: string) => Promise<{ [key: string]: number }>;
  checkButton: () => Promise<ButtonState>;
}

export default IControlSocket;
