const { pause, checkExist, checkVisible, updateInput } = require('../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../util/editor-utils');
const { mouseAction, keyAction } = require('../../util/actions');


test('Undo Redo', async function() {
    const { app } = require('../../test');
   
    await app.client.click('#left-Rectangle');
    
    await mouseAction([
        { type: 'pointerMove', x: 200, y: 200, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 300, y: 300, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    
    // await app.client.keys(['Delete', "NULL"]);
    // await new Promise((r) => setTimeout(r, 1000));
    await app.client.execute(() => {
        svgCanvas.undoMgr.redo();
    });
    //await app.client.keys(['Control', 'z', "NULL"]);
    
    await checkExist('#svg_1');

    await new Promise((r) => setTimeout(r, 1000));
    
    // await app.client.keys(['Control', 'Shift', 'z', "NULL"]);
    // await new Promise((r) => setTimeout(r, 1000));
    // await new Promise((r) => setTimeout(r, 1000));
    

    // await app.client.execute(() => {
    //     location.reload();
    // });
    // await checkExist('#svgcanvas',5000);

});