/**
 * API camera calibration
 * Ref: none
 */
import Websocket from '../websocket';

export default function() {
    var ws = Websocket({
            method: 'camera-calibration',
            onMessage: (data) => {
                events.onMessage(data);
            },
            onError: (response) => {
                events.onError(response);
            },
            onFatal: (response) => {
                events.onFatal(response);
            }
        }),
        events = {
            onMessage   : (response: any) => {},
            onError     : (response: any) => {},
            onFatal     : (response: any) => {}
        };

    return {
        connection: ws,

        /**
         * @param {ArrayBuffer} data    - binary data with array buffer type
         */
        upload: (data) => {
            let d = $.Deferred();
            events.onMessage = (response) => {
                switch (response.status) {
                    case 'ok':
                        d.resolve(response);
                        break;
                    case 'fail':
                        d.resolve(response);
                        break;
                    case 'none':
                        d.resolve(response);
                        break;
                    case 'continue':
                        ws.send(data);
                        break;
                    default:
                        console.log('strange message', response);
                        break;
                }
            };

            events.onError = (response) => { d.reject(response); console.log('on error', response); };
            events.onFatal = (response) => { d.reject(response); console.log('on fatal', response); };

            ws.send(`upload ${data.size || data.byteLength}`);
            return d.promise();
        },
    };
};
