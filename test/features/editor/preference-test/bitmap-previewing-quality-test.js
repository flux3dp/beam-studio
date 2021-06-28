const { checkExist, setAppPage } = require('../../../util/utils');

test('Check Preference Bitmap Previewing Quality ', async function() {
    const { app } = require('../../../test');
    
    await checkExist('#svgcanvas',15000);

    await setAppPage('#studio/settings');
    const downsampling = await app.client.$('select#qa-set-downsampling option[value="FALSE"]');
    await downsampling.click();

    const downsamplingcheck= await app.client.$('select#qa-set-simplify-clipper-path');
    const downsamplingcheck2 = await downsamplingcheck.getAttribute('value');
    expect(downsamplingcheck2).toEqual('FALSE');

    const done = await app.client.$('div.btn.btn-done');
    await done.click();
    

    await checkExist('#svgcanvas',15000);
});