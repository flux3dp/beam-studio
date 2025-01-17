/**
 * API touch
 * Ref: https://github.com/flux3dp/fluxghost/wiki/websocket-touch
 */
import Websocket from '../websocket';
import rsaKey from '../rsa-key';

export default function(opts) {
    var events = {
            onSuccess: opts.onSuccess || function() {},
            onFail: opts.onFail || function() {},
            onError: opts.onError || function() {}
        },
        ws = Websocket({
            method: 'touch',
            autoReconnect: false,
            onMessage: function(data) {
                var is_success = (
                        true === (data.has_response || false) &&
                        true === (data.reachable || false) &&
                        true === (data.auth || false)
                    );

                if (true === is_success) {
                    events.onSuccess(data);
                    ws.close();
                }
                else {
                    events.onFail(data);
                }

            },
            onError: events.onError
        });

    return {
        send: function(uuid, password) {
            password = password || 'default';

            var args = JSON.stringify({ uuid: uuid, password: password, key: rsaKey(opts.checkPassword) });

            ws.send(args);
        }
    };
};
