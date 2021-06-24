const { pause, checkExist, checknotExist, checkVisible, updateInput } = require('../../../util/utils');
const { mouseAction, keyAction } = require('../../../util/actions');

test('Check Top align', async function() {
    const { app } = require('../../../test');

    await app.client.execute(() => {
        location.reload();
    });
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

    await mouseAction([
        { type: 'pointerMove', x: 100, y: 100, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 600, y: 600, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);

    const topalign = await app.client.$('#qa-top_align');
    await topalign.click();
    

    const rectlocation = await app.client.$('#svg_1');
    const rect2location = await app.client.$('#svg_2');
    const rect3location = await app.client.$('#svg_3');
    expect(await rectlocation.getLocation('y')).toEqual(await rect2location.getLocation('y'));
    expect(await rectlocation.getLocation('y')).toEqual(await rect3location.getLocation('y'));
    console.log(await rectlocation.getLocation('y'));
    await app.client.execute(() =>{
        svgCanvas.undoMgr.undo();
    });
 
   
});

test('Check Middle align', async function() {
    const { app } = require('../../../test');

    await mouseAction([
        { type: 'pointerMove', x: 100, y: 100, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 600, y: 600, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);

    const middlealign = await app.client.$('#qa-middle_align');
    await middlealign.click();
    

    const rectlocation = await app.client.$('#svg_1');
    const rect2location = await app.client.$('#svg_2');
    const rect3location = await app.client.$('#svg_3');
    console.log(await rectlocation.getLocation('y'));
    expect(await rectlocation.getLocation('y')).toEqual(await rect2location.getLocation('y'));
    expect(await rectlocation.getLocation('y')).toEqual(await rect3location.getLocation('y'));
 
    await app.client.execute(() =>{
        svgCanvas.undoMgr.undo();
    });
 
   
});
test('Check bottom align', async function() {
    const { app } = require('../../../test');

    await mouseAction([
        { type: 'pointerMove', x: 100, y: 100, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 600, y: 600, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);

    const bottomalign = await app.client.$('#qa-bottom_align');
    await bottomalign.click();
    

    const rectlocation = await app.client.$('#svg_1');
    const rect2location = await app.client.$('#svg_2');
    const rect3location = await app.client.$('#svg_3');
    console.log(await rectlocation.getLocation('y'));
    expect(await rectlocation.getLocation('y')).toEqual(await rect2location.getLocation('y'));
    expect(await rectlocation.getLocation('y')).toEqual(await rect3location.getLocation('y'));
 
    await app.client.execute(() =>{
        svgCanvas.undoMgr.undo();
    });
 
   
});


test('Check Left align', async function() {
    const { app } = require('../../../test');

    await mouseAction([
        { type: 'pointerMove', x: 100, y: 100, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 600, y: 600, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);

    const leftalign = await app.client.$('#qa-left_align');
    await leftalign.click();
    

    const rectlocation = await app.client.$('#svg_1');
    const rect2location = await app.client.$('#svg_2');
    const rect3location = await app.client.$('#svg_3');
    expect(await rectlocation.getLocation('x')).toEqual(await rect2location.getLocation('x'));
    expect(await rectlocation.getLocation('x')).toEqual(await rect3location.getLocation('x'));
    console.log(await rectlocation.getLocation('x'));
    await app.client.execute(() =>{
        svgCanvas.undoMgr.undo();
    });


});


test('check Center align', async function() {
    const { app } = require('../../../test');

    await mouseAction([
        { type: 'pointerMove', x: 100, y: 100, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 600, y: 600, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);

    const centeralign = await app.client.$('#qa-center_align');
    await centeralign.click();
    

    const rectlocation = await app.client.$('#svg_1');
    const rect2location = await app.client.$('#svg_2');
    const rect3location = await app.client.$('#svg_3');
    expect(await rectlocation.getLocation('x')).toEqual(await rect2location.getLocation('x'));
    expect(await rectlocation.getLocation('x')).toEqual(await rect3location.getLocation('x'));
    console.log(await rectlocation.getLocation('x'));
    await app.client.execute(() =>{
        svgCanvas.undoMgr.undo();
    });


});


test('check Right align', async function() {
        const { app } = require('../../../test');
    
        await mouseAction([
            { type: 'pointerMove', x: 100, y: 100, duration: 100, },
            { type: 'pointerDown', button: 0, },
            { type: 'pointerMove', x: 600, y: 600, duration: 1000, },
            { type: 'pointerUp', button: 0, },
        ]);
    
        const rightalign = await app.client.$('#qa-right_align');
        await rightalign.click();
        
    
        const rectlocation = await app.client.$('#svg_1');
        const rect2location = await app.client.$('#svg_2');
        const rect3location = await app.client.$('#svg_3');
        expect(await rectlocation.getLocation('x')).toEqual(await rect2location.getLocation('x'));
        expect(await rectlocation.getLocation('x')).toEqual(await rect3location.getLocation('x'));
        console.log(await rectlocation.getLocation('x'));
        await app.client.execute(() =>{
            svgCanvas.undoMgr.undo();
        });


});


