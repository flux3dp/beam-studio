const { pause, checkExist, checkVisible, updateInput } = require('../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../util/actions');
const { dialog } = require('electron');

test('Check Preference Open Bottom', async function() {
    const { app } = require('../../../test');
    
    await checkExist('#svgcanvas',15000);

    await app.client.execute(() => {

        location.hash = '#studio/settings';

    });

    const openbottom = await app.client.$('select#default-open-bottom option[value="TRUE"]');
    await openbottom.click();

    const openbottomcheck= await app.client.$('select#default-open-bottom');
    const openbottomcheck2 = await openbottomcheck.getAttribute('value');
    expect(openbottomcheck2).toEqual('TRUE');

    const done = await app.client.$('a.btn.btn-done');
    await done.click();
    
    await checkExist('#svgcanvas',15000);
});