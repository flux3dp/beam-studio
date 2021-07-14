const { checkExist, setReload} = require('../../../util/utils');

test('Check Fit To Window', async function() {
    const { app } = require('../../../test');
    await setReload();
    await checkExist('#svgcanvas', 15000);

    const zoomIn = await app.client.$('div.zoom-btn.zoom-in');
    await zoomIn.click();
    await new Promise((r) => setTimeout(r, 1000));

    const zoomIn2 = await app.client.$('div.zoom-btn.zoom-in');
    await zoomIn2.click();
    await new Promise((r) => setTimeout(r, 1000));

    const zoomIn3 = await app.client.$('div.zoom-btn.zoom-in');
    await zoomIn3.click();
    await new Promise((r) => setTimeout(r, 1000));

    const number = await app.client.$('div.zoom-ratio');
    await number.click({button: 2});

    const fittoWindow = await app.client.$('div#fit_to_window');
    await fittoWindow.click();

    await new Promise((r) => setTimeout(r, 1000));

    const zoominCanvas = await app.client.$('div#svgcanvas');
    await zoominCanvas.getAttribute('style');
    expect(await zoominCanvas.getAttribute('style')).toEqual('position: relative; width: 2304.43px; height: 1613.1px;');
    const zoomRatio = await app.client.$('div.zoom-ratio');
    await zoomRatio.getText();
    expect(await zoomRatio.getText()).toEqual('56%');
});
