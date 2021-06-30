const { checkExist, setAppPage } = require('../../../util/utils');

test('Check Preference Hybrid Laser Offset', async function() {
    const { app } = require('../../../test');
    await setAppPage('#studio/settings');
    
    const diodeoffsetx = await app.client.$('input#qa-settings-diode-offsetx');
    await diodeoffsetx.doubleClick();
    await app.client.keys(['Delete', '6', '9', 'Enter', "NULL"]);

    const diodeoffsety = await app.client.$('input#qa-settings-diode-offsety');
    await diodeoffsety.doubleClick();
    await app.client.keys(['Delete', '7', 'Enter', "NULL"]);
   
    const offsetxcheck= await app.client.$('input#qa-settings-diode-offsetx');
    const offsetxcheck2 = await offsetxcheck.getAttribute('value');
    expect(offsetxcheck2).toEqual('69');

    const offsetycheck_2= await app.client.$('input#qa-settings-diode-offsety');
    const offsetycheck2_2 = await offsetycheck_2.getAttribute('value');
    expect(offsetycheck2_2).toEqual('7.00');

    const done = await app.client.$('div.btn.btn-done');
    await done.click();

    await checkExist('#svgcanvas',15000);
});
