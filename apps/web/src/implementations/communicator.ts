import { EventEmitter } from 'eventemitter3';

import type { ICommunicator } from '@core/interfaces/ICommunicator';

export const listener = new EventEmitter();
export const sender = new EventEmitter();
export default {
  async invoke(channel: string, ...args: any[]): Promise<any> {
    // Web shim: synchronous since there is no IPC bridge.
    // Handlers must set res.returnValue synchronously.
    const res = { returnValue: null as any };

    sender.emit(channel, res, ...args);

    return Promise.resolve(res.returnValue);
  },
  off(channel: string, handler: any): void {
    listener.off(channel, handler);
  },
  on(channel: string, handler: any): void {
    listener.on(channel, handler);
  },
  once(channel: string, handler: any): void {
    listener.once(channel, handler);
  },
  send(channel: string, ...args: any[]): void {
    sender.emit(channel, ...args);
  },
  sendSync(channel: string, ...args: any[]) {
    const res = { returnValue: null };

    sender.emit(channel, res, ...args);

    return res.returnValue;
  },
} as ICommunicator;
