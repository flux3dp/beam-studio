const { pause, checkExist, checkVisible, updateInput } = require('../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../util/actions');


test('Check Auto Fit To Window', async function() {
    const { app } = require('../../../test');
    await app.client.execute(() => {
        location.reload();
    });
    await checkExist('#svgcanvas', 15000);

    const autofitwindow = await app.client.$$('#_view');
    checkExist('#_view');
    checkVisible('#_view');
    // await autofitwindow.click();
    await new Promise((r) => setTimeout(r, 1000));

});