const { checkExist, setReload } = require('../../../util/utils');
const { pageCoordtoCanvasCoord } = require('../../../util/editor-utils');
const { mouseAction } = require('../../../util/actions');

test('Check Draw Rectangle', async function() {
    const { app } = require('../../../test');

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
    
    await checkExist('#svg_1');
    const startPoint = await pageCoordtoCanvasCoord({x: 300, y: 300});
    const endPoint = await pageCoordtoCanvasCoord({x: 500, y: 500});
    let expectedX = startPoint.x;
    let expectedY = startPoint.y;
    let expectedW = endPoint.x - startPoint.x;
    let expectedH = endPoint.y - startPoint.y;
    const svg_1x = await app.client.$('#svg_1');
    const actualX = await svg_1x.getAttribute('x');

    const svg_1y = await app.client.$('#svg_1');
    const actualY = await svg_1y.getAttribute('y');

    const svg_1width = await app.client.$('#svg_1');
    const actualW = await svg_1width.getAttribute('width');

    const svg_1height = await app.client.$('#svg_1');
    const actualH = await svg_1height.getAttribute('height');
    
    expect(Math.abs(expectedY - actualY)).toBeLessThanOrEqual(0);
    expect(Math.abs(expectedW - actualW)).toBeLessThanOrEqual(0);
    expect(Math.abs(expectedH - actualH)).toBeLessThanOrEqual(0);
});

test('Check Rectangle Corner', async function() {
    const { app } = require('../../../test');

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
