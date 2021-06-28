const { checkExist } = require('../../../../util/utils');
const { mouseAction } = require('../../../../util/actions');

test('Check Drag Layer', async function() {
    const { app } = require('../../../../test');
    await app.client.execute(() => {
        location.reload();
    });
    await checkExist('#svgcanvas', 15000);
    const add1 = await app.client.$('div.add-layer-btn');
    await add1.click();

    const add2 = await app.client.$('div.add-layer-btn');
    await add2.click();

    const checklayer2color = await app.client.$('div#layerbackgroundColor-2');
    expect(await checklayer2color.getAttribute('style')).toEqual("background-color: rgb(244, 67, 54);");

    const choosedraglayer = await app.client.$('[data-test-key="layer-1"]'); 
    await choosedraglayer.dragAndDrop({x:0, y:30}); 

    const checklayer1color = await app.client.$('div#layerbackgroundColor-2');
    expect(await checklayer1color.getAttribute('style')).toEqual("background-color: rgb(63, 81, 181);");
});


test('Check Drag Object of Layer', async function() {
    const { app } = require('../../../../test');
    
    await app.client.execute(() => {
        location.reload();
    });
    await checkExist('#svgcanvas', 15000);
    
    const add1 = await app.client.$('div.add-layer-btn');
    await add1.click();

    const rect = await app.client.$('#left-Rectangle');
    await rect.click();

    await mouseAction([
        { type: 'pointerMove', x: 300, y: 300, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 350, y: 350, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    

    const elli = await app.client.$('#left-Ellipse');
    await elli.click();

    await mouseAction([
        { type: 'pointerMove', x: 400, y: 400, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 464, y: 464, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    await checkExist('#svg_1');

    const polygon = await app.client.$('#left-Polygon');
    await polygon.click();

    await mouseAction([
        { type: 'pointerMove', x: 500, y: 500, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 550, y: 550, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    const rectlocation = await app.client.$('#svg_1');
    await rectlocation.getLocation();
    // console.log(await rectlocation.getLocation());

    const ellilocation = await app.client.$('#svg_2');
    await ellilocation.getLocation();
    // console.log(await ellilocation.getLocation());

    const polylocation = await app.client.$('#svg_3');
    await polylocation.getLocation();
    // console.log(await polylocation.getLocation());

    const switchlayer = await app.client.$('div.tab.layers');
    await switchlayer.click();

    const add2 = await app.client.$('div.add-layer-btn');
    await add2.click();

    const checklayer2color = await app.client.$('div#layerbackgroundColor-2');
    expect(await checklayer2color.getAttribute('style')).toEqual("background-color: rgb(244, 67, 54);");

    const choosedraglayer = await app.client.$('[data-test-key="layer-1"]'); 
    await choosedraglayer.dragAndDrop({x:0, y:30}); 

    const checklayer1color = await app.client.$('div#layerbackgroundColor-2');
    expect(await checklayer1color.getAttribute('style')).toEqual("background-color: rgb(63, 81, 181);");

    const rectlocation2 = await app.client.$('#svg_1');
    expect(await rectlocation.getLocation()).toEqual(await rectlocation2.getLocation());

    const ellilocation2 = await app.client.$('#svg_2');
    expect(await ellilocation.getLocation()).toEqual(await ellilocation2.getLocation());

    const polylocation2 = await app.client.$('#svg_3');
    expect(await polylocation.getLocation()).toEqual(await polylocation2.getLocation());

});