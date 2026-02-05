import type { IpcEventType } from '@core/app/constants/ipcEvents';

export interface ICommunicator {
  invoke(channel: IpcEventType, ...args: any[]): Promise<any>;
  off(channel: IpcEventType | string, listener: (...args: any[]) => void): void;
  on(channel: IpcEventType | string, listener: (...args: any[]) => void): void;
  once(channel: IpcEventType | string, listener: (...args: any[]) => void): void;
  send(channel: IpcEventType, ...args: any[]): void;
  /** @deprecated Prefer `invoke` for new IPC calls. */
  sendSync(channel: IpcEventType, ...args: any[]): any;
}
