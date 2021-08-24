const { checkExist, setReload } = require('../../../../util/utils');
const { mouseAction } = require('../../../../util/actions');

test('Check Move Object In Diffierent Layer', async function() {
    const { app } = require('../../../../test');
    await setReload();
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

    if(process.platform === 'darwin'){
        await app.client.keys(['Command', 'a', "NULL"]);
    } 
    else{
        await app.client.keys(['Control', 'a', "NULL"]);
    }

    const switchLayer2 = await app.client.$('div.tab.layers');
    await switchLayer2.click();

    const moveSelsect = await app.client.$('#selLayerNames');
    await moveSelsect.click();

    const moveobjtoLayer1 = await app.client.$('option[value="Layer 2"]');
    await moveobjtoLayer1.click();

    const moveNext = await app.client.$('button.btn.btn-default.primary');
    await moveNext.click();
    
    const rectLayer1 = await app.client.$('#svg_1');
    const rectColor1 = await rectLayer1.getAttribute('stroke');
    expect(rectColor1).toEqual("#3F51B5");

    const moveObjtolayer2 = await app.client.$('option[value="Layer 3"]');
    await moveObjtolayer2.click();

    const rectLayer2 = await app.client.$('#svg_1');
    const rectColor2 = await rectLayer2.getAttribute('stroke');
    expect(rectColor2).toEqual("#F44336");
});

test('Check Parameter Of Move Object In Diffierent Layer', async function() {
    const { app } = require('../../../../test');
    await setReload();
    await checkExist('#svgcanvas', 15000);

    const wood3cut = await app.client.$('option[value="Wood - 3mm Cutting"]');
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

    const addLayer2 = await app.client.$('div.add-layer-btn');
    await addLayer2.click();
    const acrylic3cut = await app.client.$('option[value="Acrylic - 3mm Cutting"]');
    await acrylic3cut.click();

    const addLayer3 = await app.client.$('div.add-layer-btn');
    await addLayer3.click();
    const leather3cut = await app.client.$('option[value="Leather - 3mm Cutting"]');
    await leather3cut.click();

    if(process.platform === 'darwin'){
        await app.client.keys(['Command', 'a', "NULL"]);
    } 
    else{
        await app.client.keys(['Control', 'a', "NULL"]);
    }

    const switchLayer2 = await app.client.$('div.tab.layers');
    await switchLayer2.click();

    const moveobjtolayer1 = await app.client.$('option[value="Layer 2"]');
    await moveobjtolayer1.click();

    const movenext = await app.client.$('button.btn.btn-default.primary');
    await movenext.click();

    if(process.platform === 'darwin'){
        await app.client.keys(['Command', 'a', "NULL"]);
    } 
    else{
        await app.client.keys(['Control', 'a', "NULL"]);
    }

    const switchLayer3 = await app.client.$('div.tab.layers');
    await switchLayer3.click();

    const acrylic3cutpower= await app.client.$('input#power');
    const acrylic3cutpowernumber = await acrylic3cutpower.getAttribute('value');
    expect(acrylic3cutpowernumber).toEqual('55');

    const acrylic3cutspeed= await app.client.$('input#speed');
    const acrylic3cutspeednumber = await acrylic3cutspeed.getAttribute('value');
    expect(acrylic3cutspeednumber).toEqual('4');

    const acrylic3cutrepeat= await app.client.$('input#repeat');
    const acrylic3cutrepeatnumber = await acrylic3cutrepeat.getAttribute('value');
    expect(acrylic3cutrepeatnumber).toEqual('1');

    if(process.platform === 'darwin'){
        await app.client.keys(['Command', 'a', "NULL"]);
    } 
    else{
        await app.client.keys(['Control', 'a', "NULL"]);
    }

    const switchLayer4 = await app.client.$('div.tab.layers');
    await switchLayer4.click();

    const moveobjtolayer2 = await app.client.$('option[value="Layer 3"]');
    await moveobjtolayer2.click();

    const movenext2 = await app.client.$('button.btn.btn-default.primary');
    await movenext2.click();

    if(process.platform === 'darwin'){
        await app.client.keys(['Command', 'a', "NULL"]);
    } 
    else{
        await app.client.keys(['Control', 'a', "NULL"]);
    }

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
