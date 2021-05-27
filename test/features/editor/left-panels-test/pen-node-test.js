const { pause, checkExist, checkVisible, updateInput } = require('../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../util/editor-utils');
const { mouseAction, keyAction, touchAction} = require('../../../util/actions');

test('Draw Pen Node', async function() {
    const { app } = require('../../../test');

    await app.client.execute(() => {
        location.reload()
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
    expect(curved).toEqual("M894.62439,1183.08465Q631.8229,460.03373 1091.472,985.08303Q1551.17742,459.70539 1288.4886,1182.09963L1485.50521,985.08303L1682.52181,1182.09963");



    
     /* tSmooth */
    const smooth = await app.client.$('#qa-tSmooth-seg-item');
    await smooth.click();
    const ctrlpoint1move2 = await app.client.$('#ctrlpointgrip_1c1'); 
    await ctrlpoint1move2.dragAndDrop({x:-50, y:-50});  

    const svg_2d = await app.client.$('#svg_1');
    const curve2d = await svg_2d.getAttribute('d');
    // console.lozg(curve2d);
    expect(curve2d).toEqual("M894.62439,1183.08465Q434.80629,263.01712 1091.472,985.08303Q1561.16313,1501.55275 1288.4886,1182.09963L1485.50521,985.08303L1682.52181,1182.09963");




     /* tSymmetry */
    const symmetry = await app.client.$('#qa-tSymmetry-seg-item');
    await symmetry.click(); 
    const ctrlpoint2move2 = await app.client.$('#ctrlpointgrip_2c1'); 
    await ctrlpoint2move2.dragAndDrop({x:0, y:-100});

    const svg_3d = await app.client.$('#svg_1');
    const curve3d = await svg_3d.getAttribute('d');
    // console.log(curve3d);
    expect(curve3d).toEqual("M894.62439,1183.08465Q434.80629,657.05034 1091.472,985.08303Q1748.1377,1313.11571 1288.4886,1182.09963L1485.50521,985.08303L1682.52181,1182.09963");
});
