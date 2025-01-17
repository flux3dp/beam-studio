const { pause, checkExist, checkVisible, updateInput, setReload } = require('../../../util/utils');
const { mouseAction, keyAction } = require('../../../util/actions');

test('Check Color of Layer & object', async function() {
    const { app } = require('../../../test');
    await setReload();
    await checkExist('#svgcanvas', 15000);
    
    const rect = await app.client.$('#left-Rectangle');
    await rect.click();
    await mouseAction([
        { type: 'pointerMove', x: 200, y: 200, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 250, y: 250, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    await checkExist('#svg_1');

    const switchLayer = await app.client.$('div.tab.layers');
    await switchLayer.click();

    const add = await app.client.$('div.add-layer-btn');
    await add.click();
    
    const switchLayer3 = await app.client.$('div.tab.layers');
    await switchLayer3.click();

    await checkExist('[data-test-key="layer-1"]');
    
    const elli = await app.client.$('#left-Ellipse');
    await elli.click();
    await mouseAction([
        { type: 'pointerMove', x: 300, y: 300, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 364, y: 364, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    await checkExist('#svg_2');

    const switchLayer2 = await app.client.$('div.tab.layers');
    await switchLayer2.click();
    
    const rectLayer0= await app.client.$('#svg_1');
    const rectColor = await rectLayer0.getAttribute('stroke');

    const elliLayer1 = await app.client.$('#svg_2');
    const elliColor = await elliLayer1.getAttribute('stroke');
    expect(rectColor).not.toEqual(elliColor);

    const switchLayer4 = await app.client.$('div.tab.layers');
    await switchLayer4.click();

    const add2 = await app.client.$('div.add-layer-btn');
    await add2.click();

    const text = await app.client.$('#left-Text');
    await text.click();
    await mouseAction([
        { type: 'pointerMove', x: 400, y: 300, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerUp', button: 0, },
    ]);
    await app.client.keys(['You can see the COLOR!', "NULL"]);
    await checkExist('#svg_3');

    const switchLayer5 = await app.client.$('div.tab.layers');
    await switchLayer5.click();
    
    const textLayer2= await app.client.$('#svg_1');
    const textColor = await textLayer2.getAttribute('stroke');

    const elliLayer2 = await app.client.$('#svg_2');
    const elliColor1 = await elliLayer2.getAttribute('stroke');
    expect(textColor).not.toEqual(elliColor1);
});
