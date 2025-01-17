/* eslint-disable no-console */
import EventEmitter from 'eventemitter3';

import Websocket from 'helpers/websocket';

class OpenCVWebSocket extends EventEmitter {
  private ws: any;

  constructor() {
    super();
    this.ws = Websocket({
      method: 'opencv',
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

  removeCommandListeners(): void {
    this.removeAllListeners('message');
    this.removeAllListeners('error');
    this.removeAllListeners('fatal');
  }

  setDefaultErrorResponse(reject: (reason?) => void, timeoutTimer?: NodeJS.Timeout): void {
    this.on('error', (response) => {
      if (timeoutTimer) clearTimeout(timeoutTimer);
      this.removeCommandListeners();
      reject(response);
    });
  }

  setDefaultFatalResponse(reject: (reason?) => void, timeoutTimer?: NodeJS.Timeout): void {
    this.on('fatal', (response) => {
      if (timeoutTimer) clearTimeout(timeoutTimer);
      this.removeCommandListeners();
      reject(response);
    });
  }

  async uploadUrl(url: string): Promise<{ [key: string]: string }> {
    const resp = await fetch(url);
    const blob = await resp.blob();
    const data = await blob.arrayBuffer();
    const res = await this.upload(data, url);
    return res;
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
          console.log('strange message from /ws/opencv', response);
        }
      });
      this.ws.send(`upload ${url} ${data.byteLength}`);
    });
  }

  sharpen(imgUrl: string, sharpness: number, radius: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
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
  }
}

export default OpenCVWebSocket;
