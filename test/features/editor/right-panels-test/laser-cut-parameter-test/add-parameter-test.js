const { pause, checkExist, checkVisible, updateInput } = require('../../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../../util/actions');

test('Add Parameter', async function() {
    const { app } = require('../../../../test');
    
    await app.client.execute(() => {
        location.reload();
    });
    await checkExist('#svgcanvas',15000);

    const set = await app.client.$('div.right');
    await set.click(); 
    
    const add = await app.client.$('#qa-bar-bar3');
    await add.click(); 

    const textinput = await app.client.$('div#addparameter input');
    await textinput.click();
    await app.client.keys(['T', 'E', 'S', 'T', 'A', 'D', 'D','Enter',"NULL"]);
    
    const powerinput = await app.client.$('div#qa-power-input.control input');
    await powerinput.doubleClick();
    await app.client.keys(['Delete', '9', '5', 'Enter',"NULL"]);

    const speedinput = await app.client.$('div#qa-speed-input.control input');
    await speedinput.doubleClick();
    await app.client.keys(['Delete','1', '5', '0', 'Enter',"NULL"]);

    const repeatinput = await app.client.$('div#qa-repeat-input.control input');
    await repeatinput.doubleClick();
    await app.client.keys(['Delete','3', 'Enter',"NULL"]);

    const zStepinput = await app.client.$('div#qa-zStep-input.control input');
    await zStepinput.doubleClick();
    await app.client.keys(['Delete','1', '0', 'Enter',"NULL"]);
    await new Promise((r) => setTimeout(r, 1000));

    
    const next = await app.client.$('button.btn.btn-default.primary');
    await next.click();


    const option = await app.client.$('option[value="TESTADD"]');
    await option.click();

    const powerenter= await app.client.$('div#strength.panel input');
    const powernumber = await powerenter.getAttribute('value');
    expect(powernumber).toEqual('95');
 

    const speedenter= await app.client.$('div#speed.panel input');
    const speednumber = await speedenter.getAttribute('value');
    expect(speednumber).toEqual('150');


    const repeatenter= await app.client.$('div#repeat.panel.without-drag input');
    const repeatnumber = await repeatenter.getAttribute('value');
    expect(repeatnumber).toEqual('3');


});