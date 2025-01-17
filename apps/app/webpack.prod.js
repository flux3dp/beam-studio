const { merge } = require('webpack-merge');
const config = require('./webpack.config.js');
const { sentryWebpackPlugin } = require("@sentry/webpack-plugin");

const prodConfig = config.map((c) => {

  return merge(c, {
    mode: 'production',
    plugins: c.entry === './src/main.ts' ? [
      sentryWebpackPlugin({
        org: "flux3dp",
        project: "beam-studio",
        authToken: process.env.SENTRY_AUTH_TOKEN,
        telemetry: false,
      }),
    ] : undefined,
  });
});

module.exports = prodConfig;
