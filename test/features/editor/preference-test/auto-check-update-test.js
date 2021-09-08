const { checkExist, setAppPage } = require('../../../util/utils');

test('Check Preference Software Update', async function() {
    const { app } = require('../../../test');
    await setAppPage('#studio/settings');
    const selectupdate = await app.client.$('select#set-auto-update option[value="1"]');
    await selectupdate.click();

    const updatecheck= await app.client.$('select#set-auto-update');
    const updatecheck2 = await updatecheck.getAttribute('value');
    expect(updatecheck2).toEqual('1');

    const done = await app.client.$('div.btn.btn-done');
    await done.click();
    await checkExist('#svgcanvas',15000);
});
