const { pause, checkExist, checkVisible, updateInput } = require('../../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../../util/actions');

test('Check Lock Layer', async function() {
    const { app } = require('../../../../test');
    
    await app.client.execute(() => {
        location.reload();
    });
    await checkExist('#svgcanvas', 15000);
    const rightclick = await app.client.$('[data-test-key="layer-0"]');
    await rightclick.click({ button: 2});
    const chooselock = await app.client.$('div#locklayer');
    await chooselock.click();
    const rightclick2 = await app.client.$('[data-test-key="layer-0"]');
    await rightclick2.getAttribute('class');
    // console.log(await rightclick2.getAttribute('class'));
    expect(await rightclick2.getAttribute('class')).toEqual('layer layersel lock current');
    await checkExist('div#layerlock-0', 15000);

});