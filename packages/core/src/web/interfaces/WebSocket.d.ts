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
  /**
   * `reconnect` replaces `autoReconnect`. `false` closes for good: a handshake still running is dropped as soon as
   * it opens, queued sends are discarded and the keep-alive ping stops; the wrapper cannot be opened again.
   */
  close: (reconnect?: boolean) => void;
  currentState: number;
  log: string[];
  send: (data: ArrayBuffer | Blob | string) => WrappedWebSocket;
  setOnMessage: (onMessage: (data: any) => void) => WrappedWebSocket;
  url: string;
}
