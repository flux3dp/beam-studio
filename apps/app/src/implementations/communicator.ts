import electron from 'electron';

import type { ICommunicator } from '@core/interfaces/ICommunicator';

export default {
  invoke(channel: string, ...args: any[]) {
    return electron.ipcRenderer.invoke(channel, ...args);
  },
  off(channel: string, listener: any) {
    return electron.ipcRenderer.off(channel, listener);
  },
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
