const { pause, checkExist, checkVisible, updateInput } = require('../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../util/actions');

test('Draw Polygon', async function() {
    const { app } = require('../../../test');

    await app.client.execute(() => {
        location.reload();
    });
    await checkExist('#svgcanvas',15000);

    const polygon = await app.client.$('#left-Polygon');
    await polygon.click();

    await mouseAction([
        { type: 'pointerMove', x: 500, y: 500, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 600, y: 600, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    await checkExist('#svg_1');
    const startPoint = await pageCoordtoCanvasCoord({x: 500, y: 500});
    const endPoint = await pageCoordtoCanvasCoord({x: 600, y: 600});
    let expectedX = startPoint.x;
    let expectedY = startPoint.y;

    const svg_1cx = await app.client.$('#svg_1');
    const actualX = await svg_1cx.getAttribute('cx');

    const svg_1cy = await app.client.$('#svg_1');
    const actualY = await svg_1cy.getAttribute('cy');

    const svg_1points = await app.client.$('#svg_1');
    const actualP = await svg_1points.getAttribute('points');
    
    expect(Math.abs(expectedX - actualX)).toBeLessThanOrEqual(0);
    expect(Math.abs(expectedY - actualY)).toBeLessThanOrEqual(0);
    expect(actualP).toEqual("1682.6908448121403,1971.1510993801146 1035.6727165627753,2073.6287035027194 738.271126089934,1489.9452176867806 1201.484963118806,1026.7313806579082 1785.168448934745,1324.1329711307494 1682.6908448121403,1971.1510993801144");
});