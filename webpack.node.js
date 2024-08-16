const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = [
  {
    target: 'electron-main',
    entry: './src/node/electron-main.ts',
    devtool: 'source-map',
    mode: 'development',
    resolve: {
      alias: {
        node: '/src/node',
        app: '/src/web/app',
        helpers: '/src/web/helpers',
        implementations: '/src/implementations',

      },
      extensions: ['.ts', '.js'],
      symlinks: false,
    },
    externals: [nodeExternals()],
    module: {
      rules: [
        {
          test: /\.ts?$/,
          exclude: /node_modules/,
          use: 'ts-loader',
        },
      ],
    },
    output: {
      path: path.resolve(__dirname, 'public', 'js', 'node'),
      filename: 'main.js',
    },
  },
];
