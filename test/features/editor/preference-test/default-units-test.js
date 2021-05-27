const { pause, checkExist, checkVisible, updateInput } = require('../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../util/actions');
const { dialog } = require('electron');

test('Check Preference Units', async function() {
    const { app } = require('../../../test');
    
    await checkExist('#svgcanvas',15000);

    await app.client.execute(() => {

        location.hash = '#studio/settings';

    });

    const units = await app.client.$('select#qa-set-groups-editor option[value="inches"]');
    await units.click();

    const unitscheck= await app.client.$('select#qa-set-groups-editor');
    const unitscheck2 = await unitscheck.getAttribute('value');
    expect(unitscheck2).toEqual('inches');

    const done = await app.client.$('a.btn.btn-done');
    await done.click();

    await checkExist('#svgcanvas',15000);

    const rect = await app.client.$('#left-Rectangle');
    await rect.click();

    await mouseAction([
        { type: 'pointerMove', x: 300, y: 300, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 400, y: 400, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    
    await checkExist('#svg_1');

    const widthcheck= await app.client.$('input#qa-width');
    const widthcheck2 = await widthcheck.getAttribute('value');
    expect(widthcheck2).toEqual('1.5513');//1.5513

    const lengthcheck= await app.client.$('input#qa-height');
    const lengthcheck2 = await lengthcheck.getAttribute('value');
    expect(lengthcheck2).toEqual('1.5513');
    // await new Promise((r) => setTimeout(r, 100000));



});