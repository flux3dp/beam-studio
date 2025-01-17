/* eslint-disable no-console */
import EventEmitter from 'eventemitter3';

import arrayBuffer from 'helpers/arrayBuffer';
import Websocket from 'helpers/websocket';
import { AutoFit, AutoFitContour } from 'interfaces/IAutoFit';
import { WrappedWebSocket } from 'interfaces/WebSocket';

class UtilsWebSocket extends EventEmitter {
  private ws: WrappedWebSocket;

  constructor() {
    super();
    this.ws = Websocket({
      method: 'utils',
      onMessage: (data) => {
        this.emit('message', data);
      },
      onError: (response) => {
        this.emit('error', response);
      },
      onFatal: (response) => {
        this.emit('fatal', response);
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
      if (timeoutTimer) clearTimeout(timeoutTimer);
      this.removeCommandListeners();
      reject(response.info);
    });
  }

  setDefaultFatalResponse(reject: (reason?) => void, timeoutTimer?: NodeJS.Timeout): void {
    this.on('fatal', (response) => {
      if (timeoutTimer) clearTimeout(timeoutTimer);
      this.removeCommandListeners();
      console.log(response);
      if (response.error) {
        if (response.error.join) reject(response.error.join(''));
        else reject(response.error);
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
        if (['ok', 'fail', 'none'].includes(status)) {
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
      this.on('message', (response: { status: string; progress?: number }) => {
        const { status } = response;
        if (['ok', 'fail'].includes(status)) {
          this.removeCommandListeners();
          resolve(status === 'ok');
        } else if (status === 'continue') {
          while (sentLength < data.byteLength) {
            const end = Math.min(sentLength + 1000000, data.byteLength);
            this.ws.send(data.slice(sentLength, end));
            sentLength = end;
          }
        } else if (status === 'progress' && response.progress) {
          if (onProgress) onProgress(response.progress);
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
    opts: { onProgress?: (progress: number) => void; resultType?: 'binary' | 'base64' } = {}
  ) => {
    const data = await arrayBuffer(blob);
    const { onProgress, resultType = 'binary' } = opts;
    return new Promise<string | Blob>((resolve, reject) => {
      this.removeCommandListeners();
      this.setDefaultErrorResponse(reject);
      this.setDefaultFatalResponse(reject);
      let totalLength = 0;
      const blobs: Blob[] = [];
      let sentLength = 0;
      this.on(
        'message',
        (response: Blob | { data?: string; status: string; length: number; progress?: number }) => {
          if (response instanceof Blob) {
            blobs.push(response as Blob);
            const result = new Blob(blobs);
            if (totalLength === result.size) {
              resolve(result);
            }
          } else {
            const { status, length, progress } = response as {
              status: string;
              length: number;
              progress?: number;
            };
            if (status === 'continue') {
              while (sentLength < data.byteLength) {
                const end = Math.min(sentLength + 1000000, data.byteLength);
                this.ws.send(data.slice(sentLength, end));
                sentLength = end;
              }
            } else if (status === 'progress' && progress) {
              if (onProgress) onProgress(progress);
            } else if (status === 'complete') {
              totalLength = length;
            } else if (status === 'uploaded') {
              console.log('Upload finished');
            } else if (status === 'ok') {
              resolve(response.data);
            } else {
              console.log('strange message from /ws/utils', response);
              reject(Error('strange message from /ws/utils'));
            }
          }
        }
      );
      const args = ['rgb_to_cmyk', data.byteLength, resultType === 'binary' ? 'binary' : 'base64'];
      this.ws.send(args.join(' '));
    });
  };

  splitColor = async (
    blob: Blob,
    opts: { onProgress?: (progress: number) => void; colorType: 'rgb' | 'cmyk' } = {
      colorType: 'rgb',
    }
  ) => {
    const data = await arrayBuffer(blob);
    const { colorType = 'rgb' } = opts;

    return new Promise<{ c: string; m: string; y: string; k: string }>((resolve, reject) => {
      this.removeCommandListeners();
      this.setDefaultErrorResponse(reject);
      this.setDefaultFatalResponse(reject);
      let sentLength = 0;
      this.on(
        'message',
        (response: {
          data?: string;
          status: string;
          c?: string;
          m?: string;
          y?: string;
          k?: string;
        }) => {
          if (response instanceof Blob) {
            console.log('strange message from /ws/utils', response);
            reject(Error('strange message from /ws/utils'));
          } else {
            const { status } = response as {
              status: string;
            };
            if (status === 'continue') {
              while (sentLength < data.byteLength) {
                const end = Math.min(sentLength + 1000000, data.byteLength);
                this.ws.send(data.slice(sentLength, end));
                sentLength = end;
              }
            } else if (status === 'uploaded') {
              console.log('Upload finished');
            } else if (status === 'ok') {
              const { c, m, y, k } = response as { c: string; m: string; y: string; k: string };
              resolve({ c, m, y, k });
            } else {
              console.log('strange message from /ws/utils', response);
              reject(Error('strange message from /ws/utils'));
            }
          }
        }
      );
      const args = ['split_color', data.byteLength, colorType];
      this.ws.send(args.join(' '));
    });
  };

  getSimilarContours = async (
    imgBlob: Blob,
    opts?: {
      isSplcingImg?: boolean;
      onProgress?: (progress: number) => void;
    }
  ) => {
    const data = await arrayBuffer(imgBlob);
    return new Promise<AutoFit[]>((resolve, reject) => {
      this.removeCommandListeners();
      this.setDefaultErrorResponse(reject);
      this.setDefaultFatalResponse(reject);
      const { isSplcingImg, onProgress } = opts || {};
      let sentLength = 0;
      this.on('message', (response: { data?: AutoFit[]; info?: string; progress?: number }) => {
        if (response instanceof Blob) {
          console.log('strange message from /ws/utils', response);
          reject(Error('strange message from /ws/utils'));
        } else {
          const { status } = response as {
            status: string;
          };
          if (status === 'continue') {
            while (sentLength < data.byteLength) {
              const end = Math.min(sentLength + 1000000, data.byteLength);
              this.ws.send(data.slice(sentLength, end));
              sentLength = end;
            }
          } else if (status === 'uploaded') {
            console.log('Upload finished');
          } else if (status === 'ok') {
            console.log(response.data);
            resolve(response.data);
          } else if (status === 'progress') {
            onProgress?.(response.progress);
          } else if (status === 'error') {
            reject(Error(response.info));
          } else {
            console.log('strange message from /ws/utils', response);
            reject(Error('strange message from /ws/utils'));
          }
        }
      });
      const args = ['get_similar_contours', data.byteLength, isSplcingImg ? 1 : 0];
      this.ws.send(args.join(' '));
    });
  };

  getAllSimilarContours = async (
    imgBlob: Blob,
    opts?: {
      isSplcingImg?: boolean;
      onProgress?: (progress: number) => void;
    }
  ) => {
    const data = await arrayBuffer(imgBlob);
    return new Promise<AutoFitContour[][]>((resolve, reject) => {
      this.removeCommandListeners();
      this.setDefaultErrorResponse(reject);
      this.setDefaultFatalResponse(reject);
      const { isSplcingImg, onProgress } = opts || {};
      let sentLength = 0;
      this.on(
        'message',
        (response: { data?: AutoFitContour[][]; info?: string; progress?: number }) => {
          if (response instanceof Blob) {
            console.log('strange message from /ws/utils', response);
            reject(Error('strange message from /ws/utils'));
          } else {
            const { status } = response as {
              status: string;
            };
            if (status === 'continue') {
              while (sentLength < data.byteLength) {
                const end = Math.min(sentLength + 1000000, data.byteLength);
                this.ws.send(data.slice(sentLength, end));
                sentLength = end;
              }
            } else if (status === 'uploaded') {
              console.log('Upload finished');
            } else if (status === 'ok') {
              console.log(response.data);
              resolve(response.data);
            } else if (status === 'progress') {
              onProgress?.(response.progress);
            } else if (status === 'error') {
              reject(Error(response.info));
            } else {
              console.log('strange message from /ws/utils', response);
              reject(Error('strange message from /ws/utils'));
            }
          }
        }
      );
      const args = ['get_all_similar_contours', data.byteLength, isSplcingImg ? 1 : 0];
      this.ws.send(args.join(' '));
    });
  };

  getConvexHull = async (imgBlob: Blob) => {
    const data = await arrayBuffer(imgBlob);
    return new Promise<[number, number][]>((resolve, reject) => {
      this.removeCommandListeners();
      this.setDefaultErrorResponse(reject);
      this.setDefaultFatalResponse(reject);
      let sentLength = 0;
      this.on(
        'message',
        (response: { data?: [number, number][]; info?: string; progress?: number }) => {
          if (response instanceof Blob) {
            console.log('strange message from /ws/utils', response);
            reject(Error('strange message from /ws/utils'));
          } else {
            const { status } = response as {
              status: string;
            };
            if (status === 'continue') {
              while (sentLength < data.byteLength) {
                const end = Math.min(sentLength + 1000000, data.byteLength);
                this.ws.send(data.slice(sentLength, end));
                sentLength = end;
              }
            } else if (status === 'uploaded') {
              console.log('Upload finished');
            } else if (status === 'ok') {
              resolve(response.data);
            } else if (status === 'error') {
              reject(Error(response.info));
            } else {
              console.log('strange message from /ws/utils', response);
              reject(Error('strange message from /ws/utils'));
            }
          }
        }
      );
      const args = ['get_convex_hull', data.byteLength];
      this.ws.send(args.join(' '));
    });
  };
}

let singleton: UtilsWebSocket = null;

const getUtilWS = (): UtilsWebSocket => {
  singleton = singleton || new UtilsWebSocket();
  return singleton;
};

export default getUtilWS;
