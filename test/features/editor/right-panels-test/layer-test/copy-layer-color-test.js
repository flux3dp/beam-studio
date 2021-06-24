const { pause, checkExist, checkVisible, updateInput } = require('../../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../../util/actions');

test('Check Color of Copy Layer', async function() {
    const { app } = require('../../../../test');
    
    await app.client.execute(() => {
        location.reload();
    });
    await checkExist('#svgcanvas', 15000);

    const rightclick = await app.client.$('[data-test-key="layer-0"]');
    await rightclick.click({ button: 2});

    const choosedupe = await app.client.$('div#dupelayer');
    await choosedupe.click();

    const checklayer0color = await app.client.$('div#layerbackgroundColor-0');
    await checklayer0color.getAttribute('style');
    // console.log(await checklayer0color.getAttribute('style'));


    const checklayer1color = await app.client.$('div#layerbackgroundColor-1');
    await checklayer1color.getAttribute('style');
    // console.log(await checklayer1color.getAttribute());

    expect(await checklayer0color.getAttribute('style')).toEqual(await checklayer1color.getAttribute('style'));

    
    
});