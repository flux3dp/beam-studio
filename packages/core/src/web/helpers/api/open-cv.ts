import { EventEmitter } from 'eventemitter3';
import PQueue from 'p-queue';

import Websocket from '@core/helpers/websocket';
import type { WrappedWebSocket } from '@core/interfaces/WebSocket';

class OpenCVWebSocket extends EventEmitter {
  private ws: WrappedWebSocket;

  /**
   * Commands are two-phase (text command → continue → binary upload → ok):
   * sending a new command while a previous one is still uploading corrupts the
   * protocol, so commands run one at a time through the queue.
   */
  private commandQueue = new PQueue({ concurrency: 1 });

  constructor() {
    super();
    this.ws = Websocket({
      method: 'opencv',
      onError: (response) => {
        this.emit('error', response);
      },
      onFatal: (response) => {
        this.emit('fatal', response);
      },
      onMessage: (data) => {
        this.emit('message', data);
      },
      onOpen: () => {
        this.emit('open');
      },
    });
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
      reject(response);
    });
  }

  setDefaultFatalResponse(reject: (reason?) => void, timeoutTimer?: NodeJS.Timeout): void {
    this.on('fatal', (response) => {
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
      }

      this.removeCommandListeners();
      reject(response);
    });
  }

  private enqueue = <T>(task: () => Promise<T>): Promise<T> => this.commandQueue.add(task) as Promise<T>;

  /** Resolve once the websocket connection is open, so commands are never sent into the void */
  private waitForOpen = (timeoutMs = 10000): Promise<void> =>
    new Promise((resolve, reject) => {
      if (this.ws.currentState === WebSocket.OPEN) {
        resolve();

        return;
      }

      const onOpen = () => {
        clearTimeout(timer);
        resolve();
      };
      const timer = setTimeout(() => {
        this.removeListener('open', onOpen);
        reject(new Error('Timeout waiting for opencv websocket to open'));
      }, timeoutMs);

      this.once('open', onOpen);
    });

  /** Only used by `sharpen`, from inside its queue slot: enqueueing this too would deadlock. */
  private async uploadUrl(url: string): Promise<{ [key: string]: string }> {
    const resp = await fetch(url);
    const blob = await resp.blob();
    const data = await blob.arrayBuffer();
    const res = await this.upload(data, url);

    return res;
  }

  private upload(data: ArrayBuffer, url: string): Promise<{ [key: string]: string }> {
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
          console.log('strange message from /ws/opencv', response);
        }
      });
      this.ws.send(`upload ${url} ${data.byteLength}`);
    });
  }

  async detectBlobs(
    imgBlob: Blob,
    params: { max_area?: number; min_area?: number; min_circularity?: number; min_convexity?: number } = {},
  ): Promise<{ points: Array<[number, number]> }> {
    const data = await imgBlob.arrayBuffer();

    return this.enqueue(async () => {
      await this.waitForOpen();

      return new Promise((resolve, reject) => {
        this.removeCommandListeners();
        this.setDefaultErrorResponse(reject);
        this.setDefaultFatalResponse(reject);
        this.on('message', (response: { points?: Array<[number, number]>; status: string }) => {
          const { status } = response;

          if (status === 'continue') {
            this.ws.send(data);
          } else if (status === 'ok') {
            this.removeCommandListeners();
            resolve({ points: response.points ?? [] });
          } else if (['fail', 'none'].includes(status)) {
            this.removeCommandListeners();
            reject(response);
          } else {
            console.log('strange message from /ws/opencv', response);
          }
        });
        this.ws.send(`detect_blobs ${data.byteLength} ${JSON.stringify(params)}`);
      });
    });
  }

  /**
   * Detect the outer contours of the image content (alpha silhouette, or dark
   * area on light background). Returns contour point lists in image pixel
   * coordinates; offsetting the outline is done by the caller.
   */
  async imageContour(
    imgBlob: Blob,
    params: {
      epsilon?: number;
      min_area?: number;
      threshold?: number;
    } = {},
  ): Promise<{ contours: Array<Array<[number, number]>> }> {
    const data = await imgBlob.arrayBuffer();

    return this.enqueue(async () => {
      await this.waitForOpen();

      return new Promise((resolve, reject) => {
        this.removeCommandListeners();
        this.setDefaultErrorResponse(reject);
        this.setDefaultFatalResponse(reject);
        this.on('message', (response: { contours?: Array<Array<[number, number]>>; status: string }) => {
          const { status } = response;

          if (status === 'continue') {
            this.ws.send(data);
          } else if (status === 'ok') {
            this.removeCommandListeners();
            resolve({ contours: response.contours ?? [] });
          } else if (['fail', 'none'].includes(status)) {
            this.removeCommandListeners();
            reject(response);
          } else {
            console.log('strange message from /ws/opencv', response);
          }
        });
        this.ws.send(`image_contour ${data.byteLength} ${JSON.stringify(params)}`);
      });
    });
  }

  async sharpen(imgUrl: string, sharpness: number, radius: number): Promise<Blob> {
    // shares the socket with the other commands, so it has to take its turn: `removeCommandListeners`
    // is global, and running alongside an in-flight command would strand that command's listeners
    return this.enqueue(async () => {
      await this.waitForOpen();

      return new Promise<Blob>((resolve, reject) => {
        this.removeCommandListeners();

        const setMessageHandler = () => {
          this.setDefaultErrorResponse(reject);
          this.setDefaultFatalResponse(reject);
          this.on('message', async (response) => {
            if (response.status === 'continue') {
              this.emit('message', response);
            } else if (response.status === 'need_upload') {
              try {
                await this.uploadUrl(imgUrl);
              } catch (error) {
                reject(error);
              }
              setMessageHandler();
              this.ws.send(`sharpen ${imgUrl} ${sharpness} ${radius}`);
            }

            if (response instanceof Blob) {
              this.removeCommandListeners();
              resolve(response);
            }
          });
        };

        setMessageHandler();
        this.ws.send(`sharpen ${imgUrl} ${sharpness} ${radius}`);
      });
    });
  }
}

let singleton: null | OpenCVWebSocket = null;

/** Shared lazy singleton: the websocket is only connected on first use */
const getOpenCV = (): OpenCVWebSocket => {
  singleton = singleton || new OpenCVWebSocket();

  return singleton;
};

export default getOpenCV;
