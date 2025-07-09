import type { WebContents } from 'electron';
import ElectronStore from 'electron-store';

const initStore = (webContents: WebContents, isWelcomeTab = false): void => {
  const store = new ElectronStore();

  store.set('isWelcomeTab', isWelcomeTab);

  if (!store.get('poke-ip-addr')) {
    store.set('poke-ip-addr', '192.168.1.1');
  }

  if (!store.get('customizedLaserConfigs')) {
    console.log('No customized laser configs found, initializing with default values.');
    webContents.executeJavaScript('({...localStorage});', true).then((localStorage) => {
      const keysNeedParse = [
        'auto_check_update',
        'auto_connect',
        'guessing_poke',
        'loop_compensation',
        'notification',
        'printer-is-ready',
      ];

      for (const key in localStorage) {
        if (keysNeedParse.includes(key)) {
          try {
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
