const { pause, checkExist, checknotExist, checkVisible, updateInput } = require('../../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../../util/editor-utils');
const { mouseAction, keyAction, testAction } = require('../../../../util/actions');

test('Check Merge Selected Layer', async function() {
    const { app } = require('../../../../test');
    
    await app.client.execute(() => {
        location.reload();
    });
    await checkExist('#svgcanvas', 15000);
    const add1 = await app.client.$('div.add-layer-btn');
    await add1.click();

    const add2 = await app.client.$('div.add-layer-btn');
    await add2.click();

    const add3 = await app.client.$('div.add-layer-btn');
    await add3.click();

    await checkExist('[data-test-key="layer-1"]');
    await checkExist('[data-test-key="layer-2"]');
    await checkExist('[data-test-key="layer-3"]');
    
    const rightclick1 = await app.client.$('[data-test-key="layer-1"]');
    await rightclick1.click();
    await new Promise((r) => setTimeout(r, 2000));
    console.log(await rightclick1.getLocation());

    const rightclick2 = await app.client.$('[data-test-key="layer-2"]');
    // await rightclick2.click();
    // await app.client.keys(['Shift']);
    await keyAction([
        { type: 'keyDown', value:'\uE008' },
    ]);
    await mouseAction([
        { type: 'pointerMove', x: 1043, y: 150, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerUp', button: 2, },
    ]);
    await keyAction([
        { type: 'keyUp', value:'\uE008' },
    ]);
    

    const rightclick3 = await app.client.$('[data-test-key="layer-2"]');
    await rightclick3.click({ button: 2 });
    const choosemergeall = await app.client.$('div#merge_select_layer');
    await choosemergeall.click();

    await new Promise((r) => setTimeout(r, 10000));
    
});