const { checkExist, setReload } = require('../../../../util/utils');

test('Check Reset Parameter', async function() {
    const { app } = require('../../../../test');
    await setReload();
    await checkExist('#svgcanvas',15000);

    const set = await app.client.$('div.right');
    await set.click(); 
    
    const add = await app.client.$('div#add_bar3');
    await add.click(); 

    const textinput = await app.client.$('input.text-input');
    await textinput.click();
    await app.client.keys(['T', 'E', 'S', 'T', 'R', 'E', 'S', 'E', 'T','Enter',"NULL"]);
    
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

    const w3cut = await app.client.$('#wood_3mm_cutting');
    await w3cut.click(); 

    const rew3cut = await app.client.$('div#removeselect');
    await rew3cut.click();

    const re1 = await app.client.$('div#removeselect');
    await re1.click();

    const re2 = await app.client.$('div#removeselect');
    await re2.click();

    const re3 = await app.client.$('div#removeselect');
    await re3.click();

    const re4 = await app.client.$('div#removeselect');
    await re4.click();

    const re5 = await app.client.$('div#removeselect');
    await re5.click();

    const re6 = await app.client.$('div#removeselect');
    await re6.click();

    const re7 = await app.client.$('div#removeselect');
    await re7.click();

    const re8 = await app.client.$('div#removeselect');
    await re8.click();

    const re9 = await app.client.$('div#removeselect');
    await re9.click();

    const re10 = await app.client.$('div#removeselect');
    await re10.click();

    const re11 = await app.client.$('div#removeselect');
    await re11.click();

    const re12 = await app.client.$('div#removeselect');
    await re12.click();

    const re13 = await app.client.$('div#removeselect');
    await re13.click();

    const re14 = await app.client.$('div#removeselect');
    await re14.click();

    const re15 = await app.client.$('div#removeselect');
    await re15.click();

    const save = await app.client.$('button.btn.btn-default.primary');
    await save.click();

    const wood3cut = await app.client.$('option[value="Wood - 3mm Cutting"]');
    await wood3cut.isExisting()
    expect(await wood3cut.isExisting()).toEqual(false);

    const acrylic3cut = await app.client.$('option[value="Acrylic - 3mm Cutting"]');
    await acrylic3cut.isExisting()
    expect(await acrylic3cut.isExisting()).toEqual(false);
    
    const leather3cut = await app.client.$('option[value="Leather - 3mm Cutting"]');
    await leather3cut.isExisting()
    expect(await leather3cut.isExisting()).toEqual(false);

    const fabric3cut = await app.client.$('option[value="Fabric - 3mm Cutting"]');
    await fabric3cut.isExisting()
    expect(await fabric3cut.isExisting()).toEqual(false);

    const custom = await app.client.$('option[value="TESTRESET"]');
    await custom.isExisting()
    expect(await custom.isExisting()).toEqual(true);

    const set2 = await app.client.$('div.right');
    await set2.click();

    const reset = await app.client.$('button#laser_reset');
    await reset.click();
    await new Promise((r) => setTimeout(r, 1000));

    const checkreset = await app.client.$('[data-test-key="yes"]');
    await checkreset.click();
    await new Promise((r) => setTimeout(r, 1000));

    const savereset = await app.client.$('button#laser_save_and_exit');
    await savereset.click();
    await new Promise((r) => setTimeout(r, 1000));

    const rewood3cut = await app.client.$('option[value="Wood - 3mm Cutting"]')
    await rewood3cut.isExisting()
    expect(await rewood3cut.isExisting()).toEqual(true); 
    
    const reacrylic3cut = await app.client.$('option[value="Acrylic - 3mm Cutting"]')
    await reacrylic3cut.isExisting()
    expect(await reacrylic3cut.isExisting()).toEqual(true);

    const releather3cut = await app.client.$('option[value="Leather - 3mm Cutting"]')
    await releather3cut.isExisting()
    expect(await releather3cut.isExisting()).toEqual(true);

    const refabric3cut = await app.client.$('option[value="Fabric - 3mm Cutting"]')
    await refabric3cut.isExisting()
    expect(await refabric3cut.isExisting()).toEqual(true);
    
    const custom2 = await app.client.$('option[value="TESTRESET"]');
    await custom2.isExisting()
    expect(await custom2.isExisting()).toEqual(true);
});
