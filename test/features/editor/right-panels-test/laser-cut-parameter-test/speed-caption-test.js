const { checkExist, setAppPage } = require('../../../../util/utils');
const { mouseAction } = require('../../../../util/actions');

test('Check Speed Caption', async function() {
    const { app } = require('../../../../test');
    await setAppPage('#studio/settings');

    const speedlimit = await app.client.$('select#set-vector-speed-contraint option[value="TRUE"]');
    await speedlimit.click();

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

    const layerbutton = await app.client.$('div.tab.layers');
    await layerbutton.click(); 

    const speed = await app.client.$('input#speed');
    await speed.doubleClick();
    await app.client.keys(['Backspace', '1', '2', '0', 'Enter',"NULL"]);

    const input = await app.client.$('input#speed' );
    const strengthvalue =await input.getAttribute('value');
    expect(strengthvalue).toEqual('120');
    
    const gobutton = await app.client.$('div.go-button-container');
    await gobutton.click(); 

    await checkExist('pre.message',15000);

    const next = await app.client.$('button.btn.btn-default.primary');
    await next.click();    
});
