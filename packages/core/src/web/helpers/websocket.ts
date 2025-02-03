import Alert from '@core/app/actions/alert-caller';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import AlertConstants from '@core/app/constants/alert-constants';
import blobSegments from '@core/helpers/blob-segments';
import i18n from '@core/helpers/i18n';
import InsecureWebsocket, { checkFluxTunnel } from '@core/helpers/InsecureWebsocket';
import isJson from '@core/helpers/is-json';
import isWeb from '@core/helpers/is-web';
import Logger from '@core/helpers/logger';
import outputError from '@core/helpers/output-error';
import type { Option, WrappedWebSocket } from '@core/interfaces/WebSocket';

window.FLUX.websockets = [];
window.FLUX.websockets.list = () => {
  window.FLUX.websockets.forEach((conn, i) => {
    console.log(i, conn.url);
  });
};

const WsLogger = Logger('websocket');
const logLimit = 100;
let wsErrorCount = 0;
let wsCreateFailedCount = 0;

// options:
//      hostname      - host name (Default: 127.0.0.1)
//      port          - what protocol uses (Default: 8000)
//      method        - method be called
//      autoReconnect - auto reconnect on close
//      onMessage     - fired on receive message
//      onError       - fired on a normal error happend
//      onFatal       - fired on a fatal error closed
//      onClose       - fired on connection closed
//      onOpen        - fired on connection connecting
export default (options: Option): WrappedWebSocket => {
  const defaultCallback = () => {};
  const defaultOptions = {
    autoReconnect: true,
    get hostname() {
      return localStorage.getItem('host') || '127.0.0.1';
    },
    method: '',
    onClose: defaultCallback,
    onError: defaultCallback,
    onFatal: defaultCallback,
    onMessage: defaultCallback,
    onOpen: defaultCallback,
    get port() {
      if (localStorage.getItem('port')) {
        return localStorage.getItem('port');
      }

      return isWeb() ? '8000' : window.FLUX.ghostPort;
    },
  };
  let ws: InsecureWebsocket | null | WebSocket = null;
  const trimMessage = (origMessage: string): string => {
    const message = origMessage.replace(/"/g, '');

    if (message.length > 200) {
      return `${message.substr(0, 200)}...`;
    }

    return message;
  };
  const origanizeOptions = (opts: Option) => {
    const keys = Object.keys(defaultOptions) as Array<keyof Option>;
    const newOpts = { ...opts };

    for (let i = 0; i < keys.length; i += 1) {
      const name = keys[i];

      if (!['hostname', 'port'].includes(name) && typeof opts[name] === 'undefined') {
        newOpts[name] = defaultOptions[name];
      }
    }

    return newOpts;
  };
  const socketOptions = origanizeOptions(options);
  const wsLog: { log: string[]; url: string } = {
    log: [],
    url: `/ws/${options.method}`,
  };
  const handleCreateWebSocketFailed = () => {
    wsCreateFailedCount += 1;

    if (wsCreateFailedCount === 100 && !isWeb()) {
      const LANG = i18n.lang.beambox.popup;

      Alert.popById('backend-error');
      Alert.popUp({
        buttonType: AlertConstants.YES_NO,
        id: 'backend-error',
        message: LANG.backend_connect_failed_ask_to_upload,
        onYes: () => {
          outputError.uploadBackendErrorLog();
        },
        type: AlertConstants.SHOW_POPUP_ERROR,
      });
      MessageCaller.openMessage({
        content: LANG.backend_error_hint,
        duration: 0,
        key: 'backend-error-hint',
        level: MessageLevel.ERROR,
        onClick: () => MessageCaller.closeMessage('backend-error-hint'),
      });
    }
  };

  const createWebSocket = (createWsOpts: Option) => {
    if (ws) {
      if (ws.readyState === WebSocket.CONNECTING) {
        return ws;
      }

      if (ws.readyState !== WebSocket.CLOSED) {
        ws.close();
      }
    }

    const hostName = createWsOpts.hostname || defaultOptions.hostname;
    const port = createWsOpts.port || defaultOptions.port;
    const url = `ws://${hostName}:${port}/ws/${createWsOpts.method}`;

    if (port === undefined) {
      handleCreateWebSocketFailed();

      return null;
    }

    const WebSocketClass =
      isWeb() && window.location.protocol === 'https:' && checkFluxTunnel() ? InsecureWebsocket : WebSocket;
    let nodeWs: InsecureWebsocket | WebSocket;

    try {
      nodeWs = new WebSocketClass(url);
    } catch (error) {
      console.error('Failed to create websocket', error);
      handleCreateWebSocketFailed();

      return null;
    }
    wsCreateFailedCount = 0;

    nodeWs.onerror = () => {
      wsErrorCount += 1;

      // If ws error count exceed certian number Alert user there may be problems with backend
      if (wsErrorCount === 50 && !isWeb()) {
        const LANG = i18n.lang.beambox.popup;

        Alert.popById('backend-error');
        Alert.popUp({
          buttonType: AlertConstants.YES_NO,
          id: 'backend-error',
          message: LANG.backend_connect_failed_ask_to_upload,
          onYes: () => {
            outputError.uploadBackendErrorLog();
          },
          type: AlertConstants.SHOW_POPUP_ERROR,
        });
        MessageCaller.openMessage({
          content: LANG.backend_error_hint,
          duration: 0,
          key: 'backend-error-hint',
          level: MessageLevel.ERROR,
          onClick: () => MessageCaller.closeMessage('backend-error-hint'),
        });
      }
    };

    nodeWs.onopen = (e) => {
      socketOptions.onOpen?.(e);
      wsErrorCount = 0;
      MessageCaller.closeMessage('backend-error-hint');
    };

    nodeWs.onmessage = (result: MessageEvent) => {
      let data = isJson(result.data) ? JSON.parse(result.data) : result.data;
      let errorStr = '';
      let skipError = false;

      if (!(result.data instanceof Blob)) {
        const message = trimMessage(['<', result.data].join(' '));

        wsLog.log.push(message);
      } else {
        // Blob, not stringifiable
        const message = trimMessage(`< Blob, size: ${result.data.size}`);

        wsLog.log.push(message);
      }

      while (wsLog.log.length >= logLimit) {
        wsLog.log.shift();
      }

      if (typeof data === 'string') {
        data = data.replace(/\\/g, '\\\\');
        data = data.replace(/\bNaN\b/g, 'null');
        data = data.replace(/\r?\n|\r/g, ' ');
        data = isJson(data) === true ? JSON.parse(data) : data;
      }

      switch (data.status) {
        case 'error':
          errorStr = data instanceof Object ? data.error : '';
          skipError = false;

          if (data instanceof Object && Array.isArray(data.error)) {
            errorStr = data.error.join('_');
          }

          if (errorStr === 'NOT_EXIST_BAD_NODE') {
            skipError = true;
          }

          if (window.FLUX.allowTracking && !skipError) {
            // window.Raven.captureException(data);
            console.error('WS_ERROR', errorStr);
          }

          socketOptions.onError?.(data);
          break;
        case 'fatal':
          errorStr = data instanceof Object ? data.error : '';
          skipError = false;

          if (data instanceof Object && Array.isArray(data.error)) {
            errorStr = data.error.join('_');
          }

          if (errorStr === 'AUTH_ERROR') {
            skipError = true;
          }

          // if identify error, reconnect again
          if (errorStr === 'REMOTE_IDENTIFY_ERROR') {
            setTimeout(() => {
              ws = createWebSocket(createWsOpts);
            }, 1000);

            return;
          }

          if (window.FLUX.allowTracking && !skipError) {
            // window.Raven.captureException(data);
            console.error('WS_FATAL', errorStr);
          }

          socketOptions.onFatal?.(data);
          break;
        // ignore below status
        case 'pong':
          break;
        default:
          socketOptions.onMessage?.(data);
          break;
      }
    };

    nodeWs.onclose = (result: CloseEvent) => {
      socketOptions.onClose?.(result);

      // The connection was closed abnormally without sending or receving data
      // ref: http://tools.ietf.org/html/rfc6455#section-7.4.1
      if (result.code === 1006) {
        wsLog.log.push('**abnormal disconnection**');
        socketOptions.onFatal?.(result);
      }

      if (socketOptions.autoReconnect === true) {
        ws = createWebSocket(createWsOpts);
      } else {
        ws = null; // release
      }
    };

    return nodeWs;
  };

  let timer: NodeJS.Timeout;
  const keepAlive = () => {
    if (timer) {
      clearInterval(timer);
    }

    timer = setInterval(() => {
      if (ws?.readyState === WebSocket.OPEN) {
        sender('ping');
      }
    }, 60 * 1000 /* ms */);
  };

  keepAlive();

  const sender = (data: Blob | string) => {
    wsLog.log.push(trimMessage(['>', data, typeof data].join(' ')));

    if (data instanceof Blob === true) {
      blobSegments(data, (chunk) => {
        ws?.send(chunk);
      });
    } else {
      ws?.send(data);
    }

    keepAlive();
  };

  const initWebSocket = () => {
    ws = createWebSocket(socketOptions);

    if (!ws && socketOptions.autoReconnect) {
      setTimeout(() => {
        initWebSocket();
      }, 100);
    }
  };

  initWebSocket();

  const wsobj = {
    close(reconnect?: boolean) {
      if (typeof reconnect === 'boolean') {
        socketOptions.autoReconnect = reconnect;
      }

      if (ws !== null && ws.readyState !== WebSocket.CLOSED) {
        ws.close();
      }
    },
    get currentState() {
      return ws?.readyState ?? WebSocket.CLOSED;
    },
    log: wsLog.log,
    options: socketOptions,
    send(data: string) {
      if (!ws || ws === null || ws?.readyState === WebSocket.CLOSING || ws?.readyState === WebSocket.CLOSED) {
        ws = createWebSocket(socketOptions);
      }

      if (ws?.readyState === WebSocket.CONNECTING) {
        ws.onopen = (e) => {
          socketOptions.onOpen?.(e);
          sender(data);
        };
      } else {
        sender(data);
      }

      return wsobj;
    },
    setOnMessage(callback: (evt: MessageEvent) => void) {
      socketOptions.onMessage = callback;

      return wsobj;
    },
    url: `/ws/${options.method}`,
  };

  window.FLUX.websockets.push(wsobj);

  WsLogger.append(wsLog);

  return wsobj;
};
