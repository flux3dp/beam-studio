const { pause, checkExist, checkVisible, updateInput } = require('../../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../../util/actions');

test('Check Drag Layer', async function() {
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

    const choosedraglayer = await app.client.$('[data-test-key="layer-1"]'); 
    await choosedraglayer.dragAndDrop({x:0, y:30}); 

    const checklayer1color = await app.client.$('div#layerbackgroundColor-2');
    expect(await checklayer1color.getAttribute('style')).toEqual("background-color: rgb(63, 81, 181);");
});