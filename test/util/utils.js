const application = require('../test');
const electron = require('electron');

const pause = async (t) => {
    const { app } = application;
    await app.client.pause(t);
};
const checkExist = async (tag, time = 10000, reverse = false) => {
    const { app } = application;
    const start = Date.now();
    while (Date.now() < start + time) {
        const elem = await app.client.$(tag);
        if (!elem.error) {
            return true;
        }
    }
    throw `Element ${tag} does not exist after ${time}`;
};
const checkVisible = async (tag, time = 10000, reverse = false) => {
    const { app } = application;
    await app.client.waitForDisplayed(tag, time, reverse);
};
const updateInput = async (tag, value) => {
    const { app } = application;
    checkVisible(tag, 2500);
    await app.client
        .$(tag)
        .setText(["Control", "a", "\uE003", "NULL"])
        .pause(500)
        .setValue(tag, value);
};

const setAppStorage = async (storage) => {
    const { app } = application;
    const store = await app.client.execute((storage) => {
        const Store = require('electron-store');
        const s = new Store();
        for (let key in storage) {
            s.set(key, storage[key]);
        }
        return s.store;
    }, storage);
    return store;
};

const restartApp = async () => {
    const { app } = application;
    if (app && app.isRunning()) {
        await app.stop();
    }

    await app.start();

    if (process.platform === 'win32') {
        app.browserWindow.focus();
        app.browserWindow.setAlwaysOnTop(true);
    }
    return app;
};

const restartAndSetStorage = async () => {
    const app = await restartApp();
    await setDefaultStorage();
    return app;
};

const setDefaultStorage = async () => {
    // console.log(electron)
    await setAppStorage({
        'printer-is-ready': true,
        'enable-sentry': 0,
        'active-lang': 'zh-tw',
        'last-installed-version': '1.6.1-alpha',
        'questionnaire-version': 1,
        'alert-config': {
            'skip-interface-tutorial': true,
        },
        'beambox-preference': {
            should_remind_calibrate_camera: false,
            model: "fbm1",
            show_guides: false,
            guide_x0: 0,
            guide_y0: 0,
            engrave_dpi: "medium",
            workarea: "fbm1",
            show_rulers: true,
            use_layer_color: true,
        },
    });
};

module.exports = {
    pause,
    checkExist,
    checkVisible,
    updateInput,
    setAppStorage,
    setDefaultStorage,
    restartApp,
    restartAndSetStorage
};