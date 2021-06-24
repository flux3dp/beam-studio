const { pause, checkExist, checkVisible, updateInput } = require('../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../util/editor-utils');


test('Init Connect Machine', async function() {
    const { app } = require('../../test');
    await checkExist('.headline', 15000);

    const optionlang = await app.client.$('option[value="en"]');
    await optionlang.click();

    const next = await app.client.$('a.btn');
    await next.click();

    const skip = await app.client.$('div.skip');
    await skip.click();

    const connectwifi = await app.client.$('button#qa-connect-wifi.btn.btn-action');
    await connectwifi.click();
    

    const wifitip1 = await app.client.$('div#qa-collapse-wifi1.collapse-title');
    await wifitip1.click();

    const wifitip2 = await app.client.$('div#qa-collapse-wifi2.collapse-title');
    await wifitip2.click();
    
    // await new Promise((r) => setTimeout(r, 2000));
    
    const nextstep = await app.client.$('div.btn-page.primary');
    await nextstep.click();
    
    const inputwrongip = await app.client.$('input.ip-input');
    await inputwrongip.doubleClick();
    await app.client.keys(['Backspace', '1', '9', '2', '.', '1', '6', '8', '.', '1', '6', '.', '1', '2', '3', 'Enter',"NULL"]);
    await new Promise((r) => setTimeout(r, 5000));

    const nextstepaftwrongIP = await app.client.$('div#qa-ip-test-info');
    await nextstepaftwrongIP.getText();
    // expect(await nextstepaftwrongIP.getText()).toEqual('Checking IP availability... IP unreachable');
    nextstepaftwrongIP.waitForExist({ timeout: 8000 });
    expect(await nextstepaftwrongIP.getText()).toEqual('Checking IP availability... IP unreachable')
    
    const inputrightip = await app.client.$('input.ip-input');
    await inputrightip.doubleClick();
    await app.client.keys(['Backspace', '1', '9', '2', '.', '1', '6', '8', '.', '1', '6', '.', '1', '1', '7', 'Enter',"NULL"]);
    

    

    const nextstepaftrightIP = await app.client.$('div#qa-ip-test-info');
    await nextstepaftrightIP.getText();
    expect(await nextstepaftrightIP.getText()).toEqual(["Checking IP availability... OK", "Checking Machine Connection... OK", "Checking firmware version... 3.4", "Checking camera availability... OK"]);

    const nextstepatofinish = await app.client.$('div.btn-page.next.primary');
    await nextstepatofinish.click();

    await new Promise((r) => setTimeout(r, 10000));

});