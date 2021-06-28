const { checkExist, setAppPage } = require('../../../util/utils');


test('Check Preference Notification', async function() {
    const { app } = require('../../../test');
    
    await checkExist('#svgcanvas',15000);

    await setAppPage('#studio/settings');
    const selectnoti = await app.client.$('select#qa-set-notifications option[value="1"]');
    await selectnoti.click();
    const noticheck= await app.client.$('select#qa-set-notifications');
    const noticheck2 = await noticheck.getAttribute('value');
    expect(noticheck2).toEqual('1');

    const done = await app.client.$('div.btn.btn-done');
    await done.click();

    await checkExist('#svgcanvas',15000);

    

});