const { checkExist, setAppPage } = require('../../../util/utils');

test('Check Preference Preview Camera Speed ', async function() {
    const { app } = require('../../../test');
    await setAppPage('#studio/settings');

    const selectcameraspeed = await app.client.$('input#preview-input');
    await selectcameraspeed.doubleClick();
    await app.client.keys(['Delete', '1', '5', '0', 'Enter', "NULL"]);

    const selectcameraspeed2 = await app.client.$('input#diode-preview-input');
    await selectcameraspeed2.doubleClick();
    await app.client.keys(['Delete', '5', '0', 'Enter', "NULL"]);
   
    const speedcheck= await app.client.$('input#preview-input');
    const speedcheck2 = await speedcheck.getAttribute('value');
    expect(speedcheck2).toEqual('150');

    const speedcheck_2= await app.client.$('input#diode-preview-input');
    const speedcheck2_2 = await speedcheck_2.getAttribute('value');
    expect(speedcheck2_2).toEqual('50');

    const done = await app.client.$('div.btn.btn-done');
    await done.click();

    await checkExist('#svgcanvas',15000);    
});
