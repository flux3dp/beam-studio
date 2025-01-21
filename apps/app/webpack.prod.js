const { sentryWebpackPlugin } = require('@sentry/webpack-plugin');
const { merge } = require('webpack-merge');

const defaultConfig = require('./webpack.config.js');

module.exports = defaultConfig.map((config) => {
  return merge(config, {
    mode: 'production',
    plugins:
      config.entry === './src/main.ts'
        ? [
            sentryWebpackPlugin({
              authToken: process.env.SENTRY_AUTH_TOKEN,
              org: 'flux3dp',
              project: 'beam-studio',
              silent: true,
              telemetry: false,
            }),
          ]
        : undefined,
  });
});
