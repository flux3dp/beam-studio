import { loadJson, uploadJson } from '@core/helpers/device/jsonDataHelper';
import deviceMaster from '@core/helpers/device-master';
import storage from '@core/implementations/storage';

import { READING_STEP_MM } from './layout';

/**
 * Systematic print-and-cut offset of one machine, in mm in the printed
 * sheet's frame: where the laser lands relative to the print it was aligned
 * to. Measured by the vernier calibration; the align step moves the cut by
 * its negation. Kept on the machine as camera_calib/pnc.json when its
 * firmware accepts a json upload there; the fluxmonitor generation (beamo,
 * Beambox, HEXA, beamo II) does not — its `upload` only knows the
 * SD/USB/SAMPLE entries and `config set` a fixed key list — so those fall
 * back to this computer's storage, keyed by serial.
 */
export interface PncOffset {
  x: number;
  y: number;
}

const DIRECTORY = 'camera_calib';
const FILE_NAME = 'pnc.json';
const STORAGE_KEY = 'pnc-offset-store';

const isPncOffset = (data: unknown): data is PncOffset =>
  typeof data === 'object' &&
  data !== null &&
  typeof (data as PncOffset).x === 'number' &&
  typeof (data as PncOffset).y === 'number';

const getLocal = (serial: string): PncOffset | undefined => storage.get(STORAGE_KEY)?.[serial];

const setLocal = (serial: string, offset: PncOffset | undefined): void => {
  const { [serial]: _, ...rest } = storage.get(STORAGE_KEY) ?? {};

  storage.set(STORAGE_KEY, offset ? { ...rest, [serial]: offset } : rest);
};

/** Read the machine's offset: the machine first, else this computer; undefined when neither has one */
export const fetchPncOffset = async (serial: string): Promise<PncOffset | undefined> => {
  try {
    const data = await loadJson(DIRECTORY, FILE_NAME);

    if (isPncOffset(data)) return { x: data.x, y: data.y };
  } catch {
    // not on the machine (or the firmware has no such entry)
  }

  return getLocal(serial);
};

const roundMm = (value: number): number => Math.round(value * 1000) / 1000;

/**
 * Write the offset to the machine when it accepts it, else to this computer.
 * A machine write also drops any local copy, so the machine stays the
 * authority once it can hold the file.
 */
export const savePncOffset = async (serial: string, { x, y }: PncOffset): Promise<void> => {
  const offset = { x: roundMm(x), y: roundMm(y) };

  try {
    await uploadJson(offset, DIRECTORY, FILE_NAME);
    setLocal(serial, undefined);
  } catch (error) {
    console.warn('print-and-cut offset: the machine refused the upload, kept locally', error);
    setLocal(serial, offset);
  }
};

/**
 * Drop the stored offset everywhere: it was measured against the camera
 * calibration in force at the time, so every camera calibration write
 * (classic offset, fisheye) must call this. A missing file is not an error.
 */
export const clearPncOffset = async (serial: string): Promise<void> => {
  setLocal(serial, undefined);

  try {
    await deviceMaster.deleteFile(DIRECTORY, FILE_NAME);
  } catch {
    // nothing stored there
  }
};

/**
 * Convert the vernier readings into the measured offset. A reading is the
 * printed index (-READING_MAX..READING_MAX, right/down positive) of the line
 * that coincides with a scratched line; each index is READING_STEP_MM.
 */
export const readingToOffset = (readingX: number, readingY: number): PncOffset => {
  return { x: readingX * READING_STEP_MM, y: readingY * READING_STEP_MM };
};
