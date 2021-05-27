const { pause, checkExist, checkVisible, updateInput } = require('../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../util/actions');
const { dialog } = require('electron');

test('Check Preference All Reset', async function() {
    const { app } = require('../../../test');
    
    await checkExist('#svgcanvas',15000);

    await app.client.execute(() => {

        location.hash = '#studio/settings';

    });

    const speedlimit = await app.client.$('select#set-mask option[value="TRUE"]');
    await speedlimit.click();

    const speedcheck= await app.client.$('select#set-mask');
    const speedcheck2 = await speedcheck.getAttribute('value');
    expect(speedcheck2).toEqual('TRUE');

    const done = await app.client.$('a.btn.btn-done');
    await done.click();
    
    await checkExist('#svgcanvas',15000);

    await app.client.execute(() => {

        location.hash = '#studio/settings';

    });
    const reset = await app.client.$('b');
    await reset.click();

    const speedlimit2 = await app.client.$('select#set-mask option[value="FALSE"]');
    await speedlimit2.click();

    const speedcheck3= await app.client.$('select#set-mask');
    const speedcheck4 = await speedcheck3.getAttribute('value');
    expect(speedcheck4).toEqual('FALSE');

});