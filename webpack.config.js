const path = require('path');

module.exports = {
  entry: './public/js/dist/main.js',
  devtool: 'inline-source-map',
  mode: 'development',
  resolve: {
    alias: {
      app: '/public/js/dist/app',
      helpers: '/public/js/dist/helpers',
      loader: '/public/js/dist/loader',
    },
  },
  externals: {
    crypto: 'require("crypto")',
    electron: 'require("electron")',
    fs: 'require("fs")',
    os: 'require("os")',
    path: 'require("path")',
  },
  node: {
    __dirname: false
  },
  output: {
    path: path.resolve(__dirname, 'public', 'js', 'dist'),
    filename: 'bundle.js',
  },
};
