const { pause, checkExist, checkVisible, updateInput } = require('../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../util/actions');


test('Polygon Sides', async function() {
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