import alertCaller from '@core/app/actions/alert-caller';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import alertConstants from '@core/app/constants/alert-constants';
import blobSegments from '@core/helpers/blob-segments';
import i18n from '@core/helpers/i18n';
import type InsecureWebsocket from '@core/helpers/InsecureWebsocket';
import isJson from '@core/helpers/is-json';
import isWeb from '@core/helpers/is-web';
import Logger from '@core/helpers/logger';
import outputError from '@core/helpers/output-error';
import { connectWebSocket } from '@core/helpers/sslIpHelper';
import storage from '@core/implementations/storage';
import type { Option, WrappedWebSocket } from '@core/interfaces/WebSocket';

const WsLogger = Logger('websocket');
const logLimit = 100;
let wsErrorCount = 0;
let wsCreateFailedCount = 0;
let WS_ERROR_ALERT_THRESHOLD = 50;
let CREATE_FAILED_ALERT_THRESHOLD = 200;

export const setCurrentVersion = (version: string): void => {
  // Make sure this is called before beambox init write last-installed-version'
  if (!isWeb() && version !== storage.get('last-installed-version')) {
    WS_ERROR_ALERT_THRESHOLD *= 2;
    CREATE_FAILED_ALERT_THRESHOLD *= 2;
  }
};

// options:
//      hostname      - host name (Default: 127.0.0.1)
//      port          - what protocol uses (Default: 8000)
//      method        - method be called
//      autoReconnect - auto reconnect on close
//      onMessage     - fired on receive message
//      onError       - fired on a normal error happened
//      onFatal       - fired on a fatal error closed
//      onClose       - fired on connection closed
//      onOpen        - fired on connection connecting
export default (options: Option): WrappedWebSocket => {
  let pendingSends: string[] = [];
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
  const organizeOptions = (opts: Option) => {
    const keys = Object.keys(defaultOptions) as Array<keyof Option>;
    const newOpts = { ...opts };

    for (let i = 0; i < keys.length; i += 1) {
      const name = keys[i];

      if (!['hostname', 'port'].includes(name) && typeof opts[name] === 'undefined') {
        newOpts[name] = defaultOptions[name] as any;
      }
    }

    return newOpts;
  };
  const socketOptions = organizeOptions(options);
  const wsLog: { log: string[]; url: string } = {
    log: [],
    url: `/ws/${options.method}`,
  };
  const handleCreateWebSocketFailed = () => {
    wsCreateFailedCount += 1;

    if (wsCreateFailedCount === CREATE_FAILED_ALERT_THRESHOLD && !isWeb()) {
      const LANG = i18n.lang.beambox.popup;

      alertCaller.popById('backend-error');
      alertCaller.popUp({
        buttonType: alertConstants.YES_NO,
        id: 'backend-error',
        message: LANG.backend_connect_failed_ask_to_upload,
        onYes: () => {
          outputError.uploadBackendErrorLog();
        },
        type: alertConstants.SHOW_POPUP_ERROR,
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

  const attachHandlers = (nodeWs: InsecureWebsocket | WebSocket, createWsOpts: Option) => {
    nodeWs.onerror = () => {
      wsErrorCount += 1;

      // If ws error count exceed certain number Alert user there may be problems with backend
      if (wsErrorCount === WS_ERROR_ALERT_THRESHOLD && !isWeb()) {
        const LANG = i18n.lang.beambox.popup;

        alertCaller.popById('backend-error');
        alertCaller.popUp({
          buttonType: alertConstants.YES_NO,
          id: 'backend-error',
          message: LANG.backend_connect_failed_ask_to_upload,
          onYes: () => {
            outputError.uploadBackendErrorLog();
          },
          type: alertConstants.SHOW_POPUP_ERROR,
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
              createWebSocket(createWsOpts);
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

      // The connection was closed abnormally without sending or receiving data
      // ref: http://tools.ietf.org/html/rfc6455#section-7.4.1
      if (result?.code === 1006) {
        wsLog.log.push('**abnormal disconnection**');
        socketOptions.onFatal?.(result);
      }

      if (socketOptions.autoReconnect === true) {
        createWebSocket(createWsOpts);
      } else {
        ws = null; // release
      }
    };
  };

  let isCreatingWebsocket = false;

  const createWebSocket = (createWsOpts: Option): void => {
    if (isCreatingWebsocket) {
      // A race is already in progress, don't start another
      return;
    }

    if (ws) {
      if (ws.readyState !== WebSocket.CLOSED) {
        ws.close();
      }

      ws = null;
    }

    const hostName = createWsOpts.hostname || defaultOptions.hostname;
    const port = createWsOpts.port || defaultOptions.port;

    if (port === undefined) {
      handleCreateWebSocketFailed();

      return;
    }

    isCreatingWebsocket = true;
    console.log(`Connecting to websocket ws://${hostName}:${port}/ws/${createWsOpts.method}`);
    connectWebSocket({
      hostname: hostName,
      method: createWsOpts.method!,
      onFailed: () => {
        ws = null;
        isCreatingWebsocket = false;
        handleCreateWebSocketFailed();

        if (socketOptions.autoReconnect === true) {
          setTimeout(() => {
            createWebSocket(createWsOpts);
          }, 300);
        }
      },
      onSettled: (socket, openEvent) => {
        ws = socket;
        isCreatingWebsocket = false;
        wsCreateFailedCount = 0;
        wsErrorCount = 0;
        alertCaller.popById('backend-error');
        MessageCaller.closeMessage('backend-error-hint');
        attachHandlers(socket, createWsOpts);
        socketOptions.onOpen?.(openEvent);

        pendingSends.forEach((msg) => sender(msg));
        pendingSends = [];
      },
      port: port!,
    });
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
    console.log('Initializing websocket', socketOptions.method);
    createWebSocket(socketOptions);
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
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        pendingSends.push(data);
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

  WsLogger.append(wsLog);

  return wsobj;
};
