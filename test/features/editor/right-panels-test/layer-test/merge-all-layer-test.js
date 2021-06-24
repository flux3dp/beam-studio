const { pause, checkExist, checknotExist, checkVisible, updateInput } = require('../../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../../util/actions');

test('Check Merge All Layer', async function() {
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

    const add4 = await app.client.$('div.add-layer-btn');
    await add4.click();

    const add5 = await app.client.$('div.add-layer-btn');
    await add5.click();

    await checkExist('[data-test-key="layer-1"]');
    await checkExist('[data-test-key="layer-2"]');
    await checkExist('[data-test-key="layer-3"]');
    await checkExist('[data-test-key="layer-4"]');
    await checkExist('[data-test-key="layer-5"]');

    const rightclick = await app.client.$('[data-test-key="layer-5"]');
    await rightclick.click({ button: 2});
    const choosemergeall = await app.client.$('div#merge_all_layer');
    await choosemergeall.click();

    await checkExist('[data-test-key="layer-0"]');
    await checknotExist('[data-test-key="layer-1"]');
    await checknotExist('[data-test-key="layer-2"]');
    await checknotExist('[data-test-key="layer-3"]');
    await checknotExist('[data-test-key="layer-4"]');
    await checknotExist('[data-test-key="layer-5"]');
    
    
});