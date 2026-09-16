// Jest counterpart of webpack's `*.svg?raw` rule (type: 'asset/source'): exports the file text.
module.exports = {
  process(src) {
    return { code: `module.exports = { __esModule: true, default: ${JSON.stringify(src)} };` };
  },
};
