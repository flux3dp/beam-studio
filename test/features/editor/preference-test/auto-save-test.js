const { checkExist, setAppPage } = require('../../../util/utils');

test('Check Preference Auto Save', async function() {
    const { app } = require('../../../test');
    await setAppPage('#studio/settings');
    const selectAutosave = await app.client.$('select#set-auto-save option[value="TRUE"]');
    await selectAutosave.click();

    const check= await app.client.$('select#set-auto-save');
    const check2 = await check.getAttribute('value');
    expect(check2).toEqual('TRUE');
});

test('Check Preference Auto Save Location', async function() {
    const { app } = require('../../../test');
    const check= await app.client.$('input#location-input');
    const check2 = await check.getAttribute('value');
    expect(check2).not.toEqual('');
});

test('Check Preference Auto Save Every', async function() {
    const { app } = require('../../../test');
    const check= await app.client.$('input#save-every');
    const check2 = await check.getAttribute('value');
    expect(check2).toEqual('10');
});

test('Check Preference Auto Save Number', async function() {
    const { app } = require('../../../test');
    const check= await app.client.$('input#number-of-auto-save');
    const check2 = await check.getAttribute('value');
    expect(check2).toEqual('5');

    const done = await app.client.$('div.btn.btn-done');
    await done.click();
    await checkExist('#svgcanvas',15000);
});