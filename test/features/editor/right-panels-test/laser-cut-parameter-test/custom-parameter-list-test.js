const { checkExist } = require('../../../../util/utils');

test('Check Coustom Parameter', async function() {
    const { app } = require('../../../../test');
    
    await app.client.execute(() => {
        location.reload();
    });
    await checkExist('#svgcanvas',15000);

    const set = await app.client.$('div.right');
    await set.click(); 
    
    const add = await app.client.$('div#add_bar3');
    await add.click(); 

    const textinput = await app.client.$('input.text-input');
    await textinput.click();
    await app.client.keys(['T', 'E', 'S', 'T', 'C', 'U', 'S', 'T', 'O', 'M', 'Enter',"NULL"]);
    
    const powerinput = await app.client.$('input#laser_power');
    await powerinput.doubleClick();
    await app.client.keys(['Delete', '9', '5', 'Enter',"NULL"]);

    const speedinput = await app.client.$('input#laser_speed');
    await speedinput.doubleClick();
    await app.client.keys(['Delete','1', '5', '0', 'Enter',"NULL"]);

    const repeatinput = await app.client.$('input#laser_repeat');
    await repeatinput.doubleClick();
    await app.client.keys(['Delete','3', 'Enter',"NULL"]);

    const zStepinput = await app.client.$('input#laser_zStep');
    await zStepinput.doubleClick();
    await app.client.keys(['Delete','1', '0', 'Enter',"NULL"]);
    await new Promise((r) => setTimeout(r, 1000));


    const w5cut = await app.client.$('#wood_5mm_cutting');
    await w5cut.click(); 

    const rew5cut = await app.client.$('div#removeselect');
    await rew5cut.click();

    const a5cut = await app.client.$('#acrylic_5mm_cutting');
    await a5cut.click(); 

    const rea5cut = await app.client.$('div#removeselect');
    await rea5cut.click();

    const l5cut = await app.client.$('#leather_5mm_cutting');
    await l5cut.click();

    const rel5cut = await app.client.$('div#removeselect');
    await rel5cut.click();

    const f5cut = await app.client.$('#fabric_5mm_cutting');
    await f5cut.click();

    const ref5cut = await app.client.$('div#removeselect');
    await ref5cut.click();

    
    const save = await app.client.$('button.btn.btn-default.primary');
    await save.click();

    const wood5cut = await app.client.$('option[value="木板 - 5mm 切割"]');
    await wood5cut.isExisting()
    expect(await wood5cut.isExisting()).toEqual(false);

    const acrylic5cut = await app.client.$('option[value="壓克力 - 5mm 切割"]');
    await acrylic5cut.isExisting()
    expect(await acrylic5cut.isExisting()).toEqual(false);
    

    const leather5cut = await app.client.$('option[value="皮革 - 5mm 切割"]');
    await leather5cut.isExisting()
    expect(await leather5cut.isExisting()).toEqual(false);

    const fabric5cut = await app.client.$('option[value="布料 - 5mm 切割"]');
    await fabric5cut.isExisting()
    expect(await fabric5cut.isExisting()).toEqual(false);

    const custom = await app.client.$('option[value="TESTCUSTOM"]');
    await custom.isExisting()
    expect(await custom.isExisting()).toEqual(true);

    
});