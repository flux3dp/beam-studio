const { pause, checkExist, checkVisible, updateInput } = require('../../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../../util/actions');

test('Check Move Object In Diffierent Layer', async function() {
    const { app } = require('../../../../test');
    
    await app.client.execute(() => {
        location.reload();
    });
    await checkExist('#svgcanvas', 15000);
    
    const rect = await app.client.$('#left-Rectangle');
    await rect.click();
    await mouseAction([
        { type: 'pointerMove', x: 300, y: 300, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 400, y: 400, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    await checkExist('#svg_1');
    const rectlayer0= await app.client.$('#svg_1');
    const rectcolor = await rectlayer0.getAttribute('stroke');
    expect(rectcolor).toEqual("#333333");


    const switchlayer = await app.client.$('div.tab.layers');
    await switchlayer.click();

    const add1 = await app.client.$('div.add-layer-btn');
    await add1.click();

    const add2 = await app.client.$('div.add-layer-btn');
    await add2.click();

    await mouseAction([
        { type: 'pointerMove', x: 290, y: 290, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 410, y: 410, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);

    const switchlayer2 = await app.client.$('div.tab.layers');
    await switchlayer2.click();

    const moveobjtolayer1 = await app.client.$('option[value="圖層 1"]');
    await moveobjtolayer1.click();

    const movenext = await app.client.$('button.btn.btn-default.primary');
    await movenext.click();
    
    const rectlayer1 = await app.client.$('#svg_1');
    const rectcolor1 = await rectlayer1.getAttribute('stroke');
    expect(rectcolor1).toEqual("#3F51B5");

    const moveobjtolayer2 = await app.client.$('option[value="圖層 2"]');
    await moveobjtolayer2.click();

    const rectlayer2 = await app.client.$('#svg_1');
    const rectcolor2 = await rectlayer2.getAttribute('stroke');
    expect(rectcolor2).toEqual("#F44336");
    
});