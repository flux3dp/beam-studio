const { checkExist, setReload } = require('../../../util/utils');
const { mouseAction } = require('../../../../util/actions');

test('Check Preview Camera', async function() {
    const { app } = require('../../../test');
    await setReload();
    await checkExist('#svgcanvas', 15000);

    const camera = await app.client.$('div.img-container');
    await camera.click();

    await mouseAction([
        { type: 'pointerMove', x: 300, y: 300, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 400, y: 400, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);


});