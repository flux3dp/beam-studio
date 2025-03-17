const path = require('path');

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
});
