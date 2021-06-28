const { checkExist } = require('../../../util/utils');
const { mouseAction } = require('../../../util/actions');

test('Check Draw Pen', async function() {
    const { app } = require('../../../test');

    await app.client.execute(() => {
        location.reload()
    });
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

    const svg_1d = await app.client.$('#svg_1');
    const pend = await svg_1d.getAttribute('d');
    expect(pend).toEqual("M 116.607652 391.7239531 L 312.441882090385 390.5523526129813 L 507.7180583968756 390.5523526129813 L 507.7180583968756 585.8285289194719 L 507.7180583968756 781.1047052259626 L 312.441882090385 781.1047052259626 L 117.16570578389438 781.1047052259626 L 117.16570578389438 585.8285289194719 L 116.607652 391.7239531 z");

});


test('Check Draw Pen Curve', async function() {
    const { app } = require('../../../test');

    await app.client.execute(() => {
        location.reload()
    });
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
    
    await checkExist('#svg_1', 2000);
    const svg_1d = await app.client.$('#svg_1');
    const curved = await svg_1d.getAttribute('d');
    expect(curved).toEqual("M 897.7123395 587.000125 C 311.8838239 1172.8286406 1288.2646832 977.5524687 897.7123395 1172.8286406 L 507.7180583968756 1366.9332341454344");
    
});

test('Check Draw Pen Doubleclicks', async function() {
    const { app } = require('../../../test');

    await app.client.execute(() => {
        location.reload();
    });
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
    await checkExist('div#qa-tCorner-seg-item');
    await checkExist('div#qa-tSmooth-seg-item');
    await checkExist('div#qa-tSymmetry-seg-item');
   
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

    const ctrlpoint2move = await app.client.$('#ctrlpointgrip_2c1'); 
    await ctrlpoint2move.dragAndDrop({x:100, y:-150});

    const svg_1d = await app.client.$('#svg_1');
    const curved = await svg_1d.getAttribute('d');
    // console.log(curved);
    expect(curved).toEqual("M897.71234,1172.82864Q637.71616,456.03495 1093.54659,976.38088Q1549.19099,455.64442 1288.82276,1171.65706L1484.09894,976.38088L1679.37512,1171.65706");
});


test('Check Draw Pen tSmooth', async function() {
    const { app } = require('../../../test');
    /* tSmooth */
    const smooth = await app.client.$('#qa-tSmooth-seg-item');
    await smooth.click();
    const ctrlpoint1move2 = await app.client.$('#ctrlpointgrip_1c1'); 
    await ctrlpoint1move2.dragAndDrop({x:-50, y:-50});  

    const svg_2d = await app.client.$('#svg_1');
    const curve2d = await svg_2d.getAttribute('d');
    // console.lozg(curve2d);
    expect(curve2d).toEqual("M897.71234,1172.82864Q442.43999,260.75878 1093.54659,976.38088Q1559.20632,1488.18094 1288.82276,1171.65706L1484.09894,976.38088L1679.37512,1171.65706");

});

test('Check Draw Pen tSymmetry', async function() {
    const { app } = require('../../../test');
     /* tSymmetry */
     const symmetry = await app.client.$('#qa-tSymmetry-seg-item');
     await symmetry.click(); 
     const ctrlpoint2move2 = await app.client.$('#ctrlpointgrip_2c1'); 
     await ctrlpoint2move2.dragAndDrop({x:0, y:-100});
 
     const svg_3d = await app.client.$('#svg_1');
     const curve3d = await svg_3d.getAttribute('d');
     // console.log(curve3d);
     expect(curve3d).toEqual("M897.71234,1172.82864Q442.43999,651.31112 1093.54659,976.38088Q1744.65319,1301.45064 1288.82276,1171.65706L1484.09894,976.38088L1679.37512,1171.65706");
 
});
