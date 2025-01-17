import EventEmitter from 'eventemitter3';

import arrayBuffer from 'helpers/arrayBuffer';
import Websocket from 'helpers/websocket';
import { FisheyeCameraParameters, PerspectiveGrid } from 'interfaces/FisheyePreview';
import { WrappedWebSocket } from 'interfaces/WebSocket';

class CameraTransformAPI extends EventEmitter {
  private ws: WrappedWebSocket;

  constructor() {
    super();
    this.ws = Websocket({
      method: 'camera-transform',
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

  setFisheyeParam = async (param: FisheyeCameraParameters): Promise<boolean> => {
    const data = JSON.stringify(param, (key, val) => {
      if (typeof val === 'number') {
        return Math.round(val * 1e6) / 1e6;
      }
      return val;
    });
    return new Promise<boolean>((resolve, reject) => {
      this.removeCommandListeners();
      this.setDefaultErrorResponse(reject);
      this.setDefaultFatalResponse(reject);
      this.on('message', (response: { [key: string]: string }) => {
        const { status } = response;
        if (status === 'ok') {
          this.removeCommandListeners();
          resolve(true);
        } else {
          console.error('Failed to set fisheye matrix', response);
          resolve(false);
        }
      });
      this.ws.send(`set_fisheye_matrix ${data}`);
    });
  };

  setFisheyeGrid = async (grid: PerspectiveGrid): Promise<boolean> => {
    const data = JSON.stringify(grid);
    return new Promise<boolean>((resolve, reject) => {
      this.removeCommandListeners();
      this.setDefaultErrorResponse(reject);
      this.setDefaultFatalResponse(reject);
      this.on('message', (response: { [key: string]: string }) => {
        const { status } = response;
        if (status === 'ok') {
          this.removeCommandListeners();
          resolve(true);
        } else {
          console.error('Failed to set fisheye matrix', response);
          resolve(false);
        }
      });
      this.ws.send(`set_fisheye_grid ${data}`);
    });
  };

  transformImage = async (image: Blob): Promise<Blob> => {
    const data = await arrayBuffer(image);
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
      this.ws.send(`transform_image ${data.byteLength}`);
    });
  };

  close = (): void => {
    this.ws.close(false);
  };
}

export default CameraTransformAPI;
