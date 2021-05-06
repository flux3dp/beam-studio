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
  node: {
    __dirname: false
  },
  output: {
    path: path.resolve(__dirname, 'public', 'js', 'dist'),
    filename: 'bundle.js',
  },
};
