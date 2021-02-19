const { pause, checkExist, checkVisible, updateInput } = require('../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../util/editor-utils');
const { mouseAction } = require('../../util/actions');

test('draw rect', async function() {
    const { app } = require('../../test');
    await app.client.click('#left-Rectangle');
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
    const actualX = await app.client.getAttribute('#svg_1', 'x');
    const actualY = await app.client.getAttribute('#svg_1', 'y');
    const actualW = await app.client.getAttribute('#svg_1', 'width');
    const actualH = await app.client.getAttribute('#svg_1', 'height');
    expect(Math.abs(expectedX - actualX)).toBeLessThanOrEqual(0);
    expect(Math.abs(expectedY - actualY)).toBeLessThanOrEqual(0);
    expect(Math.abs(expectedW - actualW)).toBeLessThanOrEqual(0);
    expect(Math.abs(expectedH - actualH)).toBeLessThanOrEqual(0);
});
