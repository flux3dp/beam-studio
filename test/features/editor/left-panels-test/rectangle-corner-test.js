const { pause, checkExist, checkVisible, updateInput } = require('../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../util/actions');

test('Rectangle Corner', async function() {
    const { app } = require('../../../test');
    //const app = await restartAndSetStorage();
    //await checkExist('#svgcanvas', 15000);

    await app.client.execute(() => {
        location.reload()
    });
    await checkExist('#svgcanvas',15000);

    const rect = await app.client.$('#left-Rectangle');
    await rect.click();

    await mouseAction([
        { type: 'pointerMove', x: 300, y: 300, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 500, y: 500, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    const elem = await app.client.$('div.option-input.ui.ui-control-unit-input-v2');
    await elem.click();

    await app.client.keys(['Backspace', '10', 'Enter',"NULL"]);
    await new Promise((r) => setTimeout(r, 1000));

    const onoffswitch = await app.client.$('div.onoffswitch');
    await onoffswitch.click();

    const svg_1rx = await app.client.$('#svg_1');
    const actuaCorner = await svg_1rx.getAttribute('rx');

    const svg_1fill = await app.client.$('#svg_1');
    const actuaInfill = await svg_1fill.getAttribute('fill-opacity');

    expect(actuaCorner).toEqual("100");
    expect(actuaInfill).toEqual("1");
});
