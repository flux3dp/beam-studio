const { pause, checkExist, checkVisible, updateInput } = require('../../../util/utils');
const { mouseAction, keyAction } = require('../../../util/actions');

test('Check Horizontal Flip', async function() {
    const { app } = require('../../../test');

    await app.client.execute(() => {
        location.reload()
    });
    await checkExist('#svgcanvas',15000);
    const text = await app.client.$('#left-Text');
    await text.click();
  
    await mouseAction([
        { type: 'pointerMove', x: 300, y: 300, duration: 10, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerUp', button: 0, },
    ]);
    await app.client.keys(['MIRROR', 'Space', 'TEST']);
    const HorizontalFlip = await app.client.$('div#Horizontal-Flip.tool-btn');
    await HorizontalFlip.click();
    const textnotransform = await app.client.$('#svg_1');
    const transformvalue = await textnotransform.getAttribute('transform');
    // console.log(transformvalue);
    expect(transformvalue).toEqual('matrix(-1,0,0,1,1662.203125,0) ');

    const HorizontalFlip_1 = await app.client.$('div#Horizontal-Flip.tool-btn');
    await HorizontalFlip_1.click();
    const notransformvalue = await textnotransform.getAttribute('transform');
    expect(notransformvalue).toEqual('matrix(1,0,0,1,0,0) ');

});

test('Check Vertical Flip', async function() {
    const { app } = require('../../../test');

    const VerticalFlip = await app.client.$('div#Vertical-Flip.tool-btn');
    await VerticalFlip.click();
    const texttransform = await app.client.$('#svg_1');
    const transformvalue = await texttransform.getAttribute('transform');
    // console.log(transformvalue);
    expect(transformvalue).toEqual('matrix(1,0,0,-1,0,1483.3125) ');

    const VerticalFlip_1 = await app.client.$('div#Vertical-Flip.tool-btn');
    await VerticalFlip_1.click();
    const notransformvalue = await texttransform.getAttribute('transform');
    expect(notransformvalue).toEqual('matrix(1,0,0,1,0,0) ');

});
