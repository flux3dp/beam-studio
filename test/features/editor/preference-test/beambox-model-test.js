const { checkExist, setAppPage } = require('../../../util/utils');

test('Check Preference Canvas Model - Beamo', async function() {
    const { app } = require('../../../test');
    await setAppPage('#studio/settings');

    const fbm1canvas = await app.client.$('select#set-default-model option[value="fbm1"]');
    await fbm1canvas.click();

    const fbm1check= await app.client.$('select#set-default-model');
    const fbm1check2 = await fbm1check.getAttribute('value');
    expect(fbm1check2).toEqual('fbm1');

    const done = await app.client.$('div.btn.btn-done');
    await done.click();

    await checkExist('#svgcanvas',15000);
    if(process.platform === 'darwin'){
        const fbm1heightcheck= await app.client.$("svg#canvasBackground")
        const fbm1heightcheck2 = await fbm1heightcheck.getAttribute('height');
        expect(Math.round(fbm1heightcheck2)).toEqual(565);
        
        const fbm1widthcheck= await app.client.$("svg#canvasBackground")
        const fbm1widthcheck2 = await fbm1widthcheck.getAttribute('width');
        expect(Math.round(fbm1widthcheck2)).toEqual(808);
    } 
    else{
        const fbm1heightcheck= await app.client.$("svg#canvasBackground")
        const fbm1heightcheck2 = await fbm1heightcheck.getAttribute('height');
        expect(Math.round(fbm1heightcheck2)).toEqual(538);

        const fbm1widthcheck= await app.client.$("svg#canvasBackground")
        const fbm1widthcheck2 = await fbm1widthcheck.getAttribute('width');
        expect(Math.round(fbm1widthcheck2)).toEqual(768);
    }
});

test('Check Preference Canvas Model - Beambox', async function() {
    const { app } = require('../../../test');
    await setAppPage('#studio/settings');

    const fbb1bcanvas2 = await app.client.$('select#set-default-model option[value="fbb1b"]');
    await fbb1bcanvas2.click();

    const fbb1bcheck= await app.client.$('select#set-default-model');
    const fbb1bcheck2 = await fbb1bcheck.getAttribute('value');
    expect(fbb1bcheck2).toEqual('fbb1b');

    const done2 = await app.client.$('div.btn.btn-done');
    await done2.click();
    await checkExist('#svgcanvas',15000);
    if(process.platform === 'darwin'){
        const fbb1bheightcheck= await app.client.$("svg#canvasBackground")
        const fbb1bheightcheck2 = await fbb1bheightcheck.getAttribute('height');
        expect(Math.round(fbb1bheightcheck2)).toEqual(565);

        const fbb1bwidthcheck= await app.client.$("svg#canvasBackground")
        const fbb1bwidthcheck2 = await fbb1bwidthcheck.getAttribute('width');
        expect(Math.round(fbb1bwidthcheck2)).toEqual(603);
    } 
    else{
        const fbb1bheightcheck= await app.client.$("svg#canvasBackground")
        const fbb1bheightcheck2 = await fbb1bheightcheck.getAttribute('height');
        expect(Math.round(fbb1bheightcheck2)).toEqual(538);

        const fbb1bwidthcheck= await app.client.$("svg#canvasBackground")
        const fbb1bwidthcheck2 = await fbb1bwidthcheck.getAttribute('width');
        expect(Math.round(fbb1bwidthcheck2)).toEqual(574);
    }
});

test('Check Preference Canvas Model - Beamboxpro', async function() {
    const { app } = require('../../../test');
    await setAppPage('#studio/settings');
    const fbb1pcanvas2 = await app.client.$('select#set-default-model option[value="fbb1p"]');
    await fbb1pcanvas2.click();

    const fbb1pcheck= await app.client.$('select#set-default-model');
    const fbb1pcheck2 = await fbb1pcheck.getAttribute('value');
    expect(fbb1pcheck2).toEqual('fbb1p');

    const done3 = await app.client.$('div.btn.btn-done');
    await done3.click();
    await checkExist('#svgcanvas',15000);
    if(process.platform === 'darwin'){
        const fbb1pheightcheck= await app.client.$("svg#canvasBackground")
        const fbb1pheightcheck2 = await fbb1pheightcheck.getAttribute('height');
        expect(Math.round(fbb1pheightcheck2)).toEqual(565);
        const fbb1pwidthcheck= await app.client.$("svg#canvasBackground")
        const fbb1pwidthcheck2 = await fbb1pwidthcheck.getAttribute('width');
        expect(Math.round(fbb1pwidthcheck2)).toEqual(904);
    } 
    else{
        const fbb1pheightcheck= await app.client.$("svg#canvasBackground")
        const fbb1pheightcheck2 = await fbb1pheightcheck.getAttribute('height');
        expect(Math.round(fbb1pheightcheck2)).toEqual(538);

        const fbb1pwidthcheck= await app.client.$("svg#canvasBackground")
        const fbb1pwidthcheck2 = await fbb1pwidthcheck.getAttribute('width');
        expect(Math.round(fbb1pwidthcheck2)).toEqual(860);
    }
});
