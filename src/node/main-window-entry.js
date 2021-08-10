
(function(G) {
    const path = require('path');

    const { ipcRenderer, remote } = require('electron');
    const events = require(path.join(__dirname, 'ipc-events'));

    G.electron = {
        ipc: ipcRenderer,
        events: events,
        remote,
    }
})(global)
