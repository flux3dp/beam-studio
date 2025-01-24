const { merge } = require('webpack-merge');
const WorkboxPlugin = require('workbox-webpack-plugin');

const config = require('./webpack.config.js');

module.exports = merge(config, {
  mode: 'production',
  plugins: [
    new WorkboxPlugin.GenerateSW({
      // these options encourage the ServiceWorkers to get in there fast
      // and not allow any straggling "old" SWs to hang around
      cleanupOutdatedCaches: true,
      clientsClaim: true,
      maximumFileSizeToCacheInBytes: 1024 * 1024 * 100, // 100MB
      skipWaiting: true,
    }),
  ],
});
