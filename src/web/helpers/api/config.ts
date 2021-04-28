/**
 * API config
 * Ref: https://github.com/flux3dp/fluxghost/wiki/websocket-config
 */
import storage from 'helpers/storage-helper';

interface IConfig {
  write: (key: string, value, opts?) => void,
  read: (key: string, opts?) => any,
  remove: (key: string) => void,
}

export default function config(): IConfig {
  const stardardOptions = (opts) => ({
    ...opts,
    onFinished: opts?.onFinished || (() => {}),
  });

  return {
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
