import { swiftrayClient } from '@core/helpers/api/swiftray-client';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

export interface BeamGoCalibration {
  bucketX: number;
  bucketY: number;
  fieldMm: number;
  length: number;
  paralleX: number;
  paralleY: number;
  rawHex: string;
  reverseX: boolean;
  reverseY: boolean;
  scaleX: number;
  scaleY: number;
  swapXY: boolean;
  trapeX: number;
  trapeY: number;
}

export interface BeamGoSafety {
  doorCheck: boolean;
  mask: number;
  tiltCheck: boolean;
}

export type BeamGoResult<T> = Partial<T> & { error?: string; success: boolean };
export type CalibrationWrite = BeamGoResult<{
  backupHex: string;
  backupLens: BeamGoCalibration;
  readback: BeamGoCalibration;
}>;

/** Bind every request to the selected device's port, independent of the singleton's active port. */
export const beamGoAction = <T>(device: IDeviceInfo, action: string, params?: unknown): Promise<BeamGoResult<T>> => {
  if (device.model !== 'fbg1' || !device.port?.startsWith('beamgo/')) throw new Error('INVALID_DEVICE');

  return swiftrayClient.action(`/devices/${device.port}`, action, params, undefined, 30000);
};
