const { pause, checkExist, checkVisible, updateInput } = require('../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../util/actions');

test('Select', async function() {
    const { app } = require('../../../test');
    await app.client.execute(() => {
        location.reload();
    });
    await checkExist('#svgcanvas',15000);

    const elem = await app.client.$('#left-Polygon');
    await elem.click();

    await mouseAction([
        { type: 'pointerMove', x: 200, y: 200, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 300, y: 300, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    

    await mouseAction([
        { type: 'pointerMove', x: 200, y: 200, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 500, y: 500, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    await new Promise((r) => setTimeout(r, 1000));
    
    const result = await app.client.execute(() =>{
        return svgCanvas.getSelectedElems();
    });
    
    expect(result.length).toEqual(1);

    const id = await app.client.execute(() => {
        const e = svgCanvas.getSelectedElems();
        return e.map((e) => {return e.getAttribute('id')});
    });
    
    expect(id).toEqual(["svg_1"]);

});