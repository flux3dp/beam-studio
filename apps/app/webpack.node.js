const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = [
  {
    target: 'electron-main',
    entry: './src/node/electron-main.ts',
    devtool: 'source-map',
    mode: 'development',
    stats: 'errors-only',
    resolve: {
      alias: {
        '@core': path.resolve(__dirname, '../../packages/core/src/web'),
        '@app': path.resolve(__dirname, 'src'),
      },
      extensions: ['.ts', '.js'],
    },
    externals: [nodeExternals()],
    module: {
      rules: [
        {
          test: /\.ts?$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
                configFile: 'tsconfig.app.json',
              },
            },
          ],
        },
      ],
    },
    output: {
      path: path.resolve(__dirname, 'public', 'js', 'node'),
      filename: 'main.js',
    },
  },
];
