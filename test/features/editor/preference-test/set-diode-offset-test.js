const { checkExist, setAppPage } = require('../../../util/utils');

test('Check Preference Hybrid Laser Offset', async function() {
    const { app } = require('../../../test');
    await setAppPage('#studio/settings');
    
    const diodeoffsetx = await app.client.$('input#diode-offset-x-input');
    await diodeoffsetx.doubleClick();
    await app.client.keys(['Delete', '6', '9', 'Enter', "NULL"]);

    const diodeoffsety = await app.client.$('input#diode-offset-y-input');
    await diodeoffsety.doubleClick();
    await app.client.keys(['Delete', '6', 'Enter', "NULL"]);
   
    const offsetxcheck= await app.client.$('input#diode-offset-x-input');
    const offsetxcheck2 = await offsetxcheck.getAttribute('value');
    expect(offsetxcheck2).toEqual('69');

    const offsetycheck_2= await app.client.$('input#diode-offset-y-input');
    const offsetycheck2_2 = await offsetycheck_2.getAttribute('value');
    expect(offsetycheck2_2).toEqual('6');

    const done = await app.client.$('div.btn.btn-done');
    await done.click();

    await checkExist('#svgcanvas',15000);
});
