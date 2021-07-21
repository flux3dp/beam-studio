const { checkExist, callMenuEvent, setReload } = require('../../../util/utils');

test('Check Auto Fit To Window', async function() {
    const { app } = require('../../../test');
    await setReload();
    await checkExist('#svgcanvas', 15000);
    await callMenuEvent({ id: 'ZOOM_WITH_WINDOW' });

    const windowMax = await app.client.$('div.window-icon.window-max-restore.window-maximize');
    await windowMax.click();
    const zoomRatio = await app.client.$('div.zoom-ratio');
    expect(await zoomRatio.getText()).toEqual('74%');

    const windowUnmax = await app.client.$('div.window-icon.window-max-restore.window-unmaximize');
    await windowUnmax.click();
    const zoomRatio2 = await app.client.$('div.zoom-ratio');
    expect(await zoomRatio2.getText()).toEqual('56%');
});
