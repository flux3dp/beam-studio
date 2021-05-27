const { pause, checkExist, checkVisible, updateInput } = require('../../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../../util/actions');

test('Switch Option Check Parameter', async function() {
    const { app } = require('../../../../test');
    
    await app.client.execute(() => {
        location.reload();
    });
    await checkExist('#svgcanvas',15000);

    /* Wood */
    const wood3cut = await app.client.$('option[value="木板 - 3mm 切割"]');
    await wood3cut.click();
    const wood3cutpower= await app.client.$('div#strength.panel input');
    const wood3cutpowernumber = await wood3cutpower.getAttribute('value');
    expect(wood3cutpowernumber).toEqual('45');
    const wood3cutspeed= await app.client.$('div#speed.panel input');
    const wood3cutspeednumber = await wood3cutspeed.getAttribute('value');
    expect(wood3cutspeednumber).toEqual('5');
    const wood3cutrepeat= await app.client.$('div#repeat.panel.without-drag input');
    const wood3cutrepeatnumber = await wood3cutrepeat.getAttribute('value');
    expect(wood3cutrepeatnumber).toEqual('1');

    const wood5cut = await app.client.$('option[value="木板 - 5mm 切割"]');
    await wood5cut.click();
    const wood5cutpower= await app.client.$('div#strength.panel input');
    const wood5cutpowernumber = await wood5cutpower.getAttribute('value');
    expect(wood5cutpowernumber).toEqual('55');
    const wood5cutspeed= await app.client.$('div#speed.panel input');
    const wood5cutspeednumber = await wood5cutspeed.getAttribute('value');
    expect(wood5cutspeednumber).toEqual('4');
    const wood5cutrepeat= await app.client.$('div#repeat.panel.without-drag input');
    const wood5cutrepeatnumber = await wood5cutrepeat.getAttribute('value');
    expect(wood5cutrepeatnumber).toEqual('2');

    const woodEngraving = await app.client.$('option[value="木板 - 刻印"]');
    await woodEngraving.click();
    const woodEngravingpower= await app.client.$('div#strength.panel input');
    const woodEngravingpowernumber = await woodEngravingpower.getAttribute('value');
    expect(woodEngravingpowernumber).toEqual('25');
    const woodEngravingspeed= await app.client.$('div#speed.panel input');
    const woodEngravingspeednumber = await woodEngravingspeed.getAttribute('value');
    expect(woodEngravingspeednumber).toEqual('150');
    const woodEngravingrepeat= await app.client.$('div#repeat.panel.without-drag input');
    const woodEngravingrepeatnumber = await woodEngravingrepeat.getAttribute('value');
    expect(woodEngravingrepeatnumber).toEqual('1');


    /* Acrylic */
    const acrylic3cut = await app.client.$('option[value="壓克力 - 3mm 切割"]');
    await acrylic3cut.click();
    const acrylic3cutpower= await app.client.$('div#strength.panel input');
    const acrylic3cutpowernumber = await acrylic3cutpower.getAttribute('value');
    expect(acrylic3cutpowernumber).toEqual('55');
    const acrylic3cutspeed= await app.client.$('div#speed.panel input');
    const acrylic3cutspeednumber = await acrylic3cutspeed.getAttribute('value');
    expect(acrylic3cutspeednumber).toEqual('4');
    const acrylic3cutrepeat= await app.client.$('div#repeat.panel.without-drag input');
    const acrylic3cutrepeatnumber = await acrylic3cutrepeat.getAttribute('value');
    expect(acrylic3cutrepeatnumber).toEqual('1');

    const acrylic5cut = await app.client.$('option[value="壓克力 - 5mm 切割"]');
    await acrylic5cut.click();
    const acrylic5cutpower= await app.client.$('div#strength.panel input');
    const acrylic5cutpowernumber = await acrylic5cutpower.getAttribute('value');
    expect(acrylic5cutpowernumber).toEqual('55');
    const acrylic5cutspeed= await app.client.$('div#speed.panel input');
    const acrylic5cutspeednumber = await acrylic5cutspeed.getAttribute('value');
    expect(acrylic5cutspeednumber).toEqual('5');
    const acrylic5cutrepeat= await app.client.$('div#repeat.panel.without-drag input');
    const acrylic5cutrepeatnumber = await acrylic5cutrepeat.getAttribute('value');
    expect(acrylic5cutrepeatnumber).toEqual('2');

    const acrylicEngraving = await app.client.$('option[value="壓克力 - 刻印"]');
    await acrylicEngraving.click();
    const acrylicEngravingpower= await app.client.$('div#strength.panel input');
    const acrylicEngravingpowernumber = await acrylicEngravingpower.getAttribute('value');
    expect(acrylicEngravingpowernumber).toEqual('25');
    const acrylicEngravingspeed= await app.client.$('div#speed.panel input');
    const acrylicEngravingspeednumber = await acrylicEngravingspeed.getAttribute('value');
    expect(acrylicEngravingspeednumber).toEqual('150');
    const acrylicEngravingrepeat= await app.client.$('div#repeat.panel.without-drag input');
    const acrylicEngravingrepeatnumber = await acrylicEngravingrepeat.getAttribute('value');
    expect(acrylicEngravingrepeatnumber).toEqual('1');

    /* Leather */
    const leather3cut = await app.client.$('option[value="皮革 - 3mm 切割"]');
    await leather3cut.click();
    const leather3cutpower= await app.client.$('div#strength.panel input');
    const leather3cutpowernumber = await leather3cutpower.getAttribute('value');
    expect(leather3cutpowernumber).toEqual('60');
    const leather3cutspeed= await app.client.$('div#speed.panel input');
    const leather3cutspeednumber = await leather3cutspeed.getAttribute('value');
    expect(leather3cutspeednumber).toEqual('3');
    const leather3cutrepeat= await app.client.$('div#repeat.panel.without-drag input');
    const leather3cutrepeatnumber = await leather3cutrepeat.getAttribute('value');
    expect(leather3cutrepeatnumber).toEqual('1');

    const leather5cut = await app.client.$('option[value="皮革 - 5mm 切割"]');
    await leather5cut.click();
    const leather5cutpower= await app.client.$('div#strength.panel input');
    const leather5cutpowernumber = await leather5cutpower.getAttribute('value');
    expect(leather5cutpowernumber).toEqual('60');
    const leather5cutspeed= await app.client.$('div#speed.panel input');
    const leather5cutspeednumber = await leather5cutspeed.getAttribute('value');
    expect(leather5cutspeednumber).toEqual('3');
    const leather5cutrepeat= await app.client.$('div#repeat.panel.without-drag input');
    const leather5cutrepeatnumber = await leather5cutrepeat.getAttribute('value');
    expect(leather5cutrepeatnumber).toEqual('2');

    const leatherEngraving = await app.client.$('option[value="皮革 - 刻印"]');
    await leatherEngraving.click();
    const leatherEngravingpower= await app.client.$('div#strength.panel input');
    const leatherEngravingpowernumber = await leatherEngravingpower.getAttribute('value');
    expect(leatherEngravingpowernumber).toEqual('30');
    const leatherEngravingspeed= await app.client.$('div#speed.panel input');
    const leatherEngravingspeednumber = await leatherEngravingspeed.getAttribute('value');
    expect(leatherEngravingspeednumber).toEqual('150');
    const leatherEngravingrepeat= await app.client.$('div#repeat.panel.without-drag input');
    const leatherEngravingrepeatnumber = await leatherEngravingrepeat.getAttribute('value');
    expect(leatherEngravingrepeatnumber).toEqual('1');

    /* Fabric */
    const fabric3cut = await app.client.$('option[value="布料 - 3mm 切割"]');
    await fabric3cut.click();
    const fabric3cutpower= await app.client.$('div#strength.panel input');
    const fabric3cutpowernumber = await fabric3cutpower.getAttribute('value');
    expect(fabric3cutpowernumber).toEqual('50');
    const fabric3cutspeed= await app.client.$('div#speed.panel input');
    const fabric3cutspeednumber = await fabric3cutspeed.getAttribute('value');
    expect(fabric3cutspeednumber).toEqual('20');
    const fabric3cutrepeat= await app.client.$('div#repeat.panel.without-drag input');
    const fabric3cutrepeatnumber = await fabric3cutrepeat.getAttribute('value');
    expect(fabric3cutrepeatnumber).toEqual('1');

    const fabric5cut = await app.client.$('option[value="布料 - 5mm 切割"]');
    await fabric5cut.click();
    const fabric5cutpower= await app.client.$('div#strength.panel input');
    const fabric5cutpowernumber = await fabric5cutpower.getAttribute('value');
    expect(fabric5cutpowernumber).toEqual('50');
    const fabric5cutspeed= await app.client.$('div#speed.panel input');
    const fabric5cutspeednumber = await fabric5cutspeed.getAttribute('value');
    expect(fabric5cutspeednumber).toEqual('20');
    const fabric5cutrepeat= await app.client.$('div#repeat.panel.without-drag input');
    const fabric5cutrepeatnumber = await fabric5cutrepeat.getAttribute('value');
    expect(fabric5cutrepeatnumber).toEqual('1');

    const fabricEngraving = await app.client.$('option[value="布料 - 刻印"]');
    await fabricEngraving.click();
    const fabricEngravingpower= await app.client.$('div#strength.panel input');
    const fabricEngravingpowernumber = await fabricEngravingpower.getAttribute('value');
    expect(fabricEngravingpowernumber).toEqual('20');
    const fabricEngravingspeed= await app.client.$('div#speed.panel input');
    const fabricEngravingspeednumber = await fabricEngravingspeed.getAttribute('value');
    expect(fabricEngravingspeednumber).toEqual('150');
    const fabricEngravingrepeat= await app.client.$('div#repeat.panel.without-drag input');
    const fabricEngravingrepeatnumber = await fabricEngravingrepeat.getAttribute('value');
    expect(fabricEngravingrepeatnumber).toEqual('1');



    /* Rubber */
    const rubberEngraving = await app.client.$('option[value="印章墊 - 刻印"]');
    await rubberEngraving.click();
    const rubberEngravingpower= await app.client.$('div#strength.panel input');
    const rubberEngravingpowernumber = await rubberEngravingpower.getAttribute('value');
    expect(rubberEngravingpowernumber).toEqual('50');
    const rubberEngravingspeed= await app.client.$('div#speed.panel input');
    const rubberEngravingspeednumber = await rubberEngravingspeed.getAttribute('value');
    expect(rubberEngravingspeednumber).toEqual('140');
    const rubberEngravingrepeat= await app.client.$('div#repeat.panel.without-drag input');
    const rubberEngravingrepeatnumber = await rubberEngravingrepeat.getAttribute('value');
    expect(rubberEngravingrepeatnumber).toEqual('1');


    /* Glass */
    const glassEngraving = await app.client.$('option[value="玻璃 - 刻印"]');
    await glassEngraving.click();
    const glassEngravingpower= await app.client.$('div#strength.panel input');
    const glassEngravingpowernumber = await glassEngravingpower.getAttribute('value');
    expect(glassEngravingpowernumber).toEqual('35');
    const glassEngravingspeed= await app.client.$('div#speed.panel input');
    const glassEngravingspeednumber = await glassEngravingspeed.getAttribute('value');
    expect(glassEngravingspeednumber).toEqual('150');
    const glassEngravingrepeat= await app.client.$('div#repeat.panel.without-drag input');
    const glassEngravingrepeatnumber = await glassEngravingrepeat.getAttribute('value');
    expect(glassEngravingrepeatnumber).toEqual('1');


    /* Metal */
    const metalEngraving = await app.client.$('option[value="不鏽鋼噴劑 - 刻印"]');
    await metalEngraving.click();
    const metalEngravingpower= await app.client.$('div#strength.panel input');
    const metalEngravingpowernumber = await metalEngravingpower.getAttribute('value');
    expect(metalEngravingpowernumber).toEqual('50');
    const metalEngravingspeed= await app.client.$('div#speed.panel input');
    const metalEngravingspeednumber = await metalEngravingspeed.getAttribute('value');
    expect(metalEngravingspeednumber).toEqual('80');
    const metalEngravingrepeat= await app.client.$('div#repeat.panel.without-drag input');
    const metalEngravingrepeatnumber = await metalEngravingrepeat.getAttribute('value');
    expect(metalEngravingrepeatnumber).toEqual('1');

    const metalEngravingdiode = await app.client.$('option[value="不鏽鋼 - 刻印（二極體雷射）"]');
    await metalEngravingdiode.click();
    const metalEngravingpowerdiode= await app.client.$('div#strength.panel input');
    const metalEngravingpowernumberdiode = await metalEngravingpowerdiode.getAttribute('value');
    expect(metalEngravingpowernumberdiode).toEqual('100');
    const metalEngravingspeeddiode= await app.client.$('div#speed.panel input');
    const metalEngravingspeednumberdiode = await metalEngravingspeeddiode.getAttribute('value');
    expect(metalEngravingspeednumberdiode).toEqual('4');
    const metalEngravingrepeatdiode= await app.client.$('div#repeat.panel.without-drag input');
    const metalEngravingrepeatnumberdiode = await metalEngravingrepeatdiode.getAttribute('value');
    expect(metalEngravingrepeatnumberdiode).toEqual('1');
});