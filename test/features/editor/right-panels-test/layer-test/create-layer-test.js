const { checkExist, setReload } = require('../../../../util/utils');

test('Check Add New Layer', async function() {
    const { app } = require('../../../../test');
    await setReload();
    await checkExist('#svgcanvas', 15000);
    
    const add1 = await app.client.$('div.add-layer-btn');
    await add1.click();
    await checkExist('[data-test-key="layer-1"]');
    const layer1 = await app.client.$('div.layer.layersel.current ');
    const layer1data = await layer1.getAttribute('data-test-key');
    expect(layer1data).toEqual('layer-1');
    const innerHTMLlayer1 = await app.client.$('div.layercolor');
    await innerHTMLlayer1.getHTML();
    expect(await innerHTMLlayer1.getHTML()).toEqual('<div class=\"layercolor\"><div id=\"layerbackgroundColor-1\" style=\"background-color: rgb(63, 81, 181);\"></div></div>');

    const add2 = await app.client.$('div.add-layer-btn');
    await add2.click();
    await checkExist('[data-test-key="layer-2"]');
    const layer2 = await app.client.$('div.layer.layersel.current');
    const layer2data = await layer2.getAttribute('data-test-key');
    expect(layer2data).toEqual('layer-2');
    const innerHTMLlayer2 = await app.client.$('div.layercolor');
    await innerHTMLlayer2.getHTML();
    expect(await innerHTMLlayer2.getHTML()).toEqual('<div class=\"layercolor\"><div id=\"layerbackgroundColor-2\" style=\"background-color: rgb(244, 67, 54);\"></div></div>');

    const add3 = await app.client.$('div.add-layer-btn');
    await add3.click();
    await checkExist('[data-test-key="layer-3"]');
    const layer3 = await app.client.$('div.layer.layersel.current');
    const layer3data = await layer3.getAttribute('data-test-key');
    expect(layer3data).toEqual('layer-3');
    const innerHTMLlayer3 = await app.client.$('div.layercolor');
    await innerHTMLlayer3.getHTML();
    expect(await innerHTMLlayer3.getHTML()).toEqual('<div class=\"layercolor\"><div id=\"layerbackgroundColor-3\" style="background-color: rgb(255, 193, 7);"></div></div>');

    const add4 = await app.client.$('div.add-layer-btn');
    await add4.click();
    await checkExist('[data-test-key="layer-4"]');
    const layer4 = await app.client.$('div.layer.layersel.current');
    const layer4data = await layer4.getAttribute('data-test-key');
    expect(layer4data).toEqual('layer-4');
    const innerHTMLlayer4 = await app.client.$('div.layercolor');
    await innerHTMLlayer4.getHTML();
    expect(await innerHTMLlayer4.getHTML()).toEqual("<div class=\"layercolor\"><div id=\"layerbackgroundColor-4\" style=\"background-color: rgb(139, 195, 74);\"></div></div>");
});
