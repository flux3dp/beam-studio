const { pause, checkExist, checkVisible, updateInput } = require('../../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../../util/actions');

test('Remove Speed Limit', async function() {
    const { app } = require('../../../../test');
    
    await checkExist('#svgcanvas',15000);

    await app.client.execute(() => {

        location.hash = '#studio/settings';

    });

    const speedlimit = await app.client.$('select#qa-set-vector-speed-constraint option[value="FALSE"]');
    await speedlimit.click();

    const speedcheck= await app.client.$('select#qa-set-vector-speed-constraint');
    const speedcheck2 = await speedcheck.getAttribute('value');
    expect(speedcheck2).toEqual('FALSE');

    const done = await app.client.$('a.btn.btn-done');
    await done.click();
    
    await checkExist('#svgcanvas',15000);
});