import { EventEmitter } from 'eventemitter3';

import arrayBuffer from '@core/helpers/arrayBuffer';
import Websocket from '@core/helpers/websocket';
import type { AutoFitContour } from '@core/interfaces/IAutoFit';
import type { WrappedWebSocket } from '@core/interfaces/WebSocket';

class UtilsWebSocket extends EventEmitter {
  private ws: WrappedWebSocket;

  constructor() {
    super();
    this.ws = Websocket({
      method: 'utils',
      onError: (response) => {
        this.emit('error', response);
      },
      onFatal: (response) => {
        this.emit('fatal', response);
      },
      onMessage: (data) => {
        this.emit('message', data);
      },
    });
  }

  isAlive(): boolean {
    return this.ws.currentState === 1;
  }

  removeCommandListeners(): void {
    this.removeAllListeners('message');
    this.removeAllListeners('error');
    this.removeAllListeners('fatal');
  }

  setDefaultErrorResponse(reject: (reason?) => void, timeoutTimer?: NodeJS.Timeout): void {
    this.on('error', (response) => {
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
      }

      this.removeCommandListeners();
      reject(response.info);
    });
  }

  setDefaultFatalResponse(reject: (reason?) => void, timeoutTimer?: NodeJS.Timeout): void {
    this.on('fatal', (response) => {
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
      }

      this.removeCommandListeners();
      console.log(response);

      if (response.error) {
        if (response.error.join) {
          reject(response.error.join(''));
        } else {
          reject(response.error);
        }
      } else {
        reject();
      }
    });
  }

  upload(data: ArrayBuffer, url: string): Promise<{ [key: string]: string }> {
    return new Promise((resolve, reject) => {
      this.removeCommandListeners();
      this.setDefaultErrorResponse(reject);
      this.setDefaultFatalResponse(reject);
      this.on('message', (response: { [key: string]: string }) => {
        const { status } = response;

        if (['fail', 'none', 'ok'].includes(status)) {
          this.removeCommandListeners();
          resolve(response);
        } else if (status === 'continue') {
          this.ws.send(data);
        } else {
          console.log('strange message from /ws/utils', response);
        }
      });
      this.ws.send(`upload ${url} ${data.byteLength}`);
    });
  }

  async pdfToSvgBlob(file: File): Promise<Blob> {
    const data = await arrayBuffer(file);

    return new Promise((resolve, reject) => {
      this.removeCommandListeners();
      this.setDefaultErrorResponse(reject);
      this.setDefaultFatalResponse(reject);
      this.on('message', async (response) => {
        if (response.status === 'continue') {
          this.ws.send(data);
        }

        if (response instanceof Blob) {
          this.removeCommandListeners();
          resolve(response);
        }
      });
      this.ws.send(`pdf2svg ${data.byteLength}`);
    });
  }

  async checkExist(path: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.removeCommandListeners();
      this.setDefaultErrorResponse(reject);
      this.setDefaultFatalResponse(reject);
      this.on('message', (response) => {
        const { status } = response;

        console.log(response);

        if (status === 'ok') {
          this.removeCommandListeners();
          resolve(response.res);
        } else {
          console.log('strange message from /ws/utils', response);
        }
      });
      this.ws.send(`check_exist ${path}`);
    });
  }

  async selectFont(fontPath: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.removeCommandListeners();
      this.setDefaultErrorResponse(reject);
      this.setDefaultFatalResponse(reject);
      this.on('message', (response) => {
        const { status } = response;

        console.log(response);

        if (status === 'ok') {
          this.removeCommandListeners();
          resolve(true);
        } else if (status === 'error') {
          this.removeCommandListeners();
          resolve(false);
        } else {
          console.log('strange message from /ws/utils', response);
        }
      });
      this.ws.send(`select_font ${fontPath}`);
    });
  }

  async uploadTo(blob: Blob, path: string, onProgress?: (progress: number) => void) {
    const data = await arrayBuffer(blob);
    let sentLength = 0;

    return new Promise<boolean>((resolve, reject) => {
      this.removeCommandListeners();
      this.setDefaultErrorResponse(reject);
      this.setDefaultFatalResponse(reject);
      this.on('message', (response: { progress?: number; status: string }) => {
        const { status } = response;

        if (['fail', 'ok'].includes(status)) {
          this.removeCommandListeners();
          resolve(status === 'ok');
        } else if (status === 'continue') {
          while (sentLength < data.byteLength) {
            const end = Math.min(sentLength + 1000000, data.byteLength);

            this.ws.send(data.slice(sentLength, end));
            sentLength = end;
          }
        } else if (status === 'progress' && response.progress) {
          if (onProgress) {
            onProgress(response.progress);
          }
        } else {
          console.log('strange message from /ws/utils', response);
          resolve(false);
        }
      });
      this.ws.send(`upload_to ${data.byteLength} ${path}`);
    });
  }

  transformRgbImageToCmyk = async (
    blob: Blob,
    opts: { onProgress?: (progress: number) => void; resultType?: 'base64' | 'binary' } = {},
  ) => {
    const data = await arrayBuffer(blob);
    const { onProgress, resultType = 'binary' } = opts;

    return new Promise<Blob | string>((resolve, reject) => {
      this.removeCommandListeners();
      this.setDefaultErrorResponse(reject);
      this.setDefaultFatalResponse(reject);

      let totalLength = 0;
      const blobs: Blob[] = [];
      let sentLength = 0;

      this.on('message', (response: Blob | { data?: string; length: number; progress?: number; status: string }) => {
        if (response instanceof Blob) {
          blobs.push(response as Blob);

          const result = new Blob(blobs);

          if (totalLength === result.size) {
            resolve(result);
          }
        } else {
          const { length, progress, status } = response as {
            length: number;
            progress?: number;
            status: string;
          };

          if (status === 'continue') {
            while (sentLength < data.byteLength) {
              const end = Math.min(sentLength + 1000000, data.byteLength);

              this.ws.send(data.slice(sentLength, end));
              sentLength = end;
            }
          } else if (status === 'progress' && progress) {
            if (onProgress) {
              onProgress(progress);
            }
          } else if (status === 'complete') {
            totalLength = length;
          } else if (status === 'uploaded') {
            console.log('Upload finished');
          } else if (status === 'ok') {
            resolve(response.data!);
          } else {
            console.log('strange message from /ws/utils', response);
            reject(new Error('strange message from /ws/utils'));
          }
        }
      });

      const args = ['rgb_to_cmyk', data.byteLength, resultType === 'binary' ? 'binary' : 'base64'];

      this.ws.send(args.join(' '));
    });
  };

  splitColor = async (
    blob: Blob,
    opts: { colorType: 'cmy' | 'cmyk' | 'rgb'; onProgress?: (progress: number) => void } = { colorType: 'rgb' },
  ): Promise<{ c: string; k: string; m: string; y: string }> => {
    const data = await arrayBuffer(blob);
    const { colorType = 'rgb', onProgress } = opts;

    return this.uploadCommand(['split_color', data.byteLength, colorType], data, {
      onProgress,
      pick: ({ c, k, m, y }: { c: string; k: string; m: string; y: string }) => ({ c, k, m, y }),
    });
  };

  getAllSimilarContours = async (
    imgBlob: Blob,
    opts?: { isSplicingImg?: boolean; onProgress?: (progress: number) => void },
  ): Promise<AutoFitContour[][]> => {
    const data = await arrayBuffer(imgBlob);

    return this.uploadCommand(['get_all_similar_contours', data.byteLength, opts?.isSplicingImg ? 1 : 0], data, {
      onProgress: opts?.onProgress,
    });
  };

  /** Two-phase command: text `<cmd> <bytes> ...` -> 'continue' -> binary chunks -> 'ok' with data. */
  private uploadCommand = <T>(
    args: Array<number | string>,
    data: ArrayBuffer,
    opts: { onProgress?: (p: number) => void; pick?: (reply: any) => T } = {},
  ) =>
    new Promise<T>((resolve, reject) => {
      const { onProgress, pick = (reply) => reply.data } = opts;

      this.removeCommandListeners();
      this.setDefaultErrorResponse(reject);
      this.setDefaultFatalResponse(reject);

      let sentLength = 0;

      this.on('message', (response: { info?: string; progress?: number; status?: string }) => {
        if (response instanceof Blob) {
          reject(new Error('strange message from /ws/utils'));

          return;
        }

        const { status } = response;

        if (status === 'continue') {
          while (sentLength < data.byteLength) {
            const end = Math.min(sentLength + 1000000, data.byteLength);

            this.ws.send(data.slice(sentLength, end));
            sentLength = end;
          }
        } else if (status === 'ok') {
          resolve(pick(response));
        } else if (status === 'progress') {
          onProgress?.(response.progress!);
        } else if (status === 'error') {
          reject(new Error(response.info));
        } else if (status !== 'uploaded') {
          reject(new Error('strange message from /ws/utils'));
        }
      });

      this.ws.send(args.join(' '));
    });

  /** Classic-CV detection stage only: flat contour list incl. singletons. */
  getContours = async (imgBlob: Blob, opts?: { isSplicingImg?: boolean }): Promise<AutoFitContour[]> => {
    const data = await arrayBuffer(imgBlob);

    return this.uploadCommand(['get_contours', data.byteLength, opts?.isSplicingImg ? 1 : 0], data);
  };

  /** Grouping stage only: polygons from an external detector -> same groups as getAllSimilarContours. */
  groupContours = async (
    contours: Array<Array<[number, number]>>,
    opts?: { isSplicingImg?: boolean },
  ): Promise<AutoFitContour[][]> => {
    const data = new TextEncoder().encode(JSON.stringify({ contours })).buffer as ArrayBuffer;

    return this.uploadCommand(['group_contours', data.byteLength, opts?.isSplicingImg ? 1 : 0], data);
  };

  getConvexHull = async (imgBlob: Blob): Promise<Array<[number, number]>> => {
    const data = await arrayBuffer(imgBlob);

    return this.uploadCommand(['get_convex_hull', data.byteLength], data);
  };
}

let singleton: UtilsWebSocket;

const getUtilWS = (): UtilsWebSocket => {
  singleton = singleton || new UtilsWebSocket();

  return singleton;
};

export default getUtilWS;
