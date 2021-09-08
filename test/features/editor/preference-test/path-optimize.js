const { checkExist, setAppPage } = require('../../../util/utils');

test('Check Preference Path Optimize', async function() {
    const { app } = require('../../../test');
    await setAppPage('#studio/settings');
    
    const speedlimit = await app.client.$('select#set-simplify-clipper-path option[value="TRUE"]');
    await speedlimit.click();

    const speedcheck= await app.client.$('select#set-simplify-clipper-path');
    const speedcheck2 = await speedcheck.getAttribute('value');
    expect(speedcheck2).toEqual('TRUE');

    const done = await app.client.$('div.btn.btn-done');
    await done.click();

    await checkExist('#svgcanvas',15000);
});
