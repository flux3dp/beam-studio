const { merge } = require('webpack-merge');
const defaultConfig = require('./webpack.config.js');
const { sentryWebpackPlugin } = require('@sentry/webpack-plugin');

const prodConfig = defaultConfig.map((config) => {
  return merge(config, {
    mode: 'production',
    plugins:
      config.entry === './src/main.ts'
        ? [
            sentryWebpackPlugin({
              org: 'flux3dp',
              project: 'beam-studio',
              authToken: process.env.SENTRY_AUTH_TOKEN,
              silent: true,
              telemetry: false,
            }),
          ]
        : undefined,
  });
});

module.exports = prodConfig;
