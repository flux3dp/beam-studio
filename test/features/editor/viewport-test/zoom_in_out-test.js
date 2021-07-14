const { checkExist, setReload} = require('../../../util/utils');

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
>>>>>>> 031c4151c40d540302f2cde9da92f1d2c6045110
