import ElectronStore from 'electron-store';
// eslint-disable-next-line import/no-extraneous-dependencies
import { WebContents } from 'electron';

const initStore = (webContents: WebContents): void => {
  const store = new ElectronStore();

  if (!store.get('poke-ip-addr')) store.set('poke-ip-addr', '192.168.1.1');

  if (!store.get('customizedLaserConfigs')) {
    webContents.executeJavaScript('({...localStorage});', true).then((localStorage) => {
      const keysNeedParse = [
        'auto_check_update',
        'auto_connect',
        'guessing_poke',
        'loop_compensation',
        'notification',
        'printer-is-ready',
      ];
      // eslint-disable-next-line no-restricted-syntax
      for (const key in localStorage) {
        if (keysNeedParse.includes(key)) {
          try {
            // eslint-disable-next-line no-param-reassign
            localStorage[key] = JSON.parse(localStorage[key]);
            console.log(key, localStorage[key]);
          } catch (e) {
            console.log(key, e);
            // Error when parsing
          }
        }
      }
      store.set(localStorage);
    });
  }
};

export default initStore;
