const { checkExist, setReload } = require('../../../util/utils');
const { mouseAction } = require('../../../util/actions');

test('Check Union', async function() {
    const { app } = require('../../../test');
    //const app = await restartAndSetStorage();
    //await checkExist('#svgcanvas', 15000);
    await setReload();
    await checkExist('#svgcanvas',15000);

    const rect = await app.client.$('#left-Rectangle');
    await rect.click();
    await mouseAction([
        { type: 'pointerMove', x: 200, y: 200, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 300, y: 300, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);

    const rect2 = await app.client.$('#left-Rectangle');
    await rect2.click();
    await mouseAction([
        { type: 'pointerMove', x: 250, y: 250, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 350, y: 350, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);

    const select = await app.client.$('#left-Cursor');
    await select.click();

    await mouseAction([
        { type: 'pointerMove', x: 100, y: 100, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 400, y: 400, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);

    const unino = await app.client.$('#qa-union');
    await unino.click();
    
    await checkExist('#svg_4');
    const checkunino = await app.client.$('#svg_4');
    expect(await checkunino.getAttribute('d')).toEqual('M507.15996,587.00012L702.43616,587.00012L702.43616,977.55249L311.88382,977.55249L311.88382,782.27625L116.60765,782.27625L116.60765,391.72394L507.15996,391.72394L507.15996,587.00012z');
    await app.client.execute(() =>{
        svgCanvas.undoMgr.undo();
    });
});

test('Check Subtract ', async function() {
    const { app } = require('../../../test');

    const select = await app.client.$('#left-Cursor');
    await select.click();

    await mouseAction([
        { type: 'pointerMove', x: 100, y: 100, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 400, y: 400, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);

    const subtract = await app.client.$('#qa-subtract');
    await subtract.click();
    
    await checkExist('#svg_6');
    const checkunino = await app.client.$('#svg_6');
    // console.log(await checkunino.getAttribute('d'));
    expect(await checkunino.getAttribute('d')).toEqual('M702.43616,977.55249L311.88382,977.55249L311.88382,782.27625L507.15996,782.27625L507.15996,587.00012L702.43616,587.00012L702.43616,977.55249z');
    await app.client.execute(() =>{
        svgCanvas.undoMgr.undo();
    });
});

test('Check Intersect ', async function() {
    const { app } = require('../../../test');

    const select = await app.client.$('#left-Cursor');
    await select.click();

    await mouseAction([
        { type: 'pointerMove', x: 100, y: 100, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 400, y: 400, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);

    const intersect = await app.client.$('#qa-intersect');
    await intersect.click();
    
    await checkExist('#svg_8');
    const checkunino = await app.client.$('#svg_8');
    // console.log(await checkunino.getAttribute('d'));
    expect(await checkunino.getAttribute('d')).toEqual('M507.15996,782.27625L311.88382,782.27625L311.88382,587.00012L507.15996,587.00012L507.15996,782.27625z');
    await app.client.execute(() =>{
        svgCanvas.undoMgr.undo();
    });
});

test('Check Difference ', async function() {
    const { app } = require('../../../test');

    const select = await app.client.$('#left-Cursor');
    await select.click();

    await mouseAction([
        { type: 'pointerMove', x: 100, y: 100, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 400, y: 400, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);

    const difference = await app.client.$('#qa-difference');
    await difference.click();

    const infillswitch = await app.client.$('div.onoffswitch');
    await infillswitch.click();

    await checkExist('#svg_10');
    const checkunino = await app.client.$('#svg_10');
    // console.log(await checkunino.getAttribute('d'));
    expect(await checkunino.getAttribute('d')).toEqual('M702.43616,977.55249L311.88382,977.55249L311.88382,782.27625L507.15996,782.27625L507.15996,587.00012L702.43616,587.00012L702.43616,977.55249zM507.15996,587.00012L311.88382,587.00012L311.88382,782.27625L116.60765,782.27625L116.60765,391.72394L507.15996,391.72394L507.15996,587.00012z');
});
