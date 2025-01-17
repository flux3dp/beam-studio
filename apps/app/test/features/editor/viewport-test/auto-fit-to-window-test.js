const { checkExist, setReload} = require('../../../util/utils');

test('Check Auto Fit To Window', async function() {
    const { app } = require('../../../test');
    await setReload();
    await checkExist('#svgcanvas', 15000);

    const autofitwindow = await app.client.$$('#_view');
    checkExist('#_view');
    checkVisible('#_view');
    // await autofitwindow.click();
    await new Promise((r) => setTimeout(r, 1000));

});