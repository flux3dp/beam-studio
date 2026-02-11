const path = require('path');

module.exports = [
  {
    devtool: 'source-map',
    entry: './src/node/electron-main.ts',
    externals: {
      'font-scanner': 'require("font-scanner")',
    },
    mode: 'development',
    module: {
      rules: [
        {
          exclude: /node_modules/,
          test: /\.ts?$/,
          use: [{ loader: 'ts-loader', options: { configFile: 'tsconfig.app.json', transpileOnly: true } }],
        },
      ],
    },
    output: {
      filename: 'main.js',
      path: path.resolve(__dirname, 'public', 'js', 'node'),
      uniqueName: 'app-main',
    },
    resolve: {
      alias: {
        '@core/implementations': path.resolve(__dirname, 'src/implementations'),
        '@core': path.resolve(__dirname, '../../packages/core/src/web'),
      },
      extensions: ['.ts', '.js'],
    },
    target: 'electron40-main',
  },
];
