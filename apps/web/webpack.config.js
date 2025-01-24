const path = require('path');

const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const core = path.resolve(__dirname, '../../packages/core');
const coreWeb = path.resolve(core, 'src/web');

module.exports = {
  devtool: 'source-map',
  entry: path.resolve(__dirname, 'src/index.tsx'),
  mode: 'development',
  module: {
    rules: [
      {
        loader: 'worker-loader',
        options: {
          filename: '[name].[contenthash].worker.js',
        },
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
              transpileOnly: true,
            },
          },
        ],
      },
      {
        exclude: /node_modules/,
        test: /\.module\.s[ac]ss$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[path][name]__[local]--[hash:base64:5]',
              },
            },
          },
          {
            loader: 'sass-loader',
            options: {
              api: 'modern-compiler',
            },
          },
        ],
      },
      {
        exclude: /\.module\.s[ac]ss$/,
        test: /\.scss$/i,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              api: 'modern-compiler',
            },
          },
        ],
      },
      {
        exclude: /\.module\.css$/,
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.(woff(2)?|ttf|eot|png)$/,
        use: ['file-loader'],
      },
      {
        resourceQuery: /url/, // *.svg?url
        test: /\.svg$/i,
        type: 'asset',
      },
      {
        resourceQuery: { not: [/url/] }, // exclude react component if *.svg?url
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
  output: {
    clean: true,
    filename: '[name].[chunkhash].bundle.js',
    hashFunction: 'xxhash64',
    path: path.resolve(__dirname, 'dist'),
    uniqueName: 'web',
  },
  plugins: [
    new HtmlWebpackPlugin({
      clean: true,
      template: path.resolve(__dirname, 'src', 'index.html'),
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'src/assets/images'),
          to: path.resolve(__dirname, 'dist/img'),
        },
        { from: path.resolve(coreWeb, 'assets/img'), to: path.resolve(__dirname, 'dist/core-img') },
        { from: path.resolve(coreWeb, 'assets/fcode'), to: path.resolve(__dirname, 'dist/fcode') },
        {
          from: path.resolve(__dirname, 'src/assets/styles'),
          to: path.resolve(__dirname, 'dist/styles'),
        },
        { from: path.resolve(coreWeb, 'assets/video'), to: path.resolve(__dirname, 'dist/video') },
        {
          from: path.resolve(coreWeb, 'assets/assets'),
          to: path.resolve(__dirname, 'dist/assets'),
        },
        {
          from: path.resolve(__dirname, 'public/js/lib/svgeditor/extensions'),
          to: path.resolve(__dirname, 'dist/js/lib/svgeditor/extensions'),
        },
        {
          from: path.resolve(__dirname, 'public/js/lib/svgeditor/images'),
          to: path.resolve(__dirname, 'dist/js/lib/svgeditor/images'),
        },
        {
          from: path.resolve(__dirname, 'public/js/lib/svg-nest'),
          to: path.resolve(__dirname, 'dist/js/lib/svg-nest'),
        },
        {
          from: path.resolve(__dirname, 'public/js/lib/dxf2svg.js'),
          to: path.resolve(__dirname, 'dist'),
        },
        {
          from: path.resolve(__dirname, 'public/js/lib/svgeditor/imagetracer.js'),
          to: path.resolve(__dirname, 'dist'),
        },
        { from: path.resolve(__dirname, 'src/vendor'), to: path.resolve(__dirname, 'dist/vendor') },
        { from: path.resolve(__dirname, 'src/manifest.json'), to: path.resolve(__dirname, 'dist') },
      ],
    }),
    new MiniCssExtractPlugin({
      filename: '[name].[chunkhash].css',
    }),
  ],
  resolve: {
    alias: {
      '@app': path.resolve(__dirname, 'src'),
      '@core': coreWeb,
      browser: path.resolve(__dirname, 'public/js/lib/svgeditor/browser'),
      canvg: path.resolve(__dirname, 'public/js/lib/svgeditor/canvg/canvg'),
      coords: path.resolve(__dirname, 'public/js/lib/svgeditor/coords'),
      draw: path.resolve(__dirname, 'public/js/lib/svgeditor/draw'),
      dxf2svg: path.resolve(__dirname, 'public/js/lib/dxf2svg'),
      imagetracer: path.resolve(__dirname, 'public/js/lib/svgeditor/imagetracer'),
      jgraduate: path.resolve(__dirname, 'public/js/lib/svgeditor/jgraduate/jquery.jgraduate.min'),
      jpicker: path.resolve(__dirname, 'public/js/lib/svgeditor/jgraduate/jpicker'),
      jquery: path.resolve(__dirname, 'public/js/lib/svgeditor/jquery'),
      jquerybbq: path.resolve(__dirname, 'public/js/lib/svgeditor/jquerybbq/jquery.bbq.min'),
      jqueryContextMenu: path.resolve(__dirname, 'public/js/lib/svgeditor/contextmenu/jquery.contextMenu'),
      jqueryGrowl: path.resolve(__dirname, 'public/js/lib/jquery.growl'),
      jquerySvg: path.resolve(__dirname, 'public/js/lib/svgeditor/jquery-svg'),
      jqueryUi: path.resolve(__dirname, 'public/js/lib/svgeditor/jquery-ui/jquery-ui-1.8.17.custom.min'),
      jsHotkeys: path.resolve(__dirname, 'public/js/lib/svgeditor/js-hotkeys/jquery.hotkeys.min'),
      layer: path.resolve(__dirname, 'public/js/lib/svgeditor/layer'),
      math: path.resolve(__dirname, 'public/js/lib/svgeditor/math'),
      path: path.resolve(__dirname, 'public/js/lib/svgeditor/path'),
      pathseg: path.resolve(__dirname, 'public/js/lib/svgeditor/pathseg'),
      recalculate: path.resolve(__dirname, 'public/js/lib/svgeditor/recalculate'),
      rgbcolor: path.resolve(__dirname, 'public/js/lib/svgeditor/canvg/rgbcolor'),
      sanitize: path.resolve(__dirname, 'public/js/lib/svgeditor/sanitize'),
      spinbtn: path.resolve(__dirname, 'public/js/lib/svgeditor/spinbtn/JQuerySpinBtn.min'),
      svgedit: path.resolve(__dirname, 'public/js/lib/svgeditor/svgedit'),
      svgeditor: path.resolve(__dirname, 'public/js/lib/svgeditor'),
      svgicons: path.resolve(__dirname, 'public/js/lib/svgeditor/svgicons/jquery.svgicons'),
      svgtransformlist: path.resolve(__dirname, 'public/js/lib/svgeditor/svgtransformlist'),
      svgutils: path.resolve(__dirname, 'public/js/lib/svgeditor/svgutils'),
      touch: path.resolve(__dirname, 'public/js/lib/svgeditor/touch'),
      underscore: path.resolve(__dirname, 'public/js/lib/underscore'),
      units: path.resolve(__dirname, 'public/js/lib/svgeditor/units'),
    },
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      buffer: false,
      events: false,
      fs: false,
      stream: false,
      util: false,
    },
    modules: [path.resolve(__dirname, 'public/js/lib'), 'node_modules', path.resolve(core, 'node_modules')],
  },
};
