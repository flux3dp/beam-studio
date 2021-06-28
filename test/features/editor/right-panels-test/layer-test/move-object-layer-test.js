const { checkExist } = require('../../../../util/utils');
const { mouseAction } = require('../../../../util/actions');

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


test('Check Parameter Of Move Object In Diffierent Layer', async function() {
    const { app } = require('../../../../test');
    
    await app.client.execute(() => {
        location.reload();
    });
    await checkExist('#svgcanvas', 15000);
    const wood3cut = await app.client.$('option[value="木板 - 3mm 切割"]');
    await wood3cut.click();
    
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
    const acrylic3cut = await app.client.$('option[value="壓克力 - 3mm 切割"]');
    await acrylic3cut.click();


    const add2 = await app.client.$('div.add-layer-btn');
    await add2.click();
    const leather3cut = await app.client.$('option[value="皮革 - 3mm 切割"]');
    await leather3cut.click();


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
    await mouseAction([
        { type: 'pointerMove', x: 290, y: 290, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 410, y: 410, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);

    const switchlayer3 = await app.client.$('div.tab.layers');
    await switchlayer3.click();

    const acrylic3cutpower= await app.client.$('input#power');
    const acrylic3cutpowernumber = await acrylic3cutpower.getAttribute('value');
    expect(acrylic3cutpowernumber).toEqual('55');
    const acrylic3cutspeed= await app.client.$('input#speed');
    const acrylic3cutspeednumber = await acrylic3cutspeed.getAttribute('value');
    expect(acrylic3cutspeednumber).toEqual('4');
    const acrylic3cutrepeat= await app.client.$('input#repeat');
    const acrylic3cutrepeatnumber = await acrylic3cutrepeat.getAttribute('value');
    expect(acrylic3cutrepeatnumber).toEqual('1');

    await mouseAction([
        { type: 'pointerMove', x: 290, y: 290, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 410, y: 410, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);

    const switchlayer4 = await app.client.$('div.tab.layers');
    await switchlayer4.click();

    const moveobjtolayer2 = await app.client.$('option[value="圖層 2"]');
    await moveobjtolayer2.click();

    const movenext2 = await app.client.$('button.btn.btn-default.primary');
    await movenext2.click();

    await mouseAction([
        { type: 'pointerMove', x: 290, y: 290, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 410, y: 410, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);

    const switchlayer5 = await app.client.$('div.tab.layers');
    await switchlayer5.click();


    const leather3cutpower= await app.client.$('input#power');
    const leather3cutpowernumber = await leather3cutpower.getAttribute('value');
    expect(leather3cutpowernumber).toEqual('60');
    const leather3cutspeed= await app.client.$('input#speed');
    const leather3cutspeednumber = await leather3cutspeed.getAttribute('value');
    expect(leather3cutspeednumber).toEqual('3');
    const leather3cutrepeat= await app.client.$('input#repeat');
    const leather3cutrepeatnumber = await leather3cutrepeat.getAttribute('value');
    expect(leather3cutrepeatnumber).toEqual('1');

    
});