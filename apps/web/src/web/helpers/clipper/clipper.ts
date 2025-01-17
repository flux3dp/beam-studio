/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import EventEmitter from 'eventemitter3';

import ClipperWorker from './clipper.worker';
import getClipperLib from './getClipperLib';

class ClipperBase extends EventEmitter {
  worker: Worker | null;

  workerMsgId = 0;

  instance: any;

  type: 'offset' | 'clipper';

  constructor(type: 'offset' | 'clipper', ...args: any[]) {
    super();
    this.type = type;
    if (window.Worker) {
      this.worker = new ClipperWorker();
      this.worker.onmessage = (e) => {
        console.log('ClipperBase Worker Message:', e.data);
        const { id, data } = e.data;
        this.emit(`message_${id}`, data);
      };
      this.worker.onerror = (e) => {
        this.emit(`error_${this.workerMsgId}`, e);
      };
      if (type === 'offset') this.worker.postMessage({ cmd: 'initOffset', data: { args } });
      else this.worker.postMessage({ cmd: 'initClipper', data: { args } });
    } else {
      const ClipperLib = getClipperLib();
      if (type === 'offset') this.instance = new ClipperLib.ClipperOffset(...args);
      else this.instance = new ClipperLib.Clipper(...args);
    }
  }

  sendMessageToWorker = async (cmd: string, data: any): Promise<any> => {
    if (!this.worker) return null;
    this.workerMsgId += 1;
    const id = this.workerMsgId;
    const response = await new Promise((resolve) => {
      this.once(`message_${id}`, resolve);
      this.worker.postMessage({ id, cmd, data });
    });
    return response;
  };

  addPaths = async (path: any, joinType: any, endType: any): Promise<any> => {
    if (this.worker) {
      await this.sendMessageToWorker('addPaths', { path, joinType, endType });
      return;
    }
    this.instance.AddPaths(path, joinType, endType);
  };

  execute = async (...args): Promise<any> => {
    if (this.worker) {
      const res = await this.sendMessageToWorker('execute', { args });
      return res;
    }
    this.instance.Execute(args);
    const res = this.type === 'offset' ? args[0] : args[1];
    return res;
  };

  terminate = () => {
    if (this.worker) this.worker.terminate();
  };
}

export default ClipperBase;
