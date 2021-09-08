const { checkExist, setAppPage } = require('../../../util/utils');

test('Check Preference Bitmap Previewing Quality ', async function() {
    const { app } = require('../../../test');
    await setAppPage('#studio/settings');
    
    const downsampling = await app.client.$('select#set-bitmap-quality option[value="FALSE"]');
    await downsampling.click();

    const downsamplingcheck= await app.client.$('select#set-bitmap-quality');
    const downsamplingcheck2 = await downsamplingcheck.getAttribute('value');
    expect(downsamplingcheck2).toEqual('FALSE');

    const done = await app.client.$('div.btn.btn-done');
    await done.click();

    await checkExist('#svgcanvas',15000);
});
