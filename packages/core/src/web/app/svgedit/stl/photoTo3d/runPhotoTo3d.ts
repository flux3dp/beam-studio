import type { RasterData } from './dither';
import type { PhotoTo3dParams, PhotoTo3dSize } from './generate';
import { PhotoTo3dError } from './generate';

export interface PhotoTo3dJob {
  /** BSDM */
  depthSource: ArrayBuffer;
  params: PhotoTo3dParams;
  pixels: RasterData;
  size: PhotoTo3dSize;
}

export type PhotoTo3dJobResult =
  | { error: { message: string; reason?: PhotoTo3dError['reason'] } }
  | { points: Float32Array };

export class PhotoTo3dCancelledError extends Error {
  constructor() {
    super();
    this.name = 'PhotoTo3dCancelledError';
  }
}

const running = new Map<string, { reject: (error: Error) => void; worker: Worker }>();

/**
 * Compute a photo-to-3D point cloud in a Web Worker.
 *
 * Only the latest job of an object counts: starting another one for the same `key` terminates the
 * running one, whose promise rejects with `PhotoTo3dCancelledError`, so editing a value again while it
 * computes never queues up runs.
 */
export const runPhotoTo3d = (key: string, job: PhotoTo3dJob): Promise<Float32Array> => {
  running.get(key)?.reject(new PhotoTo3dCancelledError());

  return new Promise<Float32Array>((resolve, reject) => {
    const worker = new Worker(
      new URL(/* webpackChunkName: "photo-to-3d.worker" */ './photoTo3d.worker.ts', import.meta.url),
    );
    const finish = () => {
      worker.terminate();

      if (running.get(key)?.worker === worker) running.delete(key);
    };

    running.set(key, {
      reject: (error) => {
        finish();
        reject(error);
      },
      worker,
    });
    worker.onmessage = ({ data }: MessageEvent<PhotoTo3dJobResult>) => {
      finish();

      if ('points' in data) resolve(data.points);
      else reject(new PhotoTo3dError(data.error.reason ?? 'no-points', data.error.message));
    };
    worker.onerror = (event) => {
      finish();
      reject(new Error(event.message));
    };
    worker.postMessage(job);
  });
};
