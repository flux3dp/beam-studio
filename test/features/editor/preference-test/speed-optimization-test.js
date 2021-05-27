const { pause, checkExist, checkVisible, updateInput } = require('../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../util/actions');
const { dialog } = require('electron');

test('Check Preference Speed Optimization', async function() {
    const { app } = require('../../../test');
    
    await checkExist('#svgcanvas',15000);

    await app.client.execute(() => {

        location.hash = '#studio/settings';

    });

    const speedoptimization = await app.client.$('select#qa-set-groups-engraving option[value="TRUE"]');
    await speedoptimization.click();

    const speedoptimizationcheck= await app.client.$('select#qa-set-groups-engraving');
    const speedoptimizationcheck2 = await speedoptimizationcheck.getAttribute('value');
    expect(speedoptimizationcheck2).toEqual('TRUE');

    const done = await app.client.$('a.btn.btn-done');
    await done.click();
    
    await checkExist('#svgcanvas',15000);

    
});