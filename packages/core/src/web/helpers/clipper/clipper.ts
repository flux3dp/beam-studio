import { EventEmitter } from 'eventemitter3';

import getClipperLib from './getClipperLib';

class ClipperBase extends EventEmitter {
  worker: null | Worker;

  workerMsgId = 0;

  instance: any;

  type: 'clipper' | 'offset';

  constructor(type: 'clipper' | 'offset', ...args: any[]) {
    super();
    this.type = type;

    if (window.Worker) {
      this.worker = new Worker(
        new URL(/* webpackChunkName: "clipper.worker" */ './clipper.worker.ts', import.meta.url),
      );
      this.worker.onmessage = (e) => {
        console.log('ClipperBase Worker Message:', e.data);

        const { data, id } = e.data;

        this.emit(`message_${id}`, data);
      };
      this.worker.onerror = (e) => {
        this.emit(`error_${this.workerMsgId}`, e);
      };

      if (type === 'offset') {
        this.worker.postMessage({ cmd: 'initOffset', data: { args } });
      } else {
        this.worker.postMessage({ cmd: 'initClipper', data: { args } });
      }
    } else {
      const ClipperLib = getClipperLib();

      if (type === 'offset') {
        this.instance = new ClipperLib.ClipperOffset(...args);
      } else {
        this.instance = new ClipperLib.Clipper(...args);
      }
    }
  }

  sendMessageToWorker = async (cmd: string, data: any): Promise<any> => {
    if (!this.worker) {
      return null;
    }

    this.workerMsgId += 1;

    const id = this.workerMsgId;
    const response = await new Promise((resolve) => {
      this.once(`message_${id}`, resolve);
      this.worker.postMessage({ cmd, data, id });
    });

    return response;
  };

  addPaths = async (path: any, joinType: any, endType: any): Promise<any> => {
    if (this.worker) {
      await this.sendMessageToWorker('addPaths', { endType, joinType, path });

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
    if (this.worker) {
      this.worker.terminate();
    }
  };
}

export default ClipperBase;
