const { checkExist, setReload } = require('../../../util/utils');
const { mouseAction } = require('../../../util/actions');

test('Check Offset', async function() {
    const { app } = require('../../../test');
    await setReload();
    await checkExist('#svgcanvas',15000);

    const elli = await app.client.$('#left-Ellipse');
    await elli.click();
    await mouseAction([
        { type: 'pointerMove', x: 200, y: 200, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 264, y: 264, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    await checkExist('#svg_1');

    const line = await app.client.$('#left-Line');
    await line.click(); 
    await mouseAction([
        { type: 'pointerMove', x: 250, y: 150, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 190, y: 270, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);

    const select = await app.client.$('#left-Cursor');
    await select.click();
    await mouseAction([
        { type: 'pointerMove', x: 100, y: 100, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 350, y: 350, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);

    const offset = await app.client.$('button#offset');
    await offset.click();

    const confirm = await app.client.$('button.btn.btn-default.primary');
    await confirm.click();
    await checkExist('#svg_4');

    const selectorGrip_resize_ne = await app.client.$('#selectorGrip_resize_ne');
    const cxPoint_ne = await selectorGrip_resize_ne.getAttribute('cx');
    const cyPoint_ne = await selectorGrip_resize_ne.getAttribute('cy');

    const selectorGrip_resize_nw = await app.client.$('#selectorGrip_resize_nw');
    const cxPoint_nw = await selectorGrip_resize_nw.getAttribute('cx');
    expect(Math.round(cxPoint_ne-cxPoint_nw)).toBeLessThanOrEqual(156);

    const selectorGrip_resize_se = await app.client.$('#selectorGrip_resize_se');
    const cyPoint_se = await selectorGrip_resize_se.getAttribute('cy');
    expect(Math.round(cyPoint_se-cyPoint_ne)).toBeLessThanOrEqual(168);
});
