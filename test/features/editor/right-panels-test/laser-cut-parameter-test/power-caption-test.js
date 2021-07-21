const { checkExist, setReload } = require('../../../../util/utils');

test('Change Power Caption', async function() {
    const { app } = require('../../../../test');
    await setReload();
    await checkExist('#svgcanvas',15000);

    const power = await app.client.$('input#power');
    await power.doubleClick();
    await app.client.keys(['Backspace', '7', '5', 'Enter',"NULL"]);

    const input = await app.client.$('input#power' );
    const strengthvalue =await input.getAttribute('value');
    expect(strengthvalue).toEqual('75');
    await new Promise((r) => setTimeout(r, 1000));

    const gobutton = await app.client.$('div.go-button-container');
    await gobutton.click(); 

    await new Promise((r) => setTimeout(r, 1000));
    await checkExist('#power-caption',15000);
});

test('Check Power Enter Text', async function() {
    const { app } = require('../../../../test');
    const modalinput = await app.client.$('#power-caption');
    await modalinput.addValue('NOTED');

    const next = await app.client.$('button.btn.btn-default.primary');
    await next.click(); 

    await checkExist('div.device-list');
    await new Promise((r) => setTimeout(r, 1000));
});
