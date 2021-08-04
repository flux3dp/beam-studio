const { checkExist, setReload } = require('../../../util/utils');
const { mouseAction } = require('../../../util/actions');

test('Check Move Object', async function() {
    const { app } = require('../../../test');
    await setReload();
    await checkExist('#svgcanvas',15000);

    const rect = await app.client.$('#left-Rectangle');
    await rect.click();
    await mouseAction([
        { type: 'pointerMove', x: 250, y: 250, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 300, y: 300, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    await checkExist('#svg_1');
    const rectWidth = await app.client.$('input#width');
    await rectWidth.doubleClick();
    await app.client.keys(['Backspace', 'Backspace','2', '0', 'Enter',"NULL"]);

    const rectHeight = await app.client.$('input#height');
    await rectHeight.doubleClick();
    await app.client.keys(['Backspace', '2', '0', 'Enter',"NULL"]);

    const rectlocation = await app.client.$('#svg_1');
    await new Promise((r) => setTimeout(r, 1000));

    const rectMove_x = await app.client.$('input#x_position');
    await rectMove_x.doubleClick();
    await app.client.keys(['Backspace', '6', '0', 'Enter',"NULL"]);

    const rectMove_y = await app.client.$('input#y_position');
    await rectMove_y.doubleClick();
    await app.client.keys(['Backspace', '6', '0', 'Enter',"NULL"]);

    const x_position = await rectlocation.getAttribute("x");
    const y_position = await rectlocation.getAttribute("y");
    expect(Math.round(x_position)).toEqual(600);
    expect(Math.round(y_position)).toEqual(600);
});

test('Check Rotate Object', async function() {
    const { app } = require('../../../test');

    const rectRotate = await app.client.$('input#rotate');
    await rectRotate.doubleClick();
    await app.client.keys(['Backspace', '4', '5', 'Enter',"NULL"]);

    const rectlocation = await app.client.$('#svg_1');
    const rotate = await rectlocation.getAttribute("transform");
    if(process.platform === 'darwin'){
        expect(rotate).toEqual("rotate(45 700.0000000000002,700) ");
    } 
    else{
        expect(rotate).toEqual("rotate(45 700.0000000000002,699.9999999999999) ");
    }
});

test('Check Zoom Object', async function() {
    const { app } = require('../../../test');
    await app.client.execute(() =>{
        svgCanvas.undoMgr.undo();
    });
    const select = await app.client.$('#left-Cursor');
    await select.click();
    await mouseAction([
        { type: 'pointerMove', x: 200, y: 200, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 400, y: 400, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);

    const rectWidth = await app.client.$('input#width');
    await rectWidth.doubleClick();
    await app.client.keys(['Backspace', '1', '0', '0', 'Enter',"NLL"]);

    const rectlocation = await app.client.$('#svg_1');
    const width = await rectlocation.getAttribute("width");
    const height= await rectlocation.getAttribute("height");
    expect(Math.round(width)).toEqual(1000);
    expect(Math.round(height)).toEqual(200);
});

test('Check Infill Object', async function() {
    const { app } = require('../../../test');
    await app.client.execute(() =>{
        svgCanvas.undoMgr.undo();
    });
    const select = await app.client.$('#left-Cursor');
    await select.click();
    await mouseAction([
        { type: 'pointerMove', x: 200, y: 200, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 400, y: 400, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);

    const rectlocation = await app.client.$('#svg_1');
    const rectinnofill = await rectlocation.getAttribute('fill');
    expect(rectinnofill).toEqual('none');

    const infillswitch = await app.client.$('div.onoffswitch');
    await infillswitch.click();
    const rectlocation2 = await app.client.$('#svg_1');
    const rectinfill = await rectlocation2.getAttribute('fill');
    expect(rectinfill).toEqual('#333333');
});

test('Check Zoom Lock Object', async function() {
    const { app } = require('../../../test');
    const infillswitch = await app.client.$('div.onoffswitch');
    await infillswitch.click();

    const lock = await app.client.$('div.dimension-lock');
    await lock.click();

    const rect = await app.client.$('#svg_1');
    const rectlock = await rect.getAttribute('data-ratiofixed');
    expect(rectlock).toEqual("true");

    const rectWidth = await app.client.$('input#width');
    await rectWidth.doubleClick();
    await app.client.keys(['Backspace', '8', '0', 'Enter',"NLL"]);

    const width = await rect.getAttribute("width");
    const height= await rect.getAttribute("height");
    expect(Math.round(width)).toEqual(800);
    expect(Math.round(height)).toEqual(800);
});
