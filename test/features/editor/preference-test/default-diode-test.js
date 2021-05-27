const { pause, checkExist, checkVisible, updateInput } = require('../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../util/actions');
const { dialog } = require('electron');

test('Check Preference Hybrid Laser Default', async function() {
    const { app } = require('../../../test');
    
    await checkExist('#svgcanvas',15000);

    await app.client.execute(() => {

        location.hash = '#studio/settings';

    });

    const diode = await app.client.$('select#default-diode option[value="TRUE"]');
    await diode.click();

    const diodecheck= await app.client.$('select#default-diode');
    const diodecheck2 = await diodecheck.getAttribute('value');
    expect(diodecheck2).toEqual('TRUE');

    const done = await app.client.$('a.btn.btn-done');
    await done.click();
    
    await checkExist('#svgcanvas',15000);
    await checkExist('div.addon-setting');

});