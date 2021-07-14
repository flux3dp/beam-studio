const { checkExist, setReload } = require('../../../util/utils');
const { mouseAction } = require('../../../util/actions');

test('Check Preview Camera With Zoom', async function() {
    const { app } = require('../../../test');
    await setReload();
    await checkExist('#svgcanvas', 15000);

    const camera = await app.client.$('div.img-container');
    await camera.click();

    const chooseCamera = await app.client.$('div.img-container');
    await chooseCamera.click();

    const beamo = await app.client.$('[data-test-key="FLPUAG5YEG"]');
    await beamo.click();

    // const yes = await app.client.$('button.btn.btn-default.primary');
    // await yes.click();
    await new Promise((r) => setTimeout(r, 10000));
    await mouseAction([
        { type: 'pointerMove', x: 200, y: 200, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 400, y: 400, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    await new Promise((r) => setTimeout(r, 10000));
    checkExist("#background_image");

    const zoomOut = await app.client.$('div.zoom-btn.zoom-out');
    await zoomOut.click();
    const zoomoutCanvas = await app.client.$('div#svgcanvas');
    await zoomoutCanvas.getAttribute('style');
    expect(await zoomoutCanvas.getAttribute('style')).toEqual('position: relative; width: 2039.63px; height: 1427.74px;');
    const zoomRatio = await app.client.$('div.zoom-ratio');
    await zoomRatio.getText();
    expect(await zoomRatio.getText()).toEqual('50%');
    // console.log(await svg_1.getLocation());

    const zoomIn = await app.client.$('div.zoom-btn.zoom-in');
    await zoomIn.click();
    const zoominCanvas = await app.client.$('div#svgcanvas');
    await zoominCanvas.getAttribute('style');
    expect(await zoominCanvas.getAttribute('style')).toEqual('position: relative; width: 2447.55px; height: 1713.29px;');
    const zoomRatio2 = await app.client.$('div.zoom-ratio');
    await zoomRatio2.getText();
    expect(await zoomRatio2.getText()).toEqual('60%');
    // console.log(await svg_1.getLocation());
});
