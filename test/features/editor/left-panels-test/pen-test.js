const { checkExist, setReload } = require('../../../util/utils');
const { mouseAction } = require('../../../util/actions');

test('Check Draw Pen', async function() {
    const { app } = require('../../../test');
    await setReload();
    await checkExist('#svgcanvas',15000);

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

    const drawingPoint_0 = await app.client.$('#drawingPoint_0');
    const cxPoint_0 = await drawingPoint_0.getAttribute('cx');
    const drawingPoint_1 = await app.client.$('#drawingPoint_1');
    const cxPoint_1 = await drawingPoint_1.getAttribute('cx');
    expect(Math.round(cxPoint_1-cxPoint_0)).toEqual(50);

    const drawingPoint_3 = await app.client.$('#drawingPoint_3');
    const cyPoint_3 = await drawingPoint_3.getAttribute('cy');
    const drawingPoint_4 = await app.client.$('#drawingPoint_4');
    const cyPoint_4 = await drawingPoint_4.getAttribute('cy');
    expect(Math.round(cyPoint_4-cyPoint_3)).toEqual(50);
});

test('Check Draw Pen Curve', async function() {
    const { app } = require('../../../test');
    await setReload();
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
    const drawingPoint_1 = await app.client.$('#drawingPoint_1');
    const cxPoint_1 = await drawingPoint_1.getAttribute('cx');
    const drawingPoint_2 = await app.client.$('#drawingPoint_2');
    const cxPoint_2 = await drawingPoint_2.getAttribute('cx');
    expect(Math.round(cxPoint_2-cxPoint_1)).toEqual(-100);
});

test('Check Draw Pen Doubleclicks', async function() {
    const { app } = require('../../../test');
    await setReload();
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
    await checkExist('[title="tCorner"]');
    await checkExist('[title="tSmooth"]');
    await checkExist('[title="tSymmetry"]');

    const drawingPoint_0 = await app.client.$('#drawingPoint_0');
    const cxPoint_0 = await drawingPoint_0.getAttribute('cx');
    const drawingPoint_2 = await app.client.$('#drawingPoint_2');
    const cxPoint_2 = await drawingPoint_2.getAttribute('cx');
    expect(Math.round(cxPoint_2-cxPoint_0)).toEqual(100);
    const drawingPoint_1 = await app.client.$('#drawingPoint_1');
    const cxPoint_1 = await drawingPoint_1.getAttribute('cx');
    const drawingPoint_3 = await app.client.$('#drawingPoint_3');
    const cxPoint_3 = await drawingPoint_3.getAttribute('cx');
    expect(Math.round(cxPoint_3-cxPoint_1)).toEqual(100);
});

test('Check Draw Pen tCorner', async function() {
    const { app } = require('../../../test');
    /* tCorner */
    const pathpoint1 = await app.client.$('#pathpointgrip_1');
    await pathpoint1.doubleClick();
    const ctrlpoint1 = await app.client.$('#ctrlpointgrip_1c1'); 
    await ctrlpoint1.click();

    const ctrlpoint1move = await app.client.$('#ctrlpointgrip_1c1'); 
    await ctrlpoint1move.dragAndDrop({x:-100, y:-150});
    const cxPointmove_1 = await ctrlpoint1move.getAttribute('cx');

    const ctrlpoint2move = await app.client.$('#ctrlpointgrip_2c1'); 
    await ctrlpoint2move.dragAndDrop({x:100, y:-150});
    const cxPoint_move2 = Math.round(await ctrlpoint2move.getAttribute('cx'));

    const drawingPoint_1 = await app.client.$('#drawingPoint_1');
    const cxPoint_1 = Math.round(await drawingPoint_1.getAttribute('cx'));   
    expect(Math.round(cxPoint_move2-cxPoint_1)-Math.round(cxPoint_1-cxPointmove_1)).toBeLessThanOrEqual(1);
});

test('Check Draw Pen tSmooth', async function() {
    const { app } = require('../../../test');
    /* tSmooth */
    const smooth = await app.client.$('[title="tSmooth"]');
    await smooth.click();
    const ctrlpoint1move2 = await app.client.$('#ctrlpointgrip_1c1'); 
    await ctrlpoint1move2.dragAndDrop({x:-50, y:-50});  
    const cxPoint_move2 = await ctrlpoint1move2.getAttribute('cx');

    const drawingPoint_1 = await app.client.$('#drawingPoint_1');
    const cxPoint_1 = await drawingPoint_1.getAttribute('cx');  
    expect(Math.round(cxPoint_1-cxPoint_move2)).toEqual(167);
});

test('Check Draw Pen tSymmetry', async function() {
    const { app } = require('../../../test');
    /* tSymmetry */
    const symmetry = await app.client.$('[title="tSymmetry"]');
    await symmetry.click(); 
    const ctrlpoint2move2 = await app.client.$('#ctrlpointgrip_2c1'); 
    await ctrlpoint2move2.dragAndDrop({x:0, y:-100});
    const cxPoint_move2 = await ctrlpoint2move2.getAttribute('cx');

    const ctrlpoint1move = await app.client.$('#ctrlpointgrip_1c1'); 
    const cxPointmove_1 = await ctrlpoint1move.getAttribute('cx');

    const drawingPoint_1 = await app.client.$('#drawingPoint_1');
    const cxPoint_1 = await drawingPoint_1.getAttribute('cx');   
    expect(Math.round(cxPoint_move2-cxPoint_1)-Math.round(cxPoint_1-cxPointmove_1)).toBeLessThanOrEqual(1);
});
