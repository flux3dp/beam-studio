import { EventEmitter } from 'eventemitter3';

import getClipperLib from './getClipperLib';

class ClipperBase extends EventEmitter {
  worker: null | Worker = null;

  workerMsgId = 0;

  instance: any;

  type: 'clipper' | 'offset';

  initialized: Promise<void>;

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

      const cmd = type === 'offset' ? 'initOffset' : 'initClipper';

      this.initialized = this.sendMessageToWorker(cmd, { args });
    } else {
      const ClipperLib = getClipperLib();

      if (type === 'offset') {
        this.instance = new ClipperLib.ClipperOffset(...args);
      } else {
        this.instance = new ClipperLib.Clipper(...args);
      }

      this.initialized = Promise.resolve();
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
      this.worker?.postMessage({ cmd, data, id });
    });

    return response;
  };

  addPaths = async (path: any, joinType: any, endType: any): Promise<any> => {
    await this.initialized;

    if (this.worker) {
      await this.sendMessageToWorker('addPaths', { endType, joinType, path });

      return;
    }

    this.instance.AddPaths(path, joinType, endType);
  };

  execute = async (...args: any): Promise<any> => {
    await this.initialized;

    if (this.worker) {
      return this.sendMessageToWorker('execute', { args });
    }

    this.instance.Execute(args);

    return this.type === 'offset' ? args[0] : args[1];
  };

  terminate = () => {
    if (this.worker) {
      this.worker.terminate();
    }
  };
}

export default ClipperBase;
