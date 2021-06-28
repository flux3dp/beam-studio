const { checkExist } = require('../../../util/utils');
const { pageCoordtoCanvasCoord } = require('../../../util/editor-utils');
const { mouseAction } = require('../../../util/actions');

test('Check Draw Polygon', async function() {
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
    expect(actualP).toEqual("1678.817027,1953.9333281 1037.5146431709302,2055.5056471573967 742.7402921198344,1476.978408847954 1201.862107987634,1017.8565930977113 1780.3893462216006,1312.6309442969373 1678.817027,1953.9333281");
});

test('Check Polygon Sides', async function() {
    const { app } = require('../../../test');

    await app.client.execute(() => {
        location.reload()
    });
    await checkExist('#svgcanvas',15000);

    const poly = await app.client.$('#left-Polygon');
    await poly.click();
    
    await mouseAction([
        { type: 'pointerMove', x: 200, y: 200, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 250, y: 250, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    await checkExist('#svg_1');
    
    await app.client.keys(['=', "NULL"]);

    const poly2 = await app.client.$('#left-Polygon');
    await poly2.click();

    await mouseAction([
        { type: 'pointerMove', x: 350, y: 350, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 400, y: 400, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    await app.client.keys(['-', "NULL"]);
    
    const svg_1sides = await app.client.$('#svg_1');
    const actualSide = await svg_1sides.getAttribute('sides');
    expect(actualSide).toEqual("6");
    
    const svg_2sides = await app.client.$('#svg_2');
    const actualSide2 = await svg_2sides.getAttribute('sides');
    expect(actualSide2).toEqual("4");

});