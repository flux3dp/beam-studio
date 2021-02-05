
(function(G) {
    const path = require('path');

    const {ipcRenderer, webFrame, remote} = require('electron');
    const events = require(path.join(__dirname, 'ipc-events'));

    // For modules not loadable in renderer process
    G.nodeModules = {
        '@sentry/electron': require('@sentry/electron'),
    }

    G.electron = {
        ipc: ipcRenderer,
        events: events,
        version: remote.app.getVersion(),
        trigger_file_input_click: (inputId) => {
            if(inputId.match(/^[a-zA-Z0-9\-\_]+$/)) {
                webFrame.executeJavaScript(
                    `document.querySelector("[data-file-input=${inputId}]").click()`, true);
            }
        }
    }
})(global)
