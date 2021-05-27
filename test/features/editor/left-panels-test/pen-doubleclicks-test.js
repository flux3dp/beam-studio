const { pause, checkExist, checkVisible, updateInput } = require('../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../util/editor-utils');
const { mouseAction, keyAction, touchAction} = require('../../../util/actions');

test('Draw Pen Doubleclicks', async function() {
    const { app } = require('../../../test');

    await app.client.execute(() => {
        location.reload()
    });
    await checkExist('#svgcanvas',15000);

    const pen = await app.client.$('#left-Pen');
    await pen.click(); 

    await mouseAction([
        { type: 'pointerMove', x: 400, y: 400, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerUp', button: 0, },
        { type: 'pointerMove', x: 450, y: 350, duration: 1000, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerUp', button: 0, },
        { type: 'pointerMove', x: 500, y: 400, duration: 1000, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerUp', button: 0, },
        { type: 'pointerMove', x: 550, y: 350, duration: 1000, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerUp', button: 0, },
        { type: 'pointerMove', x: 600, y: 400, duration: 1000, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerDown', button: 0, },
    ]);
    
    await checkExist('#svg_1');
    await checkExist('div#qa-tCorner-seg-item');
    await checkExist('div#qa-tSmooth-seg-item');
    await checkExist('div#qa-tSymmetry-seg-item');
   
});
