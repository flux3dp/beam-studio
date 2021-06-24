const { pause, checkExist, checkVisible, updateInput } = require('../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../util/actions');


test('Check Fit To Window', async function() {
    const { app } = require('../../../test');
    await app.client.execute(() => {
        location.reload();
    });
    await checkExist('#svgcanvas', 15000);

    const zoomin = await app.client.$('div.zoom-btn.zoom-in');
    await zoomin.click();
    await new Promise((r) => setTimeout(r, 1000));

    const zoomin2 = await app.client.$('div.zoom-btn.zoom-in');
    await zoomin2.click();
    await new Promise((r) => setTimeout(r, 1000));

    const zoomin3 = await app.client.$('div.zoom-btn.zoom-in');
    await zoomin3.click();
    await new Promise((r) => setTimeout(r, 1000));

    const number = await app.client.$('div.zoom-ratio');
    await number.click({button: 2});

    const fittowindow = await app.client.$('div#fit_to_window');
    await fittowindow.click();

    await new Promise((r) => setTimeout(r, 1000));

    const zoomincanvas = await app.client.$('div#svgcanvas');
    await zoomincanvas.getAttribute('style');
    expect(await zoomincanvas.getAttribute('style')).toEqual('position: relative; width: 2304.43px; height: 1613.1px;');
    const zoom_ratio = await app.client.$('div.zoom-ratio');
    await zoom_ratio.getText();
    expect(await zoom_ratio.getText()).toEqual('56%');
    // await new Promise((r) => setTimeout(r, 10000));

});