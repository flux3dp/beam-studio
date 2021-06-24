const { pause, checkExist, checknotExist,checkVisible, updateInput } = require('../../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../../util/actions');

test('Check Hide Layer', async function() {
    const { app } = require('../../../../test');
    
    await app.client.execute(() => {
        location.reload();
    });
    await checkExist('#svgcanvas', 15000);


    const pen = await app.client.$('#left-Pen');
    await pen.click(); 

    await mouseAction([
        { type: 'pointerMove', x: 200, y: 200, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerUp', button: 0, },
        { type: 'pointerMove', x: 250, y: 200, duration: 1000, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerUp', button: 0, },
        { type: 'pointerMove', x: 300, y: 200, duration: 1000, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerUp', button: 0, },
        { type: 'pointerMove', x: 300, y: 250, duration: 1000, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerUp', button: 0, },
        { type: 'pointerMove', x: 300, y: 300, duration: 1000, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerUp', button: 0, },
        { type: 'pointerMove', x: 250, y: 300, duration: 1000, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerUp', button: 0, },
        { type: 'pointerMove', x: 200, y: 300, duration: 1000, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerUp', button: 0, },
        { type: 'pointerMove', x: 200, y: 250, duration: 1000, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerUp', button: 0, },
        { type: 'pointerMove', x: 200, y: 200, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerDown', button: 0, },
    ]);
    
    await checkExist('#svg_1');

    const switchlayer = await app.client.$('div.tab.layers');
    await switchlayer.click();

    const hidelayer = await app.client.$('div#layervis-0');
    await hidelayer.click();

    const layer0 = await app.client.$('g.layer');
    const layer0display = await layer0.getAttribute('display');
    expect(layer0display).toEqual('none');

    
});