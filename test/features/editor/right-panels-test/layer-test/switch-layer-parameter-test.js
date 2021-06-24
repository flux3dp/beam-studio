const { pause, checkExist, checkVisible, updateInput } = require('../../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../../util/actions');

test('Check Switch Layer Parameter', async function() {
    const { app } = require('../../../../test');
    
    await app.client.execute(() => {
        location.reload();
    });
    
    await checkExist('#svgcanvas', 15000);
    const wood3cut = await app.client.$('option[value="木板 - 3mm 切割"]');
    await wood3cut.click();

    const add1 = await app.client.$('div.add-layer-btn');
    await add1.click();

    const wood5cut = await app.client.$('option[value="木板 - 5mm 切割"]');
    await wood5cut.click();

    const add2 = await app.client.$('div.add-layer-btn');
    await add2.click();

    const acrylic3cut = await app.client.$('option[value="壓克力 - 3mm 切割"]');
    await acrylic3cut.click();

    const add3 = await app.client.$('div.add-layer-btn');
    await add3.click();

    const acrylic5cut = await app.client.$('option[value="壓克力 - 5mm 切割"]');
    await acrylic5cut.click();

    const checklayer1parameter = await app.client.$('[data-test-key="layer-1"]');
    await checklayer1parameter.click();

    const wood5cutpower= await app.client.$('input#qa-power');
    const wood5cutpowernumber = await wood5cutpower.getAttribute('value');
    expect(wood5cutpowernumber).toEqual('55');
    const wood5cutspeed= await app.client.$('input#qa-speed');
    const wood5cutspeednumber = await wood5cutspeed.getAttribute('value');
    expect(wood5cutspeednumber).toEqual('4');
    const wood5cutrepeat= await app.client.$('input#qa-repect');
    const wood5cutrepeatnumber = await wood5cutrepeat.getAttribute('value');
    expect(wood5cutrepeatnumber).toEqual('2');


    const checklayer3parameter = await app.client.$('[data-test-key="layer-3"]');
    await checklayer3parameter.click();

    const acrylic5cutpower= await app.client.$('input#qa-power');
    const acrylic5cutpowernumber = await acrylic5cutpower.getAttribute('value');
    expect(acrylic5cutpowernumber).toEqual('55');
    const acrylic5cutspeed= await app.client.$('input#qa-speed');
    const acrylic5cutspeednumber = await acrylic5cutspeed.getAttribute('value');
    expect(acrylic5cutspeednumber).toEqual('5');
    const acrylic5cutrepeat= await app.client.$('input#qa-repect');
    const acrylic5cutrepeatnumber = await acrylic5cutrepeat.getAttribute('value');
    expect(acrylic5cutrepeatnumber).toEqual('2');



});