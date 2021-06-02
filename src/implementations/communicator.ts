/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/no-extraneous-dependencies */
import electron from 'electron';
import { ICommunicator } from 'interfaces/ICommunicator';

export default {
  on(channel: string, listener: any) {
    electron.ipcRenderer.on(channel, listener);
  },
  once(channel: string, listener: any) {
    electron.ipcRenderer.once(channel, listener);
  },
  send(channel: string, ...args: any[]) {
    electron.ipcRenderer.send(channel, ...args);
  },
  sendSync(channel: string, ...args: any[]) {
    return electron.ipcRenderer.sendSync(channel, ...args);
  },
} as ICommunicator;
