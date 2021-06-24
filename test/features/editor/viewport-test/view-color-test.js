const { pause, checkExist, checkVisible, updateInput } = require('../../../util/utils');
const { mouseAction, keyAction } = require('../../../util/actions');


test('Check Color of Layer & object', async function() {
    const { app } = require('../../../test');
    await app.client.execute(() => {
        location.reload();
    });
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


    const switchlayer4 = await app.client.$('div.tab.layers');
    await switchlayer4.click();

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

    const switchlayer5 = await app.client.$('div.tab.layers');
    await switchlayer5.click();
    
    const textlayer2= await app.client.$('#svg_1');
    const textcolor = await textlayer2.getAttribute('stroke');

    const ellilayer2 = await app.client.$('#svg_2');
    const ellicolor_1 = await ellilayer2.getAttribute('stroke');
    expect(textcolor).not.toEqual(ellicolor_1);








    
    
});