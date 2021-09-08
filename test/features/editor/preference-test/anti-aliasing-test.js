const { checkExist, setAppPage } = require('../../../util/utils');

test('Check Preference Anti Aliasing', async function() {
    const { app } = require('../../../test');
    await setAppPage('#studio/settings');
    const selectAntialiasing = await app.client.$('select#set-anti-aliasing option[value="TRUE"]');
    await selectAntialiasing.click();

    const check= await app.client.$('select#set-anti-aliasing');
    const check2 = await check.getAttribute('value');
    expect(check2).toEqual('TRUE');

    const done = await app.client.$('div.btn.btn-done');
    await done.click();
    await checkExist('#svgcanvas',15000);
});
