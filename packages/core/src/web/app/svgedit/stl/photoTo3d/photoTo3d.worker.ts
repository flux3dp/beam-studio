import { decodeDepthSource } from './depthSource';
import { generatePhotoTo3dPoints, PhotoTo3dError } from './generate';
import type { PhotoTo3dJob, PhotoTo3dJobResult } from './runPhotoTo3d';

/** Runs `generatePhotoTo3dPoints` off the main thread: a million-point photo takes seconds. */
self.onmessage = ({ data: { depthSource, params, pixels, size } }: MessageEvent<PhotoTo3dJob>) => {
  let result: PhotoTo3dJobResult;

  try {
    const points = generatePhotoTo3dPoints(pixels, decodeDepthSource(depthSource), size, params);

    result = { points };
    (self as unknown as Worker).postMessage(result, [points.buffer]);
  } catch (error) {
    result = {
      error: {
        message: error instanceof Error ? error.message : String(error),
        reason: error instanceof PhotoTo3dError ? error.reason : undefined,
      },
    };
    (self as unknown as Worker).postMessage(result);
  }
};
