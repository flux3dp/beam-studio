const { checkExist, setReload} = require('../../../util/utils');

test('Check Zoom ', async function() {
    const { app } = require('../../../test');
    await setReload();
    await checkExist('#svgcanvas', 15000);
    await zoomAction();
});
