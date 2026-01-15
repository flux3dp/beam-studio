const path = require('path');

const CopyPlugin = require('copy-webpack-plugin');
const { merge } = require('webpack-merge');

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
    // Copy a minimal no-op service worker to override any stale production SW
    // This avoids the GenerateSW warning in watch mode (see: https://github.com/GoogleChrome/workbox/issues/1790)
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'src/service-worker.dev.js'),
          to: 'service-worker.js',
        },
      ],
    }),
  ],
});
