const { checkExist, setReload } = require('../../../../util/utils');
const { mouseAction } = require('../../../../util/actions');

test('Check Object In Diffierent Layer', async function() {
    const { app } = require('../../../../test');
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

    const switchlayer = await app.client.$('div.tab.layers');
    await switchlayer.click();

    const add = await app.client.$('div.add-layer-btn');
    await add.click();
    
    const switchlayer3 = await app.client.$('div.tab.layers');
    await switchlayer3.click();

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

    const switchlayer2 = await app.client.$('div.tab.layers');
    await switchlayer2.click();
    
    const rectlayer0= await app.client.$('#svg_1');
    const rectcolor = await rectlayer0.getAttribute('stroke');

    const ellilayer1 = await app.client.$('#svg_2');
    const ellicolor = await ellilayer1.getAttribute('stroke');
    expect(rectcolor).not.toEqual(ellicolor);
});
