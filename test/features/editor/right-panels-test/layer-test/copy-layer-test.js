const { pause, checkExist, checkVisible, updateInput } = require('../../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../../util/actions');

test('Check Copy Layer', async function() {
    const { app } = require('../../../../test');
    
    await app.client.execute(() => {
        location.reload();
    });
    await checkExist('#svgcanvas', 15000);

    const rightclick = await app.client.$('[data-test-key="layer-0"]');
    await rightclick.click({ button: 2});

    const choosedupe = await app.client.$('div#dupelayer');
    await choosedupe.click();

    const checklayername = await app.client.$('[data-test-key="layer-1"]');
    await checklayername.getText();

    // console.log(await checklayername.getText('class'));
    expect(await checklayername.getText()).toEqual('預設圖層 copy');

    
    
});