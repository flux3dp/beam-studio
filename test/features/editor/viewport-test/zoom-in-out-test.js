const { checkExist, setReload} = require('../../../util/utils');
const { mouseAction } = require('../../../util/actions');

test('Check Zoom In/Out', async function() {
    const { app } = require('../../../test');
    await setReload();
    await checkExist('#svgcanvas', 15000);

    const zoomIn = await app.client.$('div.zoom-btn.zoom-in');
    await zoomIn.click();
    const zoominCanvas = await app.client.$('div#svgcanvas');
    await zoominCanvas.getAttribute('style');
    expect(await zoominCanvas.getAttribute('style')).toEqual('position: relative; width: 2447.55px; height: 1713.29px;');
    const zoomRatio = await app.client.$('div.zoom-ratio');
    await zoomRatio.getText();
    expect(await zoomRatio.getText()).toEqual('60%');

    const zoomOut = await app.client.$('div.zoom-btn.zoom-out');
    await zoomOut.click();
    const zoomoutCanvas2 = await app.client.$('div#svgcanvas');
    await zoomoutCanvas2.getAttribute('style');
    expect(await zoomoutCanvas2.getAttribute('style')).toEqual('position: relative; width: 2039.63px; height: 1427.74px;');
    const zoomRatio2 = await app.client.$('div.zoom-ratio');
    await zoomRatio2.getText();
    expect(await zoomRatio2.getText()).toEqual('50%');
});

test('Check Zoom In/Out With Object', async function() {
    const { app } = require('../../../test');

    const rect = await app.client.$('#left-Rectangle');
    await rect.click();
    await mouseAction([
        { type: 'pointerMove', x: 400, y: 400, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 450, y: 450, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    
    const zoomIn = await app.client.$('div.zoom-btn.zoom-in');
    await zoomIn.click();
    const zoominCanvas = await app.client.$('div#svgcanvas');
    await zoominCanvas.getAttribute('style');
    expect(await zoominCanvas.getAttribute('style')).toEqual('position: relative; width: 2447.55px; height: 1713.29px;');
    const zoomRatio = await app.client.$('div.zoom-ratio');
    await zoomRatio.getText();
    expect(await zoomRatio.getText()).toEqual('60%');

    const zoomOut = await app.client.$('div.zoom-btn.zoom-out');
    await zoomOut.click();
    const zoomoutCanvas2 = await app.client.$('div#svgcanvas');
    await zoomoutCanvas2.getAttribute('style');
    expect(await zoomoutCanvas2.getAttribute('style')).toEqual('position: relative; width: 2039.63px; height: 1427.74px;');
    const zoomRatio2 = await app.client.$('div.zoom-ratio');
    await zoomRatio2.getText();
    expect(await zoomRatio2.getText()).toEqual('50%');

    const zoomIn2 = await app.client.$('div.zoom-btn.zoom-in');
    await zoomIn2.click();

    const zoomIn3 = await app.client.$('div.zoom-btn.zoom-in');
    await zoomIn3.click();

    const zoomIn4 = await app.client.$('div.zoom-btn.zoom-in');
    await zoomIn4.click();

    const zoominCanvas3 = await app.client.$('div#svgcanvas');
    await zoominCanvas3.getAttribute('style');
    expect(await zoominCanvas3.getAttribute('style')).toEqual('position: relative; width: 3263.41px; height: 2284.38px;');
    const zoomRatio3 = await app.client.$('div.zoom-ratio');
    await zoomRatio3.getText();
    expect(await zoomRatio3.getText()).toEqual('80%');
});
