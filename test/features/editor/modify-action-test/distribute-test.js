const { checkExist, setReload } = require('../../../util/utils');
const { mouseAction } = require('../../../util/actions');

test('Check Vertical Distribute', async function() {
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
        { type: 'pointerMove', x: 330, y: 330, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 380, y: 380, duration: 1000, },
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

    const vdistalign = await app.client.$('#vdist');
    await vdistalign.click();

    const rectlocation = await app.client.$('#svg_1');
    const rect2location = await app.client.$('#svg_2');
    const rect3location = await app.client.$('#svg_3');
    // await new Promise((r) => setTimeout(r, 150000));
    
    const recty12 = await rect2location.getLocation('y')-await rectlocation.getLocation('y');
    const recty23 = await rect3location.getLocation('y')-await rect2location.getLocation('y');

    expect(recty12).toEqual(100);
    expect(recty23).toEqual(100);
});

test('Check Horizontal Distribute', async function() {
    const { app } = require('../../../test');

    await mouseAction([
        { type: 'pointerMove', x: 100, y: 100, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 600, y: 600, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);

    const hidstalign = await app.client.$('#hdist');
    await hidstalign.click();

    const rectlocation = await app.client.$('#svg_1');
    const rect2location = await app.client.$('#svg_2');
    const rect3location = await app.client.$('#svg_3');

    const recty12 = await rect2location.getLocation('x')-await rectlocation.getLocation('x');
    const recty23 = await rect3location.getLocation('x')-await rect2location.getLocation('x')
    expect(recty12).toEqual(100);
    expect(recty23).toEqual(100);
});
