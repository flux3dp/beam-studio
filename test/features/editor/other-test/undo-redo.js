const { checkExist, checknotExist, setReload} = require('../../../util/utils');
const { mouseAction } = require('../../../util/actions');


test('Check Undo Redo Geometry', async function() {
    const { app } = require('../../../test');      
    await setReload();
    await checkExist('#svgcanvas',15000);
    const elli = await app.client.$('#left-Ellipse');
    await elli.click();
    await mouseAction([
        { type: 'pointerMove', x: 400, y: 400, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 464, y: 464, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    await checkExist('#svg_1');
});

test('Check Undo Redo Text', async function() {
    const { app } = require('../../../test');
    await app.client.execute(() =>{
        svgCanvas.undoMgr.undo();
    });
    await checknotExist('#svg_1');

    const text = await app.client.$('#left-Text');
    await text.click();
    await mouseAction([
        { type: 'pointerMove', x: 300, y: 300, duration: 10, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerUp', button: 0, },
    ]);
    await app.client.keys(['Undo Redo Test', "NULL"]);

    await checkExist('#svg_2');
});

test('Check Undo Redo Path', async function() {
    const { app } = require('../../../test');
    await app.client.execute(() =>{
        svgCanvas.undoMgr.undo();
    });

    await checknotExist('#svg_2');
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
    await checkExist('#svg_3');
    await app.client.execute(() =>{
        svgCanvas.undoMgr.undo();
    });
    await checknotExist('#svg_3');
});
