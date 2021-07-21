const { checkExist, setAppPage } = require('../../../util/utils');

test('Check Preference Vector Speed Constraint', async function() {
    const { app } = require('../../../test');
    await setAppPage('#studio/settings');

    const speedlimit = await app.client.$('select#set-vector-speed-contraint option[value="FALSE"]');
    await speedlimit.click();

    const speedcheck= await app.client.$('select#set-vector-speed-contraint');
    const speedcheck2 = await speedcheck.getAttribute('value');
    expect(speedcheck2).toEqual('FALSE');

    const done = await app.client.$('div.btn.btn-done');
    await done.click();
    
    await checkExist('#svgcanvas',15000);
});
