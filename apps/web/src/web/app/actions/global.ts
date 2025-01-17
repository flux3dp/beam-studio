/* eslint-disable no-console */
import Logger from 'helpers/logger';
import shortcuts from 'helpers/shortcuts';
import storage from 'implementations/storage';
import workareaManager from 'app/svgedit/workarea';

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
    { splitKey: '-' }
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
  const onFinished = (isReady: boolean) => {
    if (isReady === true && (hash === '' || hash.startsWith('#initialize'))) {
      window.location.hash = '#studio/beambox';
    } else if (isReady === false && !hash.startsWith('#initialize')) {
      window.location.hash = '#';
    }
    callback();
  };
  onFinished(storage.get('printer-is-ready'));
};
