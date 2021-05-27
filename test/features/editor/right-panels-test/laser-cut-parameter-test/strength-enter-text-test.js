const { pause, checkExist, checkVisible, updateInput } = require('../../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../../util/actions');

test('Strength Enter Text', async function() {
    const { app } = require('../../../../test');
    
    await app.client.execute(() => {
        location.reload();
    });
    await checkExist('#svgcanvas',15000);
    const power = await app.client.$('div#strength.panel input');
    await power.doubleClick();
    await app.client.keys(['Backspace', '7', '5', 'Enter',"NULL"]);

    const input = await app.client.$('div#strength.panel input' );
    const strengthvalue =await input.getAttribute('value');
    expect(strengthvalue).toEqual('75');
    await new Promise((r) => setTimeout(r, 1000));

    const gobutton = await app.client.$('div.go-button-container');
    await gobutton.click(); 

    const modalinput = await app.client.$('#qa-power-caption input');
    await modalinput.addValue('知道了');

    const next = await app.client.$('button.btn.btn-default.primary');
    await next.click(); 

    await checkExist('div.flux-monitor');
    await new Promise((r) => setTimeout(r, 1000));

});