const { checkExist, setReload } = require('../../../../util/utils');
const { mouseAction } = require('../../../../util/actions');

test('Check Speed Caption', async function() {
    const { app } = require('../../../../test');
    await setReload();
    await checkExist('#svgcanvas',15000);

    const rect = await app.client.$('#left-Rectangle');
    await rect.click();
    await mouseAction([
        { type: 'pointerMove', x: 300, y: 300, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 500, y: 500, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    const tabButton = await app.client.$('div.tab.layers');
    await tabButton.click();

    const speedInput = await app.client.$('input#speed');
    await speedInput.doubleClick();
    await app.client.keys(['Backspace', '1', '2', '0', 'Enter',"NULL"]);
    expect(await speedInput.getAttribute('value')).toEqual('120');

    const goButton = await app.client.$('div.go-button-container');
    await goButton.click();
    await new Promise((r) => setTimeout(r, 1000));
    await checkExist('div.modal-alert.animate__animated.animate__bounceIn',1500);
    const next = await app.client.$('button.btn.btn-default.primary');
    await next.click();
});
