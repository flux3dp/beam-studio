import { dpmm } from '@core/app/actions/beambox/constant';
import previewModeBackgroundDrawer from '@core/app/actions/beambox/preview-mode-background-drawer';
import Logger from '@core/helpers/logger';

import type { Point, RigidTransform } from '../rigidTransform';

const LOGGER_NAME = 'print-and-cut';
const MAX_ENTRIES = 200;
/** Width the failure image is downscaled to, in px: keeps the base64 line around 200 KB */
const FAILURE_IMAGE_WIDTH = 1200;
const FAILURE_IMAGE_QUALITY = 0.7;

const logger = Logger(LOGGER_NAME, MAX_ENTRIES);
/** One slot, overwritten by the next failed run, so retries cannot bloat the report */
let failureImage: null | string = null;

export const mm = (px: number): number => Number((px / dpmm).toFixed(2));

export const pointMm = ({ x, y }: Point): [number, number] => [mm(x), mm(y)];

/** The readable part of a fit, in mm and degrees */
export const fitSummary = ({ angle, errors, residual, residualX, residualY, scale }: RigidTransform) => ({
  // per mark, sheet frame, in markPositions order: TL, TR, BL, BR
  markErrorsMm: errors.map(pointMm),
  residualMm: mm(residual),
  residualXMm: mm(residualX),
  residualYMm: mm(residualY),
  rotationDeg: Number(((angle * 180) / Math.PI).toFixed(3)),
  scale: Number(scale.toFixed(4)),
});

/**
 * Record an align-flow event for the bug report (and the console). The
 * report is text: keep entries small and in mm, the failure image has its
 * own slot.
 */
export const logAlign = (event: string, data: Record<string, unknown> = {}): void => {
  logger.append({ event, time: new Date().toISOString(), ...data });
  console.log(`print-and-cut ${event}`, data);
};

export const logAlignError = (stage: string, error: unknown): void => {
  logAlign('error', {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    stage,
  });
};

/** Keep a downscaled JPEG of what the camera saw when a run failed */
export const saveFailureImage = async (): Promise<void> => {
  try {
    if (previewModeBackgroundDrawer.isClean()) return;

    const response = await fetch(await previewModeBackgroundDrawer.getCameraCanvasUrl({ useCache: false }));
    const bitmap = await createImageBitmap(await response.blob());
    const scale = Math.min(1, FAILURE_IMAGE_WIDTH / bitmap.width);
    const canvas = document.createElement('canvas');

    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    failureImage = canvas.toDataURL('image/jpeg', FAILURE_IMAGE_QUALITY);
  } catch (error) {
    console.warn('print-and-cut: failed to keep the failure image', error);
  }
};

/**
 * Pretty JSON with arrays that hold no objects kept on one line: coordinates
 * read as `[x, y]` pairs instead of one number per line. Repeats until nested
 * arrays (an array of points) are flat too.
 */
const stringifyInlineArrays = (value: unknown): string => {
  let json = JSON.stringify(value, null, 2);
  let previous: string;

  do {
    previous = json;
    json = json.replace(
      /\[\s*\n\s*((?:[^[\]{}]|\[[^[\]\n]*\])*?)\s*\n\s*\]/g,
      (_, inner: string) => `[${inner.replace(/\s*\n\s*/g, ' ')}]`,
    );
  } while (json !== previous);

  return json;
};

/**
 * The bug report section: the logged events, then the last failure image as
 * a data url (paste it into a browser address bar to view)
 * @param includeImage off for automatic uploads: a photo of the user's bed
 * should only leave the machine with a deliberate report
 */
export const getPrintAndCutReport = ({ includeImage = true } = {}): string => {
  const entries = stringifyInlineArrays(logger.getAll()[LOGGER_NAME] ?? []);

  return includeImage && failureImage ? `${entries}\n\nlast failure image (data url):\n${failureImage}\n` : entries;
};
