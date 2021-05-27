const { pause, checkExist, checkVisible, updateInput } = require('../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../util/actions');
const { dialog } = require('electron');

test('Check Preference Save Connection IP', async function() {
    const { app } = require('../../../test');
    
    await checkExist('#svgcanvas',15000);

    await app.client.execute(() => {
        location.hash = '#studio/settings';
    });

    const selectconnection = await app.client.$('input#qa-set-groups-connection');
    await selectconnection.doubleClick();
    await app.client.keys(['Delete',  "NULL"]);

    // await new Promise((r) => setTimeout(r, 1000));

    const done = await app.client.$('a.btn.btn-done');
    await done.click();

    await checkExist('#svgcanvas',15000);

    await app.client.execute(() => {
        location.hash = '#initialize/connect/select-connection-type';
    });

    const connectwifi = await app.client.$('#qa-connect-wifi');
    await connectwifi.click();

    const nextstep = await app.client.$('div.btn-page.primary');
    await nextstep.click();

    const intput2 = await app.client.$('input.ip-input');
    await intput2.setValue('192.168.1.1');

    const nextstepaftrightIP = await app.client.$('div.btn-page.next.primary');
    await nextstepaftrightIP.click();
    await new Promise((r) => setTimeout(r, 3000));

    const nextstepatocheck = await app.client.$('div.btn-page.next.primary');
    await nextstepatocheck.click();
    await new Promise((r) => setTimeout(r, 3000));

    const nextstepatofinish = await app.client.$('div.btn-page.next.primary');
    await nextstepatofinish.click();


    await app.client.execute(() => {
        location.hash = '#studio/settings';
    });

    const connectioncheck= await app.client.$('input#qa-set-groups-connection');
    const connectioncheck2 = await connectioncheck.getAttribute('value');
    expect(connectioncheck2).toEqual('192.168.1.1');


});