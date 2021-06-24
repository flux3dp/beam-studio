const { pause, checkExist, checknotExist, checkVisible, updateInput } = require('../../../util/utils');
const { mouseAction, keyAction } = require('../../../util/actions');

test('Check Group Layer', async function() {
    const { app } = require('../../../test');
    
    await app.client.execute(() => {
        location.reload();
    });
    await checkExist('#svgcanvas',15000);
 
    const rect = await app.client.$('#left-Rectangle');//預設黑色
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
    
    const switchlayer2 = await app.client.$('div.tab.layers');
    await switchlayer2.click();

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

    const switchlayer3 = await app.client.$('div.tab.layers');
    await switchlayer3.click();
    
    const rectlayer0= await app.client.$('#svg_1');
    const rectcolor = await rectlayer0.getAttribute('stroke');
    const ellilayer1 = await app.client.$('#svg_2');
    const ellicolor = await ellilayer1.getAttribute('stroke');
    expect(rectcolor).not.toEqual(ellicolor);

    await mouseAction([
        { type: 'pointerMove', x: 100, y: 100, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 600, y: 600, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);

    const group = await app.client.$('#qa-group');
    await group.click();
    // await new Promise((r) => setTimeout(r, 50000));
    const rectlayer1= await app.client.$('#svg_1');
    const rectcolor2 = await rectlayer1.getAttribute('stroke');
    expect(rectcolor2).toEqual(ellicolor);
});

test('Check Unroup Layer', async function() {
    const { app } = require('../../../test');

    const ungroup = await app.client.$('#qa-ungroup');
    await ungroup.click();
    const rectlayer1= await app.client.$('#svg_1');
    const rectcolor2 = await rectlayer1.getAttribute('stroke');
    const ellilayer1 = await app.client.$('#svg_2');
    const ellicolor = await ellilayer1.getAttribute('stroke');
    expect(rectcolor2).not.toEqual(ellicolor);
    expect(rectcolor2).toEqual('#333333');
});