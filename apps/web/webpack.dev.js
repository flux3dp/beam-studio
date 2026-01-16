const path = require('path');

const CopyPlugin = require('copy-webpack-plugin');
const { merge } = require('webpack-merge');

const config = require('./webpack.config.js');

module.exports = () => {
  return merge(config, {
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
      // Copy static service worker for dev - replaces any stale prod SW
      new CopyPlugin({
        patterns: [{ from: path.resolve(__dirname, 'src/sw.dev.js'), to: 'sw.js' }],
      }),
    ],
  });
};
