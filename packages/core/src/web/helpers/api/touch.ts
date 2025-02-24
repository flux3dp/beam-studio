/**
 * API touch
 * Ref: https://github.com/flux3dp/fluxghost/wiki/websocket-touch
 */
import rsaKey from '../rsa-key';
import Websocket from '../websocket';

export default function (opts) {
  var events = {
      onError: opts.onError || function () {},
      onFail: opts.onFail || function () {},
      onSuccess: opts.onSuccess || function () {},
    },
    ws = Websocket({
      autoReconnect: false,
      method: 'touch',
      onError: events.onError,
      onMessage: function (data) {
        var is_success =
          true === (data.has_response || false) && true === (data.reachable || false) && true === (data.auth || false);

        if (true === is_success) {
          events.onSuccess(data);
          ws.close();
        } else {
          events.onFail(data);
        }
      },
    });

  return {
    send: function (uuid, password) {
      password = password || 'default';

      var args = JSON.stringify({ key: rsaKey(opts.checkPassword), password, uuid });

      ws.send(args);
    },
  };
}
