/* eslint-disable import/order */
import './assets/scss/main.scss';

import 'helpers/global-helper';

// need to import all required external modules before reading our own files
// otherwise, the major global variables will not become accessible
import './main';
import './shortcuts';

import storage from 'implementations/storage';
import router from 'app/router';

if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line no-console
  console.log('Looks like we are in development mode!');
  window.FLUX.dev = true;
}

const checkScreenSize = () => {
  // const { hash } = window.location;
  // if (Math.max(window.screen.width, window.screen.height) < 1024
  // && hash !== '#/error/screen-size') {
  //   window.location.hash = '#/error/screen-size';
  // }
};

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

const onFinished = (data) => {
  const { hash } = window.location;
  const isReady = data;
  if (isReady === true && (hash === '' || hash.startsWith('#initialize'))) {
    window.location.hash = '#studio/beambox';
  } else if (isReady === false && !hash.startsWith('#initialize')) {
    window.location.hash = '#';
  }
  checkScreenSize();
  window.addEventListener('hashchange', checkScreenSize);
  router(document.getElementById('root'));
};
onFinished(storage.get('printer-is-ready'));
