const path = require('path');

const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = [
  {
    entry: './src/main.ts',
    devtool: 'source-map',
    mode: 'development',
    resolve: {
      alias: {
        app: '/src/web/app',
        helpers: '/src/web/helpers',
        loader: '/src/web/loader',
        implementations: '/src/implementations',
        styles: '/src/web/styles',
      },
      extensions: ['.tsx', '.ts', '.jsx', '.js', 'sass'],
      symlinks: false,
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
      child_process: 'require("child_process")',
      util: 'require("util")',
      'font-scanner': 'require("font-scanner")',
      '@sentry/electron': 'require("@sentry/electron")',
    },
    node: {
      __dirname: false
    },
    module: {
      rules: [
        {
          test: /\.worker\.ts$/,
          loader: 'worker-loader',
          options: {
            filename: "[name].worker.js",
          },
        },
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: ['babel-loader'],
        },
        {
          test: /\.(ts|tsx)$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
              },
            },
          ],
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
          include: [path.join(__dirname, 'node_modules/antd'), path.join(__dirname, 'node_modules/antd-mobile')],
        },
        {
          test: /\.module\.s[ac]ss$/,
          exclude: /node_modules/,
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: {
                modules: {
                  localIdentName: "[path][name]__[local]--[hash:base64:5]",
                },
              }
            },
            {
              loader: 'sass-loader',
            }
          ]
        },
        {
          test: /\.svg$/i,
          type: 'asset',
          resourceQuery: /url/, // *.svg?url
        },
        {
          test: /\.svg$/,
          resourceQuery: { not: [/url/] }, // exclude react component if *.svg?url
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
                          removeViewBox: false,
                          convertPathData: false,
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
    output: {
      path: path.resolve(__dirname, 'public', 'js', 'dist'),
      filename: 'bundle.js',
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          { from: path.resolve(__dirname, 'src/web/assets/video'), to: path.resolve(__dirname, 'public/video') },
          { from: path.resolve(__dirname, 'src/web/assets/img'), to: path.resolve(__dirname, 'public/core-img') },
          { from: path.resolve(__dirname, 'src/web/assets/fcode'), to: path.resolve(__dirname, 'public/fcode') },
        ],
      }),
    ],
  },
  {
    entry: './src/shadow-window.ts',
    devtool: 'source-map',
    mode: 'development',
    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js'],
      symlinks: false,
    },
    externals: {
      electron: 'require("electron")',
      '@sentry/electron': 'require("@sentry/electron")',
    },
    node: {
      __dirname: false
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: ['babel-loader'],
        },
        {
          test: /\.(ts|tsx)$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
              },
            },
          ],
        },
      ],
    },
    output: {
      path: path.resolve(__dirname, 'public', 'js', 'dist'),
      filename: 'shadow-window.js',
    },
  },
  {
    mode: 'development',
    entry: {
      main: './public/sass/main.scss',
    },
    module: {
      rules: [
        {
          test: /\.s[ac]ss$/i,
          use: [
            MiniCssExtractPlugin.loader,
            "css-loader",
            "sass-loader",
          ],
        },
        {
          test: /\.(woff(2)?|ttf|eot|svg|png)$/,
          use: ['file-loader'],
        }
      ],
    },
    plugins: [
      new MiniCssExtractPlugin(),
    ],
    output: {
      path: path.resolve(__dirname, 'public', 'css', 'dist'),
    },
  },
];
