const { pause, checkExist, checkVisible, updateInput } = require('../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../util/actions');
const { dialog } = require('electron');

test('Check Preference Notification', async function() {
    const { app } = require('../../../test');
    
    await checkExist('#svgcanvas',15000);

    await app.client.execute(() => {
        location.hash = '#studio/settings';
    });
    const selectnoti = await app.client.$('select#qa-set-notifications option[value="1"]');
    await selectnoti.click();
    const noticheck= await app.client.$('select#qa-set-notifications');
    const noticheck2 = await noticheck.getAttribute('value');
    expect(noticheck2).toEqual('1');

    const done = await app.client.$('a.btn.btn-done');
    await done.click();

    await checkExist('#svgcanvas',15000);

    

});