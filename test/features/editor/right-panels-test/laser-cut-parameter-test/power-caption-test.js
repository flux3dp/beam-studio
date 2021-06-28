const { checkExist } = require('../../../../util/utils');

test('Change Power Caption', async function() {
    const { app } = require('../../../../test');
    
    await app.client.execute(() => {
        location.reload();
    });
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
    await checkExist('div#qa-power-caption',15000);

    const next = await app.client.$('button.btn.btn-default.primary');
    await next.click();    

});