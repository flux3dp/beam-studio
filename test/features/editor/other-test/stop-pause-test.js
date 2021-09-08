const { checkExist, setReload, checknotExist } = require('../../../util/utils');
const { mouseAction } = require('../../../util/actions');

test('Check Pause Function', async function() {
    const { app } = require('../../../test');
    await setReload();
    await checkExist('#svgcanvas',15000);
    const elli = await app.client.$('#left-Ellipse');
    await elli.click();
    await mouseAction([
        { type: 'pointerMove', x: 400, y: 400, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 464, y: 464, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    await checkExist('#svg_1');

    const switchLayer = await app.client.$('div.tab.layers');
    await switchLayer.click();

    const power = await app.client.$('input#power');
    await power.doubleClick();
    await app.client.keys(['Backspace', '0', 'Enter',"NULL"]);

    const go = await app.client.$('div.go-button-container');
    await go.click();

    const beamo = await app.client.$('[data-test-key="FLPUAG5YEG"]');
    await beamo.click();
    await checkExist('div.btn-control.btn-go',5000);

    const start = await app.client.$('div.btn-control.btn-go');
    await start.click();
    await checkExist('div.btn-control.btn-pause',5000);

    const pause = await app.client.$('div.btn-control.btn-pause');
    await pause.click();
    await checkExist('div.btn-control.btn-go',5000);
});

test('Check Stop Function', async function() {
    const { app } = require('../../../test');

    const stop = await app.client.$('div.btn-control.btn-stop');
    await stop.click();
    await checkExist('div.controls.left.disabled');

    const status = await app.client.$('div.status.right');
    expect(await status.getText()).toEqual('Aborted');
});
