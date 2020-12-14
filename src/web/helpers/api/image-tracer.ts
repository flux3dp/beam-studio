/**
 * API image tracer
 * Ref: none
 */
import Websocket from '../websocket';
import BeamboxActions from '../../app/actions/beambox';
    
export default function() {
    var ws = Websocket({
            method: 'image-tracer',
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
        upload: (data, opts) => {
            opts = opts || {};
            let d = $.Deferred();
            events.onMessage = (response) => {
                switch (response.status) {
                    case 'ok':
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

            ws.send(`image_trace ${data.size || data.byteLength} ${opts.threshold}`);
            return d.promise();
        },
    };
};
