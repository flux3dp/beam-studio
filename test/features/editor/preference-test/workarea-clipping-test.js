const { checkExist, setAppPage } = require('../../../util/utils');

test('Check Preference Workarea Clipping', async function() {
    const { app } = require('../../../test');
    
    await checkExist('#svgcanvas',15000);

    await setAppPage('#studio/settings');

    const speedlimit = await app.client.$('select#set-mask option[value="TRUE"]');
    await speedlimit.click();

    const speedcheck= await app.client.$('select#set-mask');
    const speedcheck2 = await speedcheck.getAttribute('value');
    expect(speedcheck2).toEqual('TRUE');

    const done = await app.client.$('div.btn.btn-done');
    await done.click();
    
    await checkExist('#svgcanvas',15000);
});