const { pause, checkExist, checkVisible, updateInput } = require('../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../util/actions');

test('Draw Line', async function() {
    const { app } = require('../../../test');
    //const app = await restartAndSetStorage();
    //await checkExist('#svgcanvas', 15000);

    await app.client.execute(() => {
        location.reload()
    });
    await checkExist('#svgcanvas',15000);

    const elem = await app.client.$('#left-Line');
    await elem.click(); 

    await mouseAction([
        { type: 'pointerMove', x: 300, y: 300, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 500, y: 500, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    
    await checkExist('#svg_1');
    const startPoint = await pageCoordtoCanvasCoord({x: 300, y: 300});
    const endPoint = await pageCoordtoCanvasCoord({x: 500, y: 500});
    
    let expectedX1 = startPoint.x;
    let expectedY1 = startPoint.y;
    let expectedX2 = endPoint.x;
    let expectedY2 = endPoint.y;

    const eX1 = parseFloat(expectedX1).toFixed(10);
    const eY1 = parseFloat(expectedY1).toFixed(10);
    const eX2 = parseFloat(expectedX2).toFixed(10);
    const eY2 = parseFloat(expectedY2).toFixed(10);

    const svg_1x1 = await app.client.$('#svg_1');
    const actualX1 =await svg_1x1.getAttribute('x1');

    const svg_1y1 = await app.client.$('#svg_1');
    const actualY1 =await svg_1y1.getAttribute('y1');

    const svg_1x2 = await app.client.$('#svg_1');
    const actualX2 =await svg_1x2.getAttribute('x2');

    const svg_1y2 = await app.client.$('#svg_1');
    const actualY2 =await svg_1y2.getAttribute('y2');

    const aX1 = parseFloat(actualX1).toFixed(10);
    const aY1 = parseFloat(actualY1).toFixed(10);
    const aX2 = parseFloat(actualX2).toFixed(10);
    const aY2 = parseFloat(actualY2).toFixed(10);

    expect(Math.abs(eX1 - aX1)).toBeLessThanOrEqual(0);
    expect(Math.abs(eY1 - aY1)).toBeLessThanOrEqual(0);
    expect(Math.abs(eX2 - aX2)).toBeLessThanOrEqual(0);
    expect(Math.abs(eY2 - aY2)).toBeLessThanOrEqual(0);

    
    

});