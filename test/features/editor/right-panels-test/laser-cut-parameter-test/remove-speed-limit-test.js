const { checkExist , setAppPage, checknotExist } = require('../../../../util/utils');
const { mouseAction } = require('../../../../util/actions');
test('Check Remove Speed Limit', async function() {
    const { app } = require('../../../../test');
    await checkExist('#svgcanvas',15000);
    await setAppPage('#studio/settings');

    const speedlimit = await app.client.$('select#qa-set-vector-speed-constraint option[value="FALSE"]');
    await speedlimit.click();

    const speedcheck= await app.client.$('select#qa-set-vector-speed-constraint');
    const speedcheck2 = await speedcheck.getAttribute('value');
    expect(speedcheck2).toEqual('FALSE');

    const done = await app.client.$('div.btn.btn-done');
    await done.click();
    await checkExist('#svgcanvas',15000);
    const rect = await app.client.$('#left-Rectangle');
    await rect.click();
    await mouseAction([
        { type: 'pointerMove', x: 300, y: 300, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 500, y: 500, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    const switchlayer = await app.client.$('div.tab.layers');
    await switchlayer.click();

    const speedinput = await app.client.$('input#speed');
    await speedinput.doubleClick();
    await app.client.keys(['Delete','1', '5', '0', 'Enter',"NULL"]);
    
    await checknotExist('div.warning-text');
});