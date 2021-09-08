const { checkExist, setReload, mousewheel } = require('../../../util/utils');
const { mouseAction, zoomAction, continuousAction, keyAction } = require('../../../util/actions');

test('Check Move Canvas by Mouse ', async function() {
    const { app } = require('../../../test');
    await setReload();
    await checkExist('#svgcanvas', 15000);

    await mouseAction([
        { type: 'pointerMove', x: 100, y: 100, duration: 100, },
        { type: 'pointerDown', button: 1, },
        { type: 'pointerMove', x: 400, y: 400, duration: 1000, },
        { type: 'pointerMove', x: 100, y: 200, duration: 1000, },
        { type: 'pointerMove', x: 500, y: 300, duration: 1000, },
        { type: 'pointerUp', button: 1, },
    ]);
    const canvas =await app.client.$('canvas');
    expect(await canvas.getLocation()).toEqual({ x: -198, y: 70 });
});

// test('Check Zoom Canvas by Touch ', async function() {
//     const { app } = require('../../../test');
//     await setReload();
//     await checkExist('#svgcanvas', 15000);
//     const poly = await app.client.$('#left-Polygon');
//     await poly.click();
//     await keyAction(
        
//     );
//     await mouseAction([
//         { type: 'pointerMove', x: 200, y: 200, duration: 100, },
//         { type: 'pointerDown', button: 0, },
//         { type: 'pointerMove', x: 250, y: 250, duration: 1000, },
//         { type: 'pointerUp', button: 0, },
//     ]);
//     await checkExist('#svg_1');
//     await zoomAction();
//     await continuousAction();
    // console.log(await continuousAction());
    // const result = await app.client.execute(() => {
    //     const zoomValue = svgCanvas.getZoom();
    //     return zoomValue;
    // });
    // console.log(result);
// });
