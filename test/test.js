const electron = require('electron');
const { Application } = require('spectron');
const path = require('path');
const baseDir = path.join(__dirname, '..');

jest.setTimeout(1000000); // increase to 50000 on low spec laptop
let app = null;

beforeAll(async function () {
    app = new Application({
        path: electron,
        args: [baseDir, '--test'],
        webdriverOptions: {
            deprecationWarnings: false,
        }
    });
    return app.start().then (async () => {
        if (process.platform === 'win32') {
            app.browserWindow.focus();
            app.browserWindow.setAlwaysOnTop(true);
        }
    });
});

beforeEach(async () => {
    await app.client.waitUntilWindowLoaded();
});

afterEach(async () => {
    await app.client.pause(1000);
});

afterAll(function() {
    if (app && app.isRunning()) {
        return app.stop();
    }
});

module.exports = {
    get app () {
        return app;
    },
}

test('App Init', async function() {
    console.log(app.browserWindow);
    let isVisible = await app.browserWindow.isVisible();
    expect(isVisible).toBe(true);
    let count = await app.client.getWindowCount();
    // main window, shadow window, ugly noti. window
    expect(count).toEqual(3);
});

require('./features/settings/home-lang-test');
require('./features/editor/editor-tests');
