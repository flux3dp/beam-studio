const { checkExist, setReload } = require('../../../util/utils');
const { mouseAction } = require('../../../util/actions');

test('Check Top Align', async function() {
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
    
    const rect2 = await app.client.$('#left-Rectangle');
    await rect2.click();
    await mouseAction([
        { type: 'pointerMove', x: 350, y: 350, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 400, y: 400, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    await checkExist('#svg_2');
    
    const rect3 = await app.client.$('#left-Rectangle');
    await rect3.click();
    await mouseAction([
        { type: 'pointerMove', x: 450, y: 450, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 500, y: 500, duration: 1000, },
        { type: 'pointerUp', button: 0, },
        { type: 'pointerMove', x: 510, y: 510, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerUp', button: 0, },
    ]);
    await checkExist('#svg_3');

    if(process.platform === 'darwin'){
        await app.client.keys(['Command', 'a', "NULL"]);
    } 
    else{
        await app.client.keys(['Control', 'a', "NULL"]);
    }

    const topalign = await app.client.$('#top_align');
    await topalign.click();
    
    const rectlocation = await app.client.$('#svg_1');
    const rect2location = await app.client.$('#svg_2');
    const rect3location = await app.client.$('#svg_3');
    expect(await rectlocation.getLocation('y')).toEqual(await rect2location.getLocation('y'));
    expect(await rectlocation.getLocation('y')).toEqual(await rect3location.getLocation('y'));
});

test('Check Middle Align', async function() {
    const { app } = require('../../../test');
    await app.client.execute(() =>{
        svgCanvas.undoMgr.undo();
    });

    if(process.platform === 'darwin'){
        await app.client.keys(['Command', 'a', "NULL"]);
    } 
    else{
        await app.client.keys(['Control', 'a', "NULL"]);
    }

    const middlealign = await app.client.$('#middle_align');
    await middlealign.click();
    
    const rectlocation = await app.client.$('#svg_1');
    const rect2location = await app.client.$('#svg_2');
    const rect3location = await app.client.$('#svg_3');
    expect(await rectlocation.getLocation('y')).toEqual(await rect2location.getLocation('y'));
    expect(await rectlocation.getLocation('y')).toEqual(await rect3location.getLocation('y'));
});

test('Check bottom Align', async function() {
    const { app } = require('../../../test');
    await app.client.execute(() =>{
        svgCanvas.undoMgr.undo();
    });

    if(process.platform === 'darwin'){
        await app.client.keys(['Command', 'a', "NULL"]);
    } 
    else{
        await app.client.keys(['Control', 'a', "NULL"]);
    }
    
    const bottomalign = await app.client.$('#bottom_align');
    await bottomalign.click();

    const rectlocation = await app.client.$('#svg_1');
    const rect2location = await app.client.$('#svg_2');
    const rect3location = await app.client.$('#svg_3');
    expect(await rectlocation.getLocation('y')).toEqual(await rect2location.getLocation('y'));
    expect(await rectlocation.getLocation('y')).toEqual(await rect3location.getLocation('y'));
});

test('Check Left Align', async function() {
    const { app } = require('../../../test');
    await app.client.execute(() =>{
        svgCanvas.undoMgr.undo();
    });

    if(process.platform === 'darwin'){
        await app.client.keys(['Command', 'a', "NULL"]);
    } 
    else{
        await app.client.keys(['Control', 'a', "NULL"]);
    }

    const leftalign = await app.client.$('#left_align');
    await leftalign.click();

    const rectlocation = await app.client.$('#svg_1');
    const rect2location = await app.client.$('#svg_2');
    const rect3location = await app.client.$('#svg_3');
    expect(await rectlocation.getLocation('x')).toEqual(await rect2location.getLocation('x'));
    expect(await rectlocation.getLocation('x')).toEqual(await rect3location.getLocation('x'));
});

test('Check Center Align', async function() {
    const { app } = require('../../../test');
    await app.client.execute(() =>{
        svgCanvas.undoMgr.undo();
    });

    if(process.platform === 'darwin'){
        await app.client.keys(['Command', 'a', "NULL"]);
    } 
    else{
        await app.client.keys(['Control', 'a', "NULL"]);
    }

    const centeralign = await app.client.$('#center_align');
    await centeralign.click();
    
    const rectlocation = await app.client.$('#svg_1');
    const rect2location = await app.client.$('#svg_2');
    const rect3location = await app.client.$('#svg_3');
    expect(await rectlocation.getLocation('x')).toEqual(await rect2location.getLocation('x'));
    expect(await rectlocation.getLocation('x')).toEqual(await rect3location.getLocation('x'));
});

test('Check Right Align', async function() {
    const { app } = require('../../../test');
    await app.client.execute(() =>{
        svgCanvas.undoMgr.undo();
    });

    if(process.platform === 'darwin'){
        await app.client.keys(['Command', 'a', "NULL"]);
    } 
    else{
        await app.client.keys(['Control', 'a', "NULL"]);
    }

    const rightalign = await app.client.$('div#right_align.tool-btn');
    await rightalign.click();
    
    const rectlocation = await app.client.$('#svg_1');
    const rect2location = await app.client.$('#svg_2');
    const rect3location = await app.client.$('#svg_3');
    expect(await rectlocation.getLocation('x')).toEqual(await rect2location.getLocation('x'));
    expect(await rectlocation.getLocation('x')).toEqual(await rect3location.getLocation('x'));
});
