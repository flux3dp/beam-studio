const path = require('path');

const { merge } = require('webpack-merge');

const common = require('./webpack.common.js');

module.exports = merge(common, {
  devServer: {
    compress: true,
    static: path.resolve(__dirname, 'dist'),
  },
  mode: 'development',
  output: {
    clean: true,
    filename: '[name].bundle.js',
  },
});
