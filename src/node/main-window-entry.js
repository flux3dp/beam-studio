/* eslint-disable no-param-reassign */
/* eslint-disable global-require */

(function mainEntry(G) {
  // For modules not loadable in renderer process
  G.nodeModules = {
    '@sentry/electron': require('@sentry/electron'),
  };
}(global));
