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
      implementations: '/public/js/dist/implementations',
    },
  },
  externals: {
    crypto: 'require("crypto")',
    electron: 'require("electron")',
    fs: 'require("fs")',
    os: 'require("os")',
    path: 'require("path")',
    dns: 'require("dns")',
    'net-ping': 'require("net-ping")',
    fontkit: 'require("fontkit")',
    serialport: 'require("serialport")',
    child_process: 'require("child_process")',
    util: 'require("util")',
    'font-scanner': 'require("font-scanner")',
    '@sentry/electron': 'require("@sentry/electron")',
  },
  node: {
    __dirname: false
  },
  output: {
    path: path.resolve(__dirname, 'public', 'js', 'dist'),
    filename: 'bundle.js',
  }
};
