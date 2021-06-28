const { checkExist } = require('../../../util/utils');
const { dialog } = require('electron');

test('Check Preference Update', async function() {
    const { app } = require('../../../test');
    
    await checkExist('#svgcanvas',15000);

    await app.client.execute(() => {
        location.hash = '#studio/settings';
    });
    const selectupdate = await app.client.$('select#qa-set-groups-update option[value="0"]');
    await selectupdate.click();
    const updatecheck= await app.client.$('select#qa-set-groups-update');
    const updatecheck2 = await updatecheck.getAttribute('value');
    expect(updatecheck2).toEqual('0');

    const done = await app.client.$('div.btn.btn-done');
    await done.click();

    await checkExist('#svgcanvas',15000);


});