const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const coreWeb = path.resolve(__dirname, '../../packages/core/src/web');
const app = path.resolve(__dirname, '../app/src');

module.exports = {
  entry: path.resolve(__dirname, 'src/index.tsx'),
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].[chunkhash].bundle.js',
    clean: true,
    hashFunction: 'xxhash64',
  },
  mode: 'development',
  devtool: 'source-map',
  resolve: {
    modules: [path.join(__dirname, 'public/js/lib'), 'node_modules'],
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      react: path.resolve(__dirname, 'node_modules/react'),
      '@core': coreWeb,
      '@app': path.resolve(__dirname, 'src'),
      /* from beam-studio */
      jquery: path.join(__dirname, 'public/js/lib/svgeditor/jquery'),
      underscore: path.join(__dirname, 'public/js/lib/underscore'),
      svgeditor: path.join(__dirname, 'public/js/lib/svgeditor'),
      imagetracer: path.join(__dirname, 'public/js/lib/svgeditor/imagetracer'),
      jqueryGrowl: path.join(__dirname, 'public/js/lib/jquery.growl'),
      dxf2svg: path.join(__dirname, 'public/js/lib/dxf2svg'),
      // SVG Editor Libraries Begin
      jsHotkeys: path.join(__dirname, 'public/js/lib/svgeditor/js-hotkeys/jquery.hotkeys.min'),
      jquerybbq: path.join(__dirname, 'public/js/lib/svgeditor/jquerybbq/jquery.bbq.min'),
      svgicons: path.join(__dirname, 'public/js/lib/svgeditor/svgicons/jquery.svgicons'),
      jgraduate: path.join(__dirname, 'public/js/lib/svgeditor/jgraduate/jquery.jgraduate.min'),
      spinbtn: path.join(__dirname, 'public/js/lib/svgeditor/spinbtn/JQuerySpinBtn.min'),
      touch: path.join(__dirname, 'public/js/lib/svgeditor/touch'),
      svgedit: path.join(__dirname, 'public/js/lib/svgeditor/svgedit'),
      jquerySvg: path.join(__dirname, 'public/js/lib/svgeditor/jquery-svg'),
      jqueryContextMenu: path.join(
        __dirname,
        'public/js/lib/svgeditor/contextmenu/jquery.contextMenu',
      ),
      pathseg: path.join(__dirname, 'public/js/lib/svgeditor/pathseg'),
      browser: path.join(__dirname, 'public/js/lib/svgeditor/browser'),
      svgtransformlist: path.join(__dirname, 'public/js/lib/svgeditor/svgtransformlist'),
      math: path.join(__dirname, 'public/js/lib/svgeditor/math'),
      units: path.join(__dirname, 'public/js/lib/svgeditor/units'),
      svgutils: path.join(__dirname, 'public/js/lib/svgeditor/svgutils'),
      sanitize: path.join(__dirname, 'public/js/lib/svgeditor/sanitize'),
      coords: path.join(__dirname, 'public/js/lib/svgeditor/coords'),
      recalculate: path.join(__dirname, 'public/js/lib/svgeditor/recalculate'),
      draw: path.join(__dirname, 'public/js/lib/svgeditor/draw'),
      layer: path.join(__dirname, 'public/js/lib/svgeditor/layer'),
      path: path.join(__dirname, 'public/js/lib/svgeditor/path'),
      jqueryUi: path.join(
        __dirname,
        'public/js/lib/svgeditor/jquery-ui/jquery-ui-1.8.17.custom.min',
      ),
      jpicker: path.join(__dirname, 'public/js/lib/svgeditor/jgraduate/jpicker'),
      canvg: path.join(__dirname, 'public/js/lib/svgeditor/canvg/canvg'),
      rgbcolor: path.join(__dirname, 'public/js/lib/svgeditor/canvg/rgbcolor'),
    },
    fallback: {
      fs: false,
      stream: false,
      util: false,
      buffer: false,
      events: false,
    },
  },
  module: {
    rules: [
      {
        test: /\.worker\.ts$/,
        loader: 'worker-loader',
        options: {
          filename: '[name].[contenthash].worker.js',
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
        test: /\.module\.s[ac]ss$/,
        exclude: /node_modules/,
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
          },
        ],
      },
      {
        test: /\.scss$/i,
        exclude: /\.module\.s[ac]ss$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
      },
      {
        test: /\.css$/i,
        exclude: /\.module\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.(woff(2)?|ttf|eot|png)$/,
        use: ['file-loader'],
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
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'index.html'),
      clean: true,
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
};
