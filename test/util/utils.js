const pause = async (t) => {
    const { app } = require('../test');
    await app.client.pause(t);
};
const checkExist = async (tag, time = 10000, reverse = false) => {
    const { app } = require('../test');
    await app.client.waitForExist(tag, time, reverse);
};
const checkVisible = async (tag, time = 10000, reverse = false) => {
    const { app } = require('../test');
    await app.client.waitForVisible(tag, time, reverse);
};
const updateInput = async (tag, value) => {
    const { app } = require('../test');
    checkVisible(tag, 2500);
    await app.client
        .element(tag)
        .keys(["Control", "a", "\uE003", "NULL"])
        .pause(500)
        .setValue(tag, value);
};

module.exports = { pause, checkExist, checkVisible, updateInput };