/* eslint-disable import/no-extraneous-dependencies */
import electron from 'electron';
import { ICommunicator } from 'interfaces/ICommunicator';

export default {
  // eslint-disable-next-line @typescript-eslint/ban-types
  on(channel: string, listener: any) {
    electron.ipcRenderer.on(channel, listener);
  },
  send(channel: string, ...args: any[]) {
    electron.ipcRenderer.send(channel, ...args);
  },
} as ICommunicator;
