const { checkExist, setReload } = require('../../../../util/utils');

test('Check Add Parameter', async function() {
    const { app } = require('../../../../test');
    await setReload();
    await checkExist('#svgcanvas',15000);

    const set = await app.client.$('div.right');
    await set.click(); 
    
    const add = await app.client.$('div#add_bar3');
    await add.click(); 

    const textinput = await app.client.$('input.text-input');
    await textinput.click();
    await app.client.keys(['T', 'E', 'S', 'T', 'A', 'D', 'D', 'P', 'A', 'R', 'A', 'M', 'E', 'T', 'E', 'R','Enter',"NULL"]);

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
    
    const next = await app.client.$('button.btn.btn-default.primary');
    await next.click();

    const option = await app.client.$('option[value="TESTADDPARAMETER"]');
    await option.click();

    const powerenter= await app.client.$('input#power');
    const powernumber = await powerenter.getAttribute('value');
    expect(powernumber).toEqual('95');
 
    const speedenter= await app.client.$('input#speed');
    const speednumber = await speedenter.getAttribute('value');
    expect(speednumber).toEqual('150');

    const repeatenter= await app.client.$('input#repeat');
    const repeatnumber = await repeatenter.getAttribute('value');
    expect(repeatnumber).toEqual('3');
});
