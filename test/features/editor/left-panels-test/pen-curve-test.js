const { pause, checkExist, checkVisible, updateInput } = require('../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../util/actions');

test('Check Draw Curve', async function() {
    const { app } = require('../../../test');

    await app.client.execute(() => {
        location.reload()
    });
    await checkExist('#svgcanvas',15000);

    const pen = await app.client.$('#left-Pen');
    await pen.click(); 

    await mouseAction([
        { type: 'pointerMove', x: 400, y: 250, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 250, y: 400, duration: 1000, },
        { type: 'pointerUp', button: 0, },
        { type: 'pointerMove', x: 400, y: 400, duration: 1000, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 300, y: 450, duration: 1000, },
        { type: 'pointerUp', button: 0, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerDown', button: 0, },
    ]);
    
    await checkExist('#svg_1');
    
    await checkExist('#svg_1', 2000);
    const svg_1d = await app.client.$('#svg_1');
    const curved = await svg_1d.getAttribute('d');
    expect(curved).toEqual("M 894.62439499522 592.0348122005041 C 303.5745576325297 1183.0846495631943 1288.6576199036801 986.0680371089643 894.62439499522 1183.0846495631943 L 500.4221784407543 1379.1162397973544");
    
});
