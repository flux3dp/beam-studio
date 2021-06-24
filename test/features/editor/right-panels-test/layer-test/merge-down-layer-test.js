const { pause, checkExist, checknotExist, checkVisible, updateInput } = require('../../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../../util/actions');

test('Check Merge Down Layer', async function() {
    const { app } = require('../../../../test');
    
    await app.client.execute(() => {
        location.reload();
    });
    await checkExist('#svgcanvas', 15000);

    const add1 = await app.client.$('div.add-layer-btn');
    await add1.click();

    const add2 = await app.client.$('div.add-layer-btn');
    await add2.click();

    const checklayer2color = await app.client.$('div#layerbackgroundColor-2');
    expect(await checklayer2color.getAttribute('style')).toEqual("background-color: rgb(244, 67, 54);");

    const rightclick = await app.client.$('[data-test-key="layer-2"]');
    await rightclick.click({ button: 2});
    const choosemergedown = await app.client.$('div#merge_down_layer');
    await choosemergedown.click();

    await checknotExist('div#layerbackgroundColor-2');

    const checklayer1color = await app.client.$('div#layerbackgroundColor-1');
    expect(await checklayer1color.getAttribute('style')).toEqual("background-color: rgb(63, 81, 181);");

});