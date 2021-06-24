const { pause, checkExist, checknotExist, checkVisible, updateInput } = require('../../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../../util/actions');

test('Check Merge All Layer', async function() {
    const { app } = require('../../../../test');
    
    await app.client.execute(() => {
        location.reload();
    });
    await checkExist('#svgcanvas', 15000);
    const rightclick = await app.client.$('[data-test-key="layer-0"]');
    await rightclick.click({ button: 2});
    const choosedeletelayer = await app.client.$('div#deletelayer');
    await choosedeletelayer.click();

    await checkExist('[data-test-key="layer-0"]');


    
});