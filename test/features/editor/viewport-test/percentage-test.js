const { pause, checkExist, checkVisible, updateInput } = require('../../../util/utils');
const { mouseAction, keyAction, zoomAction } = require('../../../util/actions');

test('Check Zoom ', async function() {
    const { app } = require('../../../test');
    await app.client.execute(() => {
        location.reload();
    });
    await checkExist('#svgcanvas', 15000);
    await zoomAction();


});