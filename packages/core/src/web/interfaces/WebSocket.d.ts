export type Option = Partial<{
  autoReconnect: boolean;
  hostname: string;
  method: string;
  onClose: (data: any) => void;
  onError: (error: any) => void;
  onFatal: (error: any) => void;
  onMessage: (data: any) => void;
  onOpen: (data: any) => void;
  port: string;
}>;

export interface WrappedWebSocket {
  close: (reconnect?: boolean) => void;
  currentState: number;
  log: string[];
  send: (data: ArrayBuffer | Blob | string) => WrappedWebSocket;
  setOnMessage: (onMessage: (data: any) => void) => WrappedWebSocket;
  url: string;
}
