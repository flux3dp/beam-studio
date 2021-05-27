const { pause, checkExist, checkVisible, updateInput } = require('../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../util/actions');

test('Draw Rectangle', async function() {
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

    expect(Math.abs(expectedX - actualX)).toBeLessThanOrEqual(0);
    expect(Math.abs(expectedY - actualY)).toBeLessThanOrEqual(0);
    expect(Math.abs(expectedW - actualW)).toBeLessThanOrEqual(0);
    expect(Math.abs(expectedH - actualH)).toBeLessThanOrEqual(0);

    
    

});

