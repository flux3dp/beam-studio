export type Option = Partial<{
  hostname: string;
  port: string;
  method: string;
  autoReconnect: boolean;
  onMessage: (data: any) => void;
  onOpen: (data: any) => void;
  onClose: (data: any) => void;
  onError: (error: any) => void;
  onFatal: (error: any) => void;
}>;

export interface WrappedWebSocket {
  currentState: number;
  url: string;
  log: string[];
  send: (data: string | Blob | ArrayBuffer) => WrappedWebSocket;
  close: (reconnect?: boolean) => void;
  setOnMessage: (onMessage: (data: any) => void) => WrappedWebSocket;
}
