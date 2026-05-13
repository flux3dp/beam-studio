import type InsecureWebsocket from '@core/helpers/InsecureWebsocket';

export const toSslIpHostname = (ip: string): string => `${ip.replaceAll('.', '-')}.sslip.flux3dp.com`;

const DEFAULT_TIMEOUT_MS = 10000;

type Socket = InsecureWebsocket | WebSocket;

export interface RaceWebSocketsOptions {
  /** Factory for the fallback socket (e.g. WS). Null if construction fails. */
  createFallback: () => null | Socket;
  /** Factory for the preferred socket (e.g. WSS). Null if construction fails. */
  createPreferred: () => null | Socket;
  /** Called when both sockets fail */
  onAllFailed: () => void;
  /** Called when a winner connects */
  onSettled: (winner: Socket, isPreferred: boolean, openEvent: Event | null) => void;
  /** Timeout — preferred gets this window to connect; when expired, settle with fallback if ready, otherwise fail. Omit if caller manages timeout externally. */
  timeoutMs?: number;
}

export interface RaceWebSocketsResult {
  cancel: () => void;
  fallbackSocket: null | Socket;
  preferredSocket: null | Socket;
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
 * Race two WebSocket connections (e.g. WS vs WSS), returning the winner and cleaning up the loser. Handles various edge cases around connection failures and timeouts.
 */
export const raceWebSockets = (options: RaceWebSocketsOptions): RaceWebSocketsResult => {
  const { createFallback, createPreferred, onAllFailed, onSettled, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  let preferredSocket: null | Socket = null;
  let fallbackSocket: null | Socket = null;

  try {
    preferredSocket = createPreferred();
  } catch {
    // Construction failed
  }

  try {
    fallbackSocket = createFallback();
  } catch {
    // Construction failed
  }

  if (!preferredSocket && !fallbackSocket) {
    onAllFailed();

    return { cancel: noop, fallbackSocket: null, preferredSocket: null };
  }

  let settled = false;
  let fallbackOpenEvent: Event | null = null;
  let timeoutId: NodeJS.Timeout | undefined;

  const settleWith = (winner: Socket, isPreferred: boolean, openEvent: Event | null) => {
    if (settled) return;

    settled = true;
    clearTimeout(timeoutId);
    cleanupSocket(isPreferred ? fallbackSocket : preferredSocket);
    onSettled(winner, isPreferred, openEvent);
  };

  const handleAllFailed = () => {
    if (settled) return;

    settled = true;
    clearTimeout(timeoutId);
    cleanupSocket(preferredSocket);
    cleanupSocket(fallbackSocket);
    onAllFailed();
  };

  const cancel = () => {
    if (settled) return;

    settled = true;
    clearTimeout(timeoutId);
    cleanupSocket(preferredSocket);
    cleanupSocket(fallbackSocket);
  };

  // Single timeout — preferred gets this window; when expired, settle with fallback if ready, otherwise fail
  if (timeoutMs != null) {
    timeoutId = setTimeout(() => {
      if (fallbackOpenEvent && fallbackSocket) {
        settleWith(fallbackSocket, false, fallbackOpenEvent);
      } else {
        handleAllFailed();
      }
    }, timeoutMs);
  }

  // Preferred handlers — can win at any time before settlement
  if (preferredSocket) {
    preferredSocket.onopen = (e) => {
      settleWith(preferredSocket!, true, e);
    };

    preferredSocket.onerror = () => {
      preferredSocket = null;

      if (fallbackOpenEvent && fallbackSocket) {
        // Early settle if preferred fails after fallback is already open
        settleWith(fallbackSocket, false, fallbackOpenEvent);
      } else if (!fallbackSocket) {
        // Otherwise, if no fallback to wait for, fail immediately
        handleAllFailed();
      }
    };

    preferredSocket.onclose = () => {
      if (!preferredSocket) return;

      preferredSocket = null;

      if (fallbackOpenEvent && fallbackSocket) {
        // Early settle if preferred fails after fallback is already open
        settleWith(fallbackSocket, false, fallbackOpenEvent);
      } else if (!fallbackSocket) {
        // Otherwise, if no fallback to wait for, fail immediately
        handleAllFailed();
      }
    };
  }

  // Fallback handlers — can only settle after preferred fails (or timeout expires)
  if (fallbackSocket) {
    fallbackSocket.onopen = (e) => {
      fallbackOpenEvent = e;

      if (!preferredSocket) {
        // Settle immediately if preferred already failed, otherwise wait for preferred to fail or timeout
        settleWith(fallbackSocket!, false, e);
      }
      // else: preferred still trying, wait for timeout or preferred result
    };

    fallbackSocket.onerror = () => {
      fallbackSocket = null;

      if (!preferredSocket) handleAllFailed();
    };

    fallbackSocket.onclose = () => {
      if (!fallbackSocket) return;

      fallbackSocket = null;

      if (!preferredSocket) handleAllFailed();
    };
  }

  return { cancel, fallbackSocket, preferredSocket };
};
