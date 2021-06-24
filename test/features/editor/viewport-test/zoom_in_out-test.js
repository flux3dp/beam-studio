const { pause, checkExist, checkVisible, updateInput } = require('../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../util/actions');


test('Check Zoom In/Out', async function() {
    const { app } = require('../../../test');
    await app.client.execute(() => {
        location.reload();
    });
    await checkExist('#svgcanvas', 15000);

    const zoomin = await app.client.$('div.zoom-btn.zoom-in');
    await zoomin.click();
    const zoomincanvas = await app.client.$('div#svgcanvas');
    await zoomincanvas.getAttribute('style');
    expect(await zoomincanvas.getAttribute('style')).toEqual('position: relative; width: 2447.55px; height: 1713.29px;');
    const zoom_ratio = await app.client.$('div.zoom-ratio');
    await zoom_ratio.getText();
    expect(await zoom_ratio.getText()).toEqual('60%');
    // await new Promise((r) => setTimeout(r, 10000));


    const zoomout = await app.client.$('div.zoom-btn.zoom-out');
    await zoomout.click();
    const zoomoutcanvas2 = await app.client.$('div#svgcanvas');
    await zoomoutcanvas2.getAttribute('style');
    expect(await zoomoutcanvas2.getAttribute('style')).toEqual('position: relative; width: 2039.63px; height: 1427.74px;');
    const zoom_ratio2 = await app.client.$('div.zoom-ratio');
    await zoom_ratio2.getText();
    expect(await zoom_ratio2.getText()).toEqual('50%');


});