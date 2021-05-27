const { pause, checkExist, checkVisible, updateInput } = require('../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../util/actions');
const { dialog } = require('electron');

test('Check Preference Preview Camera Speed ', async function() {
    const { app } = require('../../../test');
    
    await checkExist('#svgcanvas',15000);

    await app.client.execute(() => {

        location.hash = '#studio/settings';

    });

    const selectcameraspeed = await app.client.$('input#qa-set-groups-camera');
    await selectcameraspeed.doubleClick();
    await app.client.keys(['Delete', '1', '5', '0', 'Enter', "NULL"]);

    const selectcameraspeed2 = await app.client.$('input#qa-set-preview-movement-speed-hl');
    await selectcameraspeed2.doubleClick();
    await app.client.keys(['Delete', '5', '0', 'Enter', "NULL"]);
   
    const speedcheck= await app.client.$('input#qa-set-groups-camera');
    const speedcheck2 = await speedcheck.getAttribute('value');
    expect(speedcheck2).toEqual('150');

    const speedcheck_2= await app.client.$('input#qa-set-preview-movement-speed-hl');
    const speedcheck2_2 = await speedcheck_2.getAttribute('value');
    expect(speedcheck2_2).toEqual('50');

    const done = await app.client.$('a.btn.btn-done');
    await done.click();

    await checkExist('#svgcanvas',15000);
    
});