const { checkExist, setAppPage } = require('../../../util/utils');

test('Check Preference Canvas Model', async function() {
    const { app } = require('../../../test');
    
    await checkExist('#svgcanvas',15000);

    await setAppPage('#studio/settings');
    const fbm1canvas = await app.client.$('select#qa-set-beambox-model option[value="fbm1"]');
    await fbm1canvas.click();

    const fbm1check= await app.client.$('select#qa-set-beambox-model');
    const fbm1check2 = await fbm1check.getAttribute('value');
    expect(fbm1check2).toEqual('fbm1');

    const done = await app.client.$('div.btn.btn-done');
    await done.click();

    await checkExist('#svgcanvas',15000);
    
    const fbm1heightcheck= await app.client.$("svg#canvasBackground")
    const fbm1heightcheck2 = await fbm1heightcheck.getAttribute('height');
    expect(fbm1heightcheck2).toEqual('537.6999999999999');

    const fbm1widthcheck= await app.client.$("svg#canvasBackground")
    const fbm1widthcheck2 = await fbm1widthcheck.getAttribute('width');
    expect(fbm1widthcheck2).toEqual('768.1428571428571');

    await setAppPage('#studio/settings');
    const fbb1bcanvas2 = await app.client.$('select#qa-set-beambox-model option[value="fbb1b"]');
    await fbb1bcanvas2.click();

    const fbb1bcheck= await app.client.$('select#qa-set-beambox-model');
    const fbb1bcheck2 = await fbb1bcheck.getAttribute('value');
    expect(fbb1bcheck2).toEqual('fbb1b');

    const done2 = await app.client.$('div.btn.btn-done');
    await done2.click();

    await checkExist('#svgcanvas',15000);
    
    const fbb1bheightcheck= await app.client.$("svg#canvasBackground")
    const fbb1bheightcheck2 = await fbb1bheightcheck.getAttribute('height');
    expect(fbb1bheightcheck2).toEqual('537.6999999999999');

    const fbb1bwidthcheck= await app.client.$("svg#canvasBackground")
    const fbb1bwidthcheck2 = await fbb1bwidthcheck.getAttribute('width');
    expect(fbb1bwidthcheck2).toEqual('573.5466666666666');


    await setAppPage('#studio/settings');
    // fbb1b position: relative; width: 1513.35px; height: 1418.77px;
    // fbb1p position: relative; width: 1513.35px; height: 945.844px;
    const fbb1pcanvas2 = await app.client.$('select#qa-set-beambox-model option[value="fbb1p"]');
    await fbb1pcanvas2.click();

    const fbb1pcheck= await app.client.$('select#qa-set-beambox-model');
    const fbb1pcheck2 = await fbb1pcheck.getAttribute('value');
    expect(fbb1pcheck2).toEqual('fbb1p');

    const done3 = await app.client.$('div.btn.btn-done');
    await done3.click();

    await checkExist('#svgcanvas',15000);
    
    const fbb1pheightcheck= await app.client.$("svg#canvasBackground")
    const fbb1pheightcheck2 = await fbb1pheightcheck.getAttribute('height');
    expect(fbb1pheightcheck2).toEqual('537.6999999999999');

    const fbb1pwidthcheck= await app.client.$("svg#canvasBackground")
    const fbb1pwidthcheck2 = await fbb1pwidthcheck.getAttribute('width');
    expect(fbb1pwidthcheck2).toEqual('860.3199999999999');



    
});