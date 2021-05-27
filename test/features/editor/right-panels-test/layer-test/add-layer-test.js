const { pause, checkExist, checkVisible, updateInput } = require('../../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../../util/actions');

test('Strength Add Layer', async function() {
    const { app } = require('../../../../test');
    
    await app.client.execute(() => {
        location.reload();
    });

    const add = await app.client.$('div.add-layer-btn');
    await add.click();

    const add1 = await app.client.$('div.add-layer-btn');
    await add1.click();

    const add2 = await app.client.$('div.add-layer-btn');
    await add2.click();

    const add3 = await app.client.$('div.add-layer-btn');
    await add3.click();

    const add4 = await app.client.$('div.add-layer-btn');
    await add4.click();

    await checkExist('[data-test-key="layer-0"]');
    await checkExist('[data-test-key="layer-1"]');
    await checkExist('[data-test-key="layer-2"]');
    await checkExist('[data-test-key="layer-3"]');
    await checkExist('[data-test-key="layer-4"]');

    // const checklevel = await app.client.$('#layerlist > p'); 
    // console.log(checklevel);


    // const layer1check = await app.client.$('[data-test-key="layer-0"]');

});