const path = require('path');

const { merge } = require('webpack-merge');
const WorkboxPlugin = require('workbox-webpack-plugin');

const config = require('./webpack.config.js');

module.exports = merge(config, {
  devServer: {
    compress: true,
    static: path.resolve(__dirname, 'dist'),
  },
  watchOptions: {
    poll: 1000,
  },
  mode: 'development',
  output: {
    clean: true,
    filename: '[name].bundle.js',
  },
  plugins: [
    // Generate minimal service worker for dev - prevents stale prod SW from being used
    new WorkboxPlugin.GenerateSW({
      skipWaiting: true,
      clientsClaim: true,
      // Exclude everything from precache - dev doesn't need offline support
      exclude: [/.*/],
      // Minimal runtime caching to satisfy Workbox requirement
      runtimeCaching: [
        {
          urlPattern: /^https?:\/\/localhost/,
          handler: 'NetworkFirst',
        },
      ],
    }),
  ],
});
