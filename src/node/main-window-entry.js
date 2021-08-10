/* eslint-disable no-param-reassign */
/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */

(function mainEntry(G) {
  const path = require('path');

  // eslint-disable-next-line import/no-extraneous-dependencies
  const { ipcRenderer, remote } = require('electron');
  // eslint-disable-next-line import/no-dynamic-require
  const events = require(path.join(__dirname, 'ipc-events'));

  // For modules not loadable in renderer process
  G.nodeModules = {
    '@sentry/electron': require('@sentry/electron'),
  };

  G.electron = {
    ipc: ipcRenderer,
    events,
    remote,
  };
}(global));
