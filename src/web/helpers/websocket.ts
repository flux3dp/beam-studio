import isJson from './is-json';
import storage from './storage-helper';
import * as i18n from './i18n';
import Alert from '../app/actions/alert-caller';
import AlertStore from '../app/stores/alert-store';
import AlertConstants from '../app/constants/alert-constants';
import outputError from './output-error';
import Logger from './logger';
import blobSegments from './blob-segments';

window['FLUX'].websockets = [];
window['FLUX'].websockets.list = function() {
    window['FLUX'].websockets.forEach(function(conn, i) {
        console.log(i, conn.url);
    });
};

var hadConnected = false,
    showProgramErrorPopup = true,
    WsLogger = Logger('websocket'),
    logLimit = 100,
    wsErrorCount = 0,
    wsCreateFailedCount = 0;

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
export default function(options) {
    var { dev } = window['FLUX'],
        customHost = storage.get('host'),
        customPort = localStorage.getItem('port'),
        defaultCallback = function(result) {},
        defaultOptions = {
            hostname: customHost ? customHost : (dev ? '127.0.0.1' : '127.0.0.1'),
            method: '',
            get port() {
                return customPort ? customPort : dev ? '8000' : window['FLUX'].ghostPort;
            },
            autoReconnect: true,
            ignoreAbnormalDisconnect: false,
            onMessage: defaultCallback,
            onError: defaultCallback,
            onFatal: defaultCallback,
            onClose: defaultCallback,
            onOpen: defaultCallback
        },
        received_data = [],
        trimMessage = function(message: string) {
            message = message.replace(/\"/g, '');

            if (150 < message.length) {
                return message.substr(0, 200) + '...';
            }

            return message;
        },
        origanizeOptions = function(opts) {
            for (var name in defaultOptions) {
                if (name !== 'port' && (false === opts.hasOwnProperty(name) || 'undefined' === typeof opts[name])) {
                    opts[name] = defaultOptions[name];
                }
            }

            return opts;
        },
        createWebSocket = function(options) {
            const port = options.port || defaultOptions.port;
            let url = 'ws://' + options.hostname + ':' + port + '/ws/' + options.method;
            if (port === undefined) {
                wsCreateFailedCount += 1;
                if (wsCreateFailedCount === 100) {
                    const LANG = i18n.lang.beambox.popup;
                    Alert.popById('backend-error');
                    Alert.popUp({
                        id: 'backend-error',
                        type: AlertConstants.SHOW_POPUP_ERROR,
                        message: LANG.backend_connect_failed_ask_to_upload,
                        buttonType: AlertConstants.YES_NO,
                        onYes: () => {
                            outputError.uploadBackendErrorLog();
                        }
                    });
                }
                return null;
            }
            let _ws = new WebSocket(url);
            wsCreateFailedCount = 0;

            _ws.onerror = (e) => {
                wsErrorCount += 1;
                // If ws error count exceed certian number Alert user there may be problems with backend
                if (wsErrorCount === 50) {
                    const LANG = i18n.lang.beambox.popup;
                    Alert.popById('backend-error');
                    Alert.popUp({
                        id: 'backend-error',
                        type: AlertConstants.SHOW_POPUP_ERROR,
                        message: LANG.backend_connect_failed_ask_to_upload,
                        buttonType: AlertConstants.YES_NO,
                        onYes: () => {
                            outputError.uploadBackendErrorLog();
                        }
                    });
                }
            }

            _ws.onopen = function(e) {
                socketOptions.onOpen(e);
                wsErrorCount = 0;
            };

            _ws.onmessage = function(result) {
                let data = (true === isJson(result.data) ? JSON.parse(result.data) : result.data); 
                let errorStr = '';
                let skipError = false;
                if (!(result.data instanceof Blob)) {
                    let message = trimMessage(['<', result.data].join(' '));
                    wsLog.log.push(message);
                } else {
                    // Blob, not stringifiable
                    let message = trimMessage(`< Blob, size: ${result.data.size}`);
                    wsLog.log.push(message);
                }

                while(wsLog.log.length >= logLimit) {
                    wsLog.log.shift();
                }

                if ('string' === typeof data) {
                    data = data.replace(/\\/g, '\\\\');
                    data = data.replace(/\bNaN\b/g, 'null');
                    data = data.replace(/\r?\n|\r/g, ' ');
                    data = (true === isJson(data) ? JSON.parse(data) : data);
                }

                while(received_data.length >= logLimit) {
                    received_data.shift();
                }
                received_data.push(data);

                switch (data.status) {
                    case 'error':
                        errorStr = data instanceof Object ? data.error : '';
                        skipError = false;

                        if (data instanceof Object && data.error instanceof Array) {
                            errorStr = data.error.join('_');
                        }

                        if (errorStr === 'NOT_EXIST_BAD_NODE') { skipError = true; }

                        if (window['FLUX'].allowTracking && !skipError) {
                            // window.Raven.captureException(data);
                            console.error("WS_ERROR", errorStr);
                        }
                        socketOptions.onError(data);
                        break;
                    case 'fatal':
                        errorStr = data instanceof Object ? data.error : '';
                        skipError = false;

                        if (data instanceof Object && data.error instanceof Array) {
                            errorStr = data.error.join('_');
                        }

                        if (errorStr === 'AUTH_ERROR') { skipError = true; }

                        // if identify error, reconnect again
                        if (errorStr === 'REMOTE_IDENTIFY_ERROR') {
                            setTimeout(() => {
                                ws = createWebSocket(options);
                            }, 1000);
                            return;
                        }

                        if (window['FLUX'].allowTracking && !skipError) {
                            // window.Raven.captureException(data);
                            console.error("WS_FATAL", errorStr);
                        }

                        socketOptions.onFatal(data);
                        break;
                    // ignore below status
                    case 'pong':
                        break;
                    case 'debug':
                        if(socketOptions.onDebug){
                            socketOptions.onDebug(data);
                        }
                        break;
                    default:
                        socketOptions.onMessage(data);
                        break;
                }

                hadConnected = true;
            };

            _ws.onclose = function(result) {
                socketOptions.onClose(result);

                var outputLog = function() {
                        outputError.downloadErrorLog().then(onCancel);
                    },
                    onCancel = function() {
                        removeListener();
                        showProgramErrorPopup = true;
                    },
                    removeListener = function() {
                        AlertStore.removeCustomListener(outputLog);
                        AlertStore.removeCancelListener(onCancel);
                    };

                // The connection was closed abnormally without sending or receving data
                // ref: http://tools.ietf.org/html/rfc6455#section-7.4.1
                if(result.code === 1006) {
                    wsLog.log.push(['**abnormal disconnection**'].join(' '));
                    socketOptions.onFatal(result);
                }

                if (true === socketOptions.autoReconnect) {
                    received_data = [];
                    ws = createWebSocket(options);
                }
                else {
                    ws = null;  // release
                }
            };

            return _ws;
        },
        sender = function(data) {
            wsLog.log.push(trimMessage(['>', data, typeof data].join(' ')));

            if (true === data instanceof Blob) {
                blobSegments(data, function(chunk) {
                    ws.send(chunk);
                });
            }
            else {
                ws.send(data);
            }
            keepAlive();
        },
        ws = null,
        readyState = {
            CONNECTING : 0,
            OPEN       : 1,
            CLOSING    : 2,
            CLOSED     : 3
        },
        socketOptions = origanizeOptions(options);

    ws = createWebSocket(socketOptions);

    const keepAlive = () => {
        clearInterval(this.timer);
        this.timer = setInterval(function() {
            if (null !== ws && readyState.OPEN === ws.readyState) {
                sender('ping');
            }
        }, 60 * 1000 /* ms */);
    };

    keepAlive();

    var wsLog = {
            url: '/ws/' + options.method,
            log: []
        },
        wsobj = {
            readyState: readyState,
            options: socketOptions,
            url: '/ws/' + options.method,
            log: wsLog.log,
            send: function(data) {
                if (null === ws) {
                    ws = createWebSocket(socketOptions);
                }

                if (null === ws || readyState.OPEN !== ws.readyState) {
                    ws.onopen = function(e) {
                        socketOptions.onOpen(e);
                        sender(data);
                    };
                }
                else {
                    sender(data);
                }

                return this;
            },

            fetchData: function() {
                return received_data;
            },

            fetchLastResponse: function() {
                return this.fetchData()[received_data.length - 1];
            },

            getReadyState: function() {
                return ws.readyState;
            },

            close: function(reconnect?: boolean) {
                if ('boolean' === typeof reconnect) {
                    socketOptions.autoReconnect = reconnect;
                }
                if (null !== ws && ws.readyState !== readyState.CLOSED) {
                    ws.close();
                }
            },

            setOptions: function(sockOpts) {
                Object.assign(socketOptions, sockOpts);
            },

            // events
            onOpen: function(callback) {
                socketOptions.onOpen = callback;

                return this;
            },

            onMessage: function(callback) {
                socketOptions.onMessage = callback;

                return this;
            },

            onClose: function(callback) {
                socketOptions.onClose = callback;
                return this;
            },

            onError: function(callback) {
                socketOptions.onError = callback;
                return this;
            },

            onFatal: function(callback) {
                socketOptions.onFatal = callback;

                return this;
            }
        };

    window['FLUX'].websockets.push(wsobj);

    WsLogger.append(wsLog);

    return wsobj;
};
