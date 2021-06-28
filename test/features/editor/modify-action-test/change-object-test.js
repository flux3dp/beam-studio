const { checkExist } = require('../../../util/utils');
const { mouseAction } = require('../../../util/actions');

test('Check Move Object', async function() {
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
    const rectlocation = await app.client.$('#svg_1');
    // console.log(await rectlocation.getLocation());
    await new Promise((r) => setTimeout(r, 1000));

    const rectmovex = await app.client.$('input#x_position');
    await rectmovex.doubleClick();
    await app.client.keys(['Backspace', '6', '0', 'Enter',"NULL"]);


    const rectmovey = await app.client.$('input#y_position');
    await rectmovey.doubleClick();
    await app.client.keys(['Backspace', '6', '0', 'Enter',"NULL"]);

    // console.log(await rectlocation.getLocation());
    expect(await rectlocation.getLocation('x')).toEqual(323.771484375);
    expect(await rectlocation.getLocation('y')).toEqual(253.32861328125);

});

test('Check Rotate Object', async function() {
    const { app } = require('../../../test');

    const rectmovey = await app.client.$('input#rotate');
    await rectmovey.doubleClick();
    await app.client.keys(['Backspace', '4', '5', 'Enter',"NULL"]);

    const rectlocation = await app.client.$('#svg_1');
    // console.log(await rectlocation.getLocation());
    expect(await rectlocation.getLocation('x')).toEqual(313.4161071777344);
    expect(await rectlocation.getLocation('y')).toEqual(242.97325134277344);

    await app.client.execute(() =>{
        svgCanvas.undoMgr.undo();
    });
 
   
});

test('Check Zoom Object', async function() {
    const { app } = require('../../../test');
    const rectzoomin = await app.client.$('circle#selectorGrip_resize_se');
    await rectzoomin.dragAndDrop({x:200, y:200});  

    const rectlocation = await app.client.$('#svg_1');
    // console.log(await rectlocation.getLocation());
    expect(await rectlocation.getLocation('x')).toEqual(523.771484375);
    expect(await rectlocation.getLocation('y')).toEqual(453.32861328125);
    await new Promise((r) => setTimeout(r, 1000));

    const rectzoomout = await app.client.$('circle#selectorGrip_resize_se');
    await rectzoomout.dragAndDrop({x:-300, y:-300});  
    // console.log(await rectlocation.getSize());
    expect(await rectlocation.getSize('width')).toEqual(250.00010681152344);
    expect(await rectlocation.getSize('height')).toEqual(250.00010681152344);

    // await app.client.execute(() =>{
    //     svgCanvas.undoMgr.undo();
    // });
 
   
});

test('Check Infill Object', async function() {
    const { app } = require('../../../test');

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

    const rectzoomin = await app.client.$('circle#selectorGrip_resize_se');
    await rectzoomin.dragAndDrop({x:-200, y:-200});  
    const rect = await app.client.$('#svg_1');
    // console.log(await rectlocation2.getSize());
    // console.log(await rectlocation2.getLocation());
    const rectlock = await rect.getAttribute('data-ratiofixed');
    expect(rectlock).toEqual("true");
    expect(await rect.getSize('width')).toEqual(50.000099182128906);
    expect(await rect.getSize('height')).toEqual(50.00004959106445);
    expect(await rect.getLocation('x')).toEqual(273.771484375);
    expect(await rect.getLocation('y')).toEqual(203.32861328125);

});