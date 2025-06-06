export interface ICommunicator {
  off(channel: string, listener: any): void;
  on(channel: string, listener: any): void;
  once(channel: string, listener: any): void;
  send(channel: string, ...args: any[]): void;
  sendSync(channel: string, ...args: any[]): any;
}
