/* eslint-disable no-console */
import Alert from 'app/actions/alert-caller';
import AlertConstants from 'app/constants/alert-constants';
import blobSegments from 'helpers/blob-segments';
import InsecureWebsocket, { checkFluxTunnel } from 'helpers/InsecureWebsocket';
import i18n from 'helpers/i18n';
import isJson from 'helpers/is-json';
import isWeb from 'helpers/is-web';
import Logger from 'helpers/logger';
import MessageCaller, { MessageLevel } from 'app/actions/message-caller';
import outputError from 'helpers/output-error';
import { Option, WrappedWebSocket } from 'interfaces/WebSocket';

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

export const readyStates = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
};

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
    method: '',
    get hostname() {
      return localStorage.getItem('host') || '127.0.0.1';
    },
    get port() {
      if (localStorage.getItem('port')) return localStorage.getItem('port');
      return isWeb() ? '8000' : window.FLUX.ghostPort;
    },
    autoReconnect: true,
    onMessage: defaultCallback,
    onError: defaultCallback,
    onFatal: defaultCallback,
    onClose: defaultCallback,
    onOpen: defaultCallback,
  };
  let ws: WebSocket | InsecureWebsocket = null;
  const trimMessage = (origMessage: string): string => {
    const message = origMessage.replace(/"/g, '');

    if (message.length > 200) {
      return `${message.substr(0, 200)}...`;
    }

    return message;
  };
  const origanizeOptions = (opts) => {
    const keys = Object.keys(defaultOptions);
    const newOpts = { ...opts };
    for (let i = 0; i < keys.length; i += 1) {
      const name = keys[i];
      if (!['port', 'hostname'].includes(name) && typeof opts[name] === 'undefined') {
        newOpts[name] = defaultOptions[name];
      }
    }

    return newOpts;
  };
  const socketOptions = origanizeOptions(options);
  const wsLog: { url: string; log: string[] } = {
    url: `/ws/${options.method}`,
    log: [],
  };
  const handleCreateWebSocketFailed = () => {
    wsCreateFailedCount += 1;
    if (wsCreateFailedCount === 100 && !isWeb()) {
      const LANG = i18n.lang.beambox.popup;
      Alert.popById('backend-error');
      Alert.popUp({
        id: 'backend-error',
        type: AlertConstants.SHOW_POPUP_ERROR,
        message: LANG.backend_connect_failed_ask_to_upload,
        buttonType: AlertConstants.YES_NO,
        onYes: () => {
          outputError.uploadBackendErrorLog();
        },
      });
      MessageCaller.openMessage({
        key: 'backend-error-hint',
        content: LANG.backend_error_hint,
        level: MessageLevel.ERROR,
        duration: 0,
        onClick: () => MessageCaller.closeMessage('backend-error-hint'),
      });
    }
  };

  const createWebSocket = (createWsOpts) => {
    if (ws && ws.readyState !== readyStates.CLOSED) ws.close();

    const hostName = createWsOpts.hostname || defaultOptions.hostname;
    const port = createWsOpts.port || defaultOptions.port;
    const url = `ws://${hostName}:${port}/ws/${createWsOpts.method}`;
    if (port === undefined) {
      handleCreateWebSocketFailed();
      return null;
    }
    const WebSocketClass =
      isWeb() && window.location.protocol === 'https:' && checkFluxTunnel()
        ? InsecureWebsocket
        : WebSocket;
    let nodeWs: WebSocket | InsecureWebsocket;
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
          id: 'backend-error',
          type: AlertConstants.SHOW_POPUP_ERROR,
          message: LANG.backend_connect_failed_ask_to_upload,
          buttonType: AlertConstants.YES_NO,
          onYes: () => {
            outputError.uploadBackendErrorLog();
          },
        });
        MessageCaller.openMessage({
          key: 'backend-error-hint',
          content: LANG.backend_error_hint,
          level: MessageLevel.ERROR,
          duration: 0,
          onClick: () => MessageCaller.closeMessage('backend-error-hint'),
        });
      }
    };

    nodeWs.onopen = (e) => {
      socketOptions.onOpen(e);
      wsErrorCount = 0;
      MessageCaller.closeMessage('backend-error-hint');
    };

    nodeWs.onmessage = (result) => {
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

          if (data instanceof Object && data.error instanceof Array) {
            errorStr = data.error.join('_');
          }

          if (errorStr === 'NOT_EXIST_BAD_NODE') skipError = true;

          if (window.FLUX.allowTracking && !skipError) {
            // window.Raven.captureException(data);
            console.error('WS_ERROR', errorStr);
          }
          socketOptions.onError(data);
          break;
        case 'fatal':
          errorStr = data instanceof Object ? data.error : '';
          skipError = false;

          if (data instanceof Object && data.error instanceof Array) {
            errorStr = data.error.join('_');
          }

          if (errorStr === 'AUTH_ERROR') skipError = true;

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

          socketOptions.onFatal(data);
          break;
        // ignore below status
        case 'pong':
          break;
        case 'debug':
          if (socketOptions.onDebug) {
            socketOptions.onDebug(data);
          }
          break;
        default:
          socketOptions.onMessage(data);
          break;
      }
    };

    nodeWs.onclose = (result) => {
      socketOptions.onClose(result);

      // The connection was closed abnormally without sending or receving data
      // ref: http://tools.ietf.org/html/rfc6455#section-7.4.1
      if (result.code === 1006) {
        wsLog.log.push('**abnormal disconnection**');
        socketOptions.onFatal(result);
      }

      if (socketOptions.autoReconnect === true) {
        ws = createWebSocket(createWsOpts);
      } else {
        ws = null; // release
      }
    };

    return nodeWs;
  };

  let timer = null;
  const keepAlive = () => {
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      if (ws?.readyState === readyStates.OPEN) {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        sender('ping');
      }
    }, 60 * 1000 /* ms */);
  };
  keepAlive();

  const sender = (data) => {
    wsLog.log.push(trimMessage(['>', data, typeof data].join(' ')));

    if (data instanceof Blob === true) {
      blobSegments(data, (chunk) => {
        ws.send(chunk);
      });
    } else {
      ws.send(data);
    }
    keepAlive();
  };

  ws = createWebSocket(socketOptions);
  const wsobj = {
    get currentState() {
      return ws.readyState;
    },
    options: socketOptions,
    url: `/ws/${options.method}`,
    log: wsLog.log,
    send(data: string) {
      if (
        !ws ||
        ws === null ||
        ws?.readyState === readyStates.CLOSING ||
        ws?.readyState === readyStates.CLOSED
      ) {
        ws = createWebSocket(socketOptions);
      }
      if (ws.readyState === readyStates.CONNECTING) {
        ws.onopen = (e) => {
          socketOptions.onOpen(e);
          sender(data);
        };
      } else {
        sender(data);
      }
      return wsobj;
    },
    close(reconnect?: boolean) {
      if (typeof reconnect === 'boolean') {
        socketOptions.autoReconnect = reconnect;
      }
      if (ws !== null && ws.readyState !== readyStates.CLOSED) {
        ws.close();
      }
    },
    setOnMessage(callback) {
      socketOptions.onMessage = callback;
      return wsobj;
    },
  };

  window.FLUX.websockets.push(wsobj);

  WsLogger.append(wsLog);

  return wsobj;
}
