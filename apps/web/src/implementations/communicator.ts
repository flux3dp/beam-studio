import EventEmitter from 'eventemitter3';

import { ICommunicator } from 'core-interfaces/ICommunicator';

export const listener = new EventEmitter();
export const sender = new EventEmitter();
export default {
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
