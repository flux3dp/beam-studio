const path = require('path');
const webpack = require('webpack');

const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const nodeConfig = require('./webpack.node.js');

// Supported locales matching router.tsx localeMap
const SUPPORTED_LOCALES = [
  'da',
  'de',
  'el',
  'en',
  'fi',
  'fr',
  'id',
  'it',
  'ja',
  'ko',
  'ms',
  'nb',
  'nl',
  'pl',
  'sv',
  'th',
  'vi',
  'zh-tw',
];

const app = path.resolve(__dirname, 'src');
const core = path.resolve(__dirname, '../../packages/core');
const coreWeb = path.resolve(core, 'src/web');

module.exports = [
  ...nodeConfig,
  {
    devtool: 'source-map',
    entry: {
      main: path.resolve(app, 'main.ts'),
      // Workers must be explicit entries in Electron to ensure proper bundling with polyfills
      ['potrace.worker']: path.resolve(coreWeb, 'helpers/potrace/potrace.worker.ts'),
      ['clipper.worker']: path.resolve(coreWeb, 'helpers/clipper/clipper.worker.ts'),
      ['image-tracer.worker']: path.resolve(coreWeb, 'helpers/image-tracer/image-tracer.worker.ts'),
      ['image-symbol.worker']: path.resolve(coreWeb, 'helpers/symbol-helper/image-symbol.worker.ts'),
    },
    externals: {
      '@sentry/electron': 'require("@sentry/electron")',
      'font-scanner': 'require("font-scanner")',
    },
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
            { loader: 'sass-loader', options: { api: 'modern-compiler' } },
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
      filename: '[name].bundle.js',
      path: path.resolve(__dirname, 'public/js/dist'),
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
      // Limit dayjs locales to only supported languages
      new webpack.ContextReplacementPlugin(/dayjs[/\\]locale$/, new RegExp(`(${SUPPORTED_LOCALES.join('|')})\\.js$`)),
    ],
    resolve: {
      alias: {
        '@core/implementations': path.resolve(__dirname, 'src/implementations'),
        '@core': coreWeb,
      },
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.sass'],
      modules: ['node_modules', path.resolve(core, 'node_modules')],
    },
    // stats: 'errors-only',
    target: 'electron40-renderer',
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
        '@core/implementations': path.resolve(__dirname, 'src/implementations'),
        '@core': coreWeb,
      },
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.sass'],
    },
    // stats: 'errors-only',
    target: 'electron40-renderer',
  },
  {
    // stats: 'errors-only',
    entry: { main: './public/sass/main.scss' },
    mode: 'development',
    module: {
      rules: [
        {
          test: /\.s[ac]ss$/i,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            { loader: 'sass-loader', options: { api: 'modern-compiler' } },
          ],
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
