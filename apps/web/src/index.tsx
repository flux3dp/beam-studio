/* eslint-disable import/order */
import './assets/scss/main.scss';

// need to import all required external modules before reading our own files
// otherwise, the major global variables will not become accessible
import './main';
import './shortcuts';

import storage from '@core/implementations/storage';
import router from '@core/app/router';
import { hashMap } from '@core/helpers/hashHelper';

if (process.env.NODE_ENV !== 'production') {
  console.log('We are in development mode!');
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

if (!('structuredClone' in globalThis)) {
  // Note: This only works for simple objects and arrays.
  // For more complex objects, consider using a library like lodash or writing a custom clone function.
  globalThis.structuredClone = (v) => JSON.parse(JSON.stringify(v));
}

const onFinished = (data: boolean) => {
  const { hash } = window.location;
  const isReady = data;
  const isInitializePage = Boolean(hash.match(/^#\/?initialize/));

  if (isReady === true && (hash === '' || isInitializePage)) {
    window.location.hash = hashMap.welcome;
  } else if (isReady === false && !isInitializePage) {
    window.location.hash = hashMap.root;
  }

  checkScreenSize();
  window.addEventListener('hashchange', checkScreenSize);

  const root = document.getElementById('root') as HTMLElement;

  root.classList.add('web');
  router(root);
};

onFinished(storage.get('printer-is-ready'));
