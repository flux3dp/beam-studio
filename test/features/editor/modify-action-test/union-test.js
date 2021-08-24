const { checkExist, setReload, checknotExist } = require('../../../util/utils');
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

    const unino = await app.client.$('#union');
    await unino.click();
    await checkExist('#svg_4');

    const selectGrip = await app.client.$('#selectorGrip_resize_ne');
    await selectGrip.doubleClick();

    const pathpointgrip_0 = await app.client.$('#pathpointgrip_0');
    const cxPoint_0 = await pathpointgrip_0.getAttribute('cx');
    const pathpointgrip_1 = await app.client.$('#pathpointgrip_1');
    const cxPoint_1 = await pathpointgrip_1.getAttribute('cx');
    expect(Math.round(cxPoint_1-cxPoint_0)).toEqual(50);

    const pathpointgrip_5 = await app.client.$('#pathpointgrip_5');
    const cxPoint_5 = await pathpointgrip_5.getAttribute('cx');
    const pathpointgrip_4 = await app.client.$('#pathpointgrip_4');
    const cxPoint_4 = await pathpointgrip_4.getAttribute('cx');
    expect(Math.round(cxPoint_4-cxPoint_5)).toEqual(50);
});

test('Check Subtract ', async function() {
    const { app } = require('../../../test');
    await app.client.execute(() =>{
        svgCanvas.undoMgr.undo();
    });
    const select = await app.client.$('#left-Cursor');
    await select.click();

    await mouseAction([
        { type: 'pointerMove', x: 100, y: 100, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 400, y: 400, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);

    const subtract = await app.client.$('#subtract');
    await subtract.click();
    
    await checknotExist('#svg_5')
    await checkExist('#svg_6');

    const selectGrip = await app.client.$('#selectorGrip_resize_ne');
    await selectGrip.doubleClick();

    const pathpointgrip_2 = await app.client.$('#pathpointgrip_2');
    const cxPoint_2 = await pathpointgrip_2.getAttribute('cx');
    const pathpointgrip_3 = await app.client.$('#pathpointgrip_3');
    const cxPoint_3 = await pathpointgrip_3.getAttribute('cx');
    const cyPoint_3 = await pathpointgrip_3.getAttribute('cy');
    expect(Math.round(cxPoint_3-cxPoint_2)).toEqual(50);

    const pathpointgrip_4 = await app.client.$('#pathpointgrip_4');
    const cyPoint_4 = await pathpointgrip_4.getAttribute('cy');
    expect(Math.round(cyPoint_3-cyPoint_4)).toEqual(50);
});

test('Check Intersect ', async function() {
    const { app } = require('../../../test');
    await app.client.execute(() =>{
        svgCanvas.undoMgr.undo();
    });
    const select = await app.client.$('#left-Cursor');
    await select.click();

    await mouseAction([
        { type: 'pointerMove', x: 100, y: 100, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 400, y: 400, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);

    const intersect = await app.client.$('#intersect');
    await intersect.click();
    await checkExist('#svg_8');

    const selectGrip = await app.client.$('#selectorGrip_resize_ne');
    await selectGrip.doubleClick();

    const pathpointgrip_0 = await app.client.$('#pathpointgrip_0');
    const cxPoint_0 = await pathpointgrip_0.getAttribute('cx');
    const pathpointgrip_1 = await app.client.$('#pathpointgrip_1');
    const cxPoint_1 = await pathpointgrip_1.getAttribute('cx');
    expect(Math.round(cxPoint_0-cxPoint_1)).toEqual(50);

    const pathpointgrip_2 = await app.client.$('#pathpointgrip_2');
    const cxPoint_2 = await pathpointgrip_2.getAttribute('cx');
    const pathpointgrip_3 = await app.client.$('#pathpointgrip_3');
    const cxPoint_3 = await pathpointgrip_3.getAttribute('cx');
    expect(Math.round(cxPoint_3-cxPoint_2)).toEqual(50);
});

test('Check Difference ', async function() {
    const { app } = require('../../../test');
    await app.client.execute(() =>{
        svgCanvas.undoMgr.undo();
    });
    const select = await app.client.$('#left-Cursor');
    await select.click();

    await mouseAction([
        { type: 'pointerMove', x: 100, y: 100, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 400, y: 400, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);

    const difference = await app.client.$('#difference');
    await difference.click();

    const infillswitch = await app.client.$('div.onoffswitch');
    await infillswitch.click();

    await checkExist('#svg_10');
    const result = await app.client.execute(() =>{
        const groupvisible = svgCanvas.getVisibleElements();
        const grouplength = $('#svg_10').children().length;
        return {grouplength, groupvisible};
    });
    expect(result.grouplength).toEqual(0);
    expect(result.groupvisible.length).toEqual(1);

    const selectGrip = await app.client.$('#selectorGrip_resize_ne');
    await selectGrip.doubleClick();

    const pathpointgrip_7 = await app.client.$('#pathpointgrip_7');
    const cxPoint_7 = await pathpointgrip_7.getAttribute('cx');
    const pathpointgrip_6 = await app.client.$('#pathpointgrip_6');
    const cxPoint_6 = await pathpointgrip_6.getAttribute('cx');
    expect(Math.round(cxPoint_6-cxPoint_7)).toEqual(50);

    const pathpointgrip_3 = await app.client.$('#pathpointgrip_3');
    const cxPoint_3 = await pathpointgrip_3.getAttribute('cx');
    const pathpointgrip_8 = await app.client.$('#pathpointgrip_8');
    const cxPoint_8 = await pathpointgrip_8.getAttribute('cx');
    expect(Math.round(cxPoint_3-cxPoint_8)).toEqual(50);
});
