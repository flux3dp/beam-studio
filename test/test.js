const electron = require('electron');
const { Application } = require('spectron');
const path = require('path');

const { pause, checkExist, checkVisible, updateInput } = require('./util/utils');
const baseDir = path.join(__dirname, '..');

jest.setTimeout(1000000); // increase to 50000 on low spec laptop
let app = null;

beforeAll(async function () {
    app = new Application({
        path: electron,
        args: [baseDir],
        webdriverOptions: {
            deprecationWarnings: false,
        }
    });
    return app.start().then (async () => {
        console.log('app started');
        // app.browserWindow.focus();
        // app.browserWindow.setAlwaysOnTop(true); 
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

test('App Init', async function() {
    let isVisible = await app.browserWindow.isVisible();
    expect(isVisible).toBe(true);
    const client = app.client;
    console.log('client', client);
    let count = await app.client.getWindowCount();

    // main window, main window devtool, shadow window, shadow window devtool, ugly noti. window
    expect(count).toEqual(5);
    console.log(count);
});

require('./features/settings/homeLangTest');

module.exports = {
    get app () {
        console.log(app);
        return app;
    }
}