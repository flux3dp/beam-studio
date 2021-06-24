const { pause, checkExist, checkVisible, updateInput } = require('../../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../../util/actions');

test('Check Object Of Lock Layer', async function() {
    const { app } = require('../../../../test');
    
    await app.client.execute(() => {
        location.reload();
    });
    await checkExist('#svgcanvas', 15000);
    const elli = await app.client.$('#left-Ellipse');
    await elli.click();

    await mouseAction([
        { type: 'pointerMove', x: 400, y: 400, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 464, y: 464, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    await checkExist('#svg_1');
    const switchlayer = await app.client.$('div.tab.layers');
    await switchlayer.click();

    const rightclick = await app.client.$('[data-test-key="layer-0"]');
    await rightclick.click({ button: 2});
    const chooselock = await app.client.$('div#locklayer');
    await chooselock.click();
    
    const obj = await app.client.$('g.layer');
    await obj.getAttribute('data-lock');
    expect(await obj.getAttribute('data-lock')).toEqual("true");

    await mouseAction([
        { type: 'pointerMove', x: 300, y: 300, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 500, y: 500, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);

    const result = await app.client.execute(() =>{
        return svgCanvas.getSelectedElems();
    });
    
    expect(result).toEqual([]);
});