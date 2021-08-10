
(function(G) {
    const path = require('path');

    const { ipcRenderer, remote } = require('electron');
    const events = require(path.join(__dirname, 'ipc-events'));

    // For modules not loadable in renderer process
    G.nodeModules = {
        '@sentry/electron': require('@sentry/electron'),
    }

    G.electron = {
        ipc: ipcRenderer,
        events: events,
        remote,
    }
})(global)
