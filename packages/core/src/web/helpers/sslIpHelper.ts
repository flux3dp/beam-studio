import checkIPFormat from '@core/helpers/check-ip-format';
import InsecureWebsocket, { checkFluxTunnel } from '@core/helpers/InsecureWebsocket';
import isWeb from '@core/helpers/is-web';

export const toSslIpHostname = (ip: string): string => `${ip.replaceAll('.', '-')}.sslip.flux3dp.com`;

const WSS_PORT = 8443;
const DEFAULT_TIMEOUT_MS = 10000;

type Socket = InsecureWebsocket | WebSocket;

export interface ConnectWebSocketOptions {
  hostname: string;
  method: string;
  /** Called when both sockets fail */
  onFailed: () => void;
  /** Called when a winner connects */
  onSettled: (winner: Socket, openEvent: Event | null) => void;
  port: number | string;
  /** Timeout — WSS gets this window to connect; when expired, settle with WS if ready, otherwise fail. */
  timeoutMs?: number;
}

export interface ConnectWebSocketResult {
  cancel: () => void;
  wsSocket: null | Socket;
  wssSocket: null | Socket;
}

const noop = () => {};

const cleanupSocket = (socket: null | Socket) => {
  if (!socket) return;

  socket.onopen = null;
  socket.onerror = null;
  socket.onclose = null;
  socket.onmessage = null;

  try {
    socket.close();
  } catch {
    // Ignore close errors
  }
};

/**
 * Connect via WebSocket, racing WSS (via sslip) against plain WS.
 * WSS is preferred and gets a timeout window; if it doesn't connect in time,
 * falls back to WS if already open, otherwise reports failure.
 */
export const connectWebSocket = (options: ConnectWebSocketOptions): ConnectWebSocketResult => {
  const { hostname, method, onFailed, onSettled, port, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  const useWss = checkIPFormat(hostname);
  const wsUrl = `ws://${hostname}:${port}/ws/${method}`;
  const WebSocketClass =
    isWeb() && window.location.protocol === 'https:' && checkFluxTunnel() ? InsecureWebsocket : WebSocket;

  let wssSocket: null | Socket = null;
  let wsSocket: null | Socket = null;

  if (useWss) {
    const wssUrl = `wss://${toSslIpHostname(hostname)}:${WSS_PORT}/ws/${method}`;

    try {
      wssSocket = new WebSocket(wssUrl);
    } catch {
      // Construction failed
    }
  }

  try {
    wsSocket = new WebSocketClass(wsUrl);
  } catch {
    // Construction failed
  }

  if (!wssSocket && !wsSocket) {
    onFailed();

    return { cancel: noop, wsSocket: null, wssSocket: null };
  }

  let settled = false;
  let wsOpenEvent: Event | null = null;
  let timeoutId: NodeJS.Timeout | undefined;

  const settleWith = (winner: Socket, isWss: boolean, openEvent: Event | null) => {
    if (settled) return;

    settled = true;
    clearTimeout(timeoutId);
    console.log(`WebSocket ${method} connected via ${isWss ? 'WSS' : 'WS'}`);
    cleanupSocket(isWss ? wsSocket : wssSocket);
    onSettled(winner, openEvent);
  };

  const handleAllFailed = () => {
    if (settled) return;

    settled = true;
    clearTimeout(timeoutId);
    cleanupSocket(wssSocket);
    cleanupSocket(wsSocket);
    onFailed();
  };

  const cancel = () => {
    if (settled) return;

    settled = true;
    clearTimeout(timeoutId);
    cleanupSocket(wssSocket);
    cleanupSocket(wsSocket);
  };

  // Single timeout — WSS gets this window; when expired, settle with WS if ready, otherwise fail
  if (timeoutMs != null) {
    timeoutId = setTimeout(() => {
      if (wsOpenEvent && wsSocket) {
        settleWith(wsSocket, false, wsOpenEvent);
      } else {
        handleAllFailed();
      }
    }, timeoutMs);
  }

  // WSS handlers — can win at any time before settlement
  if (wssSocket) {
    wssSocket.onopen = (e) => {
      settleWith(wssSocket!, true, e);
    };

    wssSocket.onerror = () => {
      wssSocket = null;

      if (wsOpenEvent && wsSocket) {
        settleWith(wsSocket, false, wsOpenEvent);
      } else if (!wsSocket) {
        handleAllFailed();
      }
    };

    wssSocket.onclose = () => {
      if (!wssSocket) return;

      wssSocket = null;

      if (wsOpenEvent && wsSocket) {
        settleWith(wsSocket, false, wsOpenEvent);
      } else if (!wsSocket) {
        handleAllFailed();
      }
    };
  }

  // WS handlers — can only settle after WSS fails (or timeout expires)
  if (wsSocket) {
    wsSocket.onopen = (e) => {
      wsOpenEvent = e;

      if (!wssSocket) {
        settleWith(wsSocket!, false, e);
      }
    };

    wsSocket.onerror = () => {
      wsSocket = null;

      if (!wssSocket) handleAllFailed();
    };

    wsSocket.onclose = () => {
      if (!wsSocket) return;

      wsSocket = null;

      if (!wssSocket) handleAllFailed();
    };
  }

  return { cancel, wsSocket, wssSocket };
};
