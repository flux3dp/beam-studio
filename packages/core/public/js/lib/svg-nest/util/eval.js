// Worker entry for svg-nest parallel.js. The Electron bootstrap (apps/app/public/js/requireConfig.js)
// also loads this file in the main window purely to pin svgedit load order; there `self` is `window`,
// so guard the handler or every window.postMessage (e.g. the YouTube IFrame API) gets eval()ed.
if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
  self.onmessage = function (code) {
    eval(code.data);
  };
}
