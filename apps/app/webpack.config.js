const path = require('path');

const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const nodeConfig = require('./webpack.node.js');

const app = path.resolve(__dirname, 'src');
const coreWeb = path.resolve(__dirname, '../../packages/core/src/web');

module.exports = [
  ...nodeConfig,
  {
    devtool: 'source-map',
    entry: './src/main.ts',
    externals: {
      '@sentry/electron': 'require("@sentry/electron")',
      'font-scanner': 'require("font-scanner")',
    },
    mode: 'development',
    module: {
      rules: [
        {
          loader: 'worker-loader',
          options: { filename: '[name].worker.js' },
          test: /\.worker\.ts$/,
        },
        {
          exclude: /node_modules/,
          test: /\.(js|jsx)$/,
          use: ['babel-loader'],
        },
        {
          exclude: /node_modules/,
          test: /\.(ts|tsx)$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                configFile: 'tsconfig.app.json',
                transpileOnly: true,
              },
            },
          ],
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
        {
          exclude: /node_modules/,
          test: /\.module\.s[ac]ss$/,
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: { modules: { localIdentName: '[path][name]__[local]--[hash:base64:5]' } },
            },
            { loader: 'sass-loader' },
          ],
        },
        {
          resourceQuery: /url/, // *.svg?url
          test: /\.svg$/i,
          type: 'asset',
        },
        {
          // exclude react component if *.svg?url
          resourceQuery: { not: [/url/] },
          test: /\.svg$/,
          use: [
            {
              loader: '@svgr/webpack',
              options: {
                svgoConfig: {
                  plugins: [
                    {
                      name: 'preset-default',
                      params: {
                        overrides: {
                          convertPathData: false,
                          removeViewBox: false,
                        },
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
      ],
    },
    node: {
      __dirname: false,
    },
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'public', 'js', 'dist'),
      uniqueName: 'app-renderer',
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          { from: path.resolve(coreWeb, 'assets/video'), to: path.resolve(__dirname, 'public/video') },
          { from: path.resolve(coreWeb, 'assets/img'), to: path.resolve(__dirname, 'public/core-img') },
          { from: path.resolve(coreWeb, 'assets/fcode'), to: path.resolve(__dirname, 'public/fcode') },
          { from: path.resolve(coreWeb, 'assets/assets'), to: path.resolve(__dirname, 'public/assets') },
        ],
      }),
    ],
    resolve: {
      alias: {
        '@app': app,
        '@core': coreWeb,
      },
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.sass'],
    },
    // stats: 'errors-only',
    target: 'electron30-renderer',
  },
  {
    devtool: 'source-map',
    entry: './src/shadow-window.ts',
    externals: { '@sentry/electron': 'require("@sentry/electron")' },
    mode: 'development',
    module: {
      rules: [
        {
          exclude: /node_modules/,
          test: /\.(js|jsx)$/,
          use: ['babel-loader'],
        },
        {
          exclude: /node_modules/,
          test: /\.(ts|tsx)$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                configFile: 'tsconfig.app.json',
                transpileOnly: true,
              },
            },
          ],
        },
      ],
    },
    node: { __dirname: false },
    output: {
      filename: 'shadow-window.js',
      path: path.resolve(__dirname, 'public', 'js', 'dist'),
      uniqueName: 'app-shadow-renderer',
    },
    resolve: {
      alias: {
        '@app': app,
        '@core': coreWeb,
      },
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.sass'],
    },
    // stats: 'errors-only',
    target: 'electron30-renderer',
  },
  {
    // stats: 'errors-only',
    entry: { main: './public/sass/main.scss' },
    mode: 'development',
    module: {
      rules: [
        {
          test: /\.s[ac]ss$/i,
          use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
        },
        {
          test: /\.(woff(2)?|ttf|eot|svg|png)$/,
          type: 'asset/resource',
        },
      ],
    },
    output: {
      path: path.resolve(__dirname, 'public', 'css', 'dist'),
      uniqueName: 'app-asset',
    },
    plugins: [new MiniCssExtractPlugin()],
  },
];
