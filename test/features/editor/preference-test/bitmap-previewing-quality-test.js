const { pause, checkExist, checkVisible, updateInput } = require('../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../util/actions');
const { dialog } = require('electron');

test('Check Preference Bitmap Previewing Quality ', async function() {
    const { app } = require('../../../test');
    
    await checkExist('#svgcanvas',15000);

    await app.client.execute(() => {

        location.hash = '#studio/settings';

    });

    const downsampling = await app.client.$('select#qa-set-downsampling option[value="FALSE"]');
    await downsampling.click();

    const downsamplingcheck= await app.client.$('select#qa-set-simplify-clipper-path');
    const downsamplingcheck2 = await downsamplingcheck.getAttribute('value');
    expect(downsamplingcheck2).toEqual('FALSE');

    const done = await app.client.$('a.btn.btn-done');
    await done.click();
    

    await checkExist('#svgcanvas',15000);
});