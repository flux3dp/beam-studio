import workareaManager from '@core/app/svgedit/workarea';
import { getHomePage, hashMap } from '@core/helpers/hashHelper';
import Logger from '@core/helpers/logger';
import shortcuts from '@core/helpers/shortcuts';
import storage from '@core/implementations/storage';

const genericLogger = Logger('generic');
const defaultKeyBehavior = () => {
  shortcuts.on(['Fnkey+a'], () => window.document.execCommand('selectAll'));
  shortcuts.on(['Fnkey+0'], () => {
    console.log('Reset View!');
    workareaManager.resetView();
  });
  shortcuts.on(
    ['Fnkey-+', 'Fnkey-='],
    () => {
      console.log('Zoom In');
      workareaManager.zoomIn();
    },
    { splitKey: '-' },
  );
  shortcuts.on(['Fnkey+-'], () => {
    console.log('Zoom Out');
    workareaManager.zoomOut();
  });
};

defaultKeyBehavior();

window.onerror = (message, source, lineno) => {
  genericLogger.append([message, source, lineno].join(' '));
};

export default (callback: () => void): void => {
  const { hash } = window.location;
  const isInitializePage = Boolean(hash.match(/^#\/?initialize/));
  const onFinished = (isReady: boolean) => {
    if ((isReady === true || window.homePage === hashMap.editor) && (hash === '' || isInitializePage)) {
      window.location.hash = getHomePage();
    } else if (isReady === false && !isInitializePage) {
      window.location.hash = hashMap.root;
    }

    callback();
  };

  onFinished(storage.get('printer-is-ready'));
};
