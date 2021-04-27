/**
 * API config
 * Ref: https://github.com/flux3dp/fluxghost/wiki/websocket-config
 */
import storage from 'helpers/storage-helper';

export default function () {
  const stardardOptions = (opts) => ({
    ...opts,
    onFinished: opts.onFinished || function () { },
  });

  return {
    connection: {},
    write(key, value, opts?) {
      storage.set(key, value);
      stardardOptions(opts).onFinished();

      return this;
    },
    read(key, opts?): any {
      const value = storage.get(key);
      stardardOptions(opts).onFinished(value);
      return value;
    },

    remove(key) {
      storage.removeAt(key);
    },
  };
}
