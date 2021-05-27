const { pause, checkExist, checkVisible, updateInput } = require('../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../util/editor-utils');


test('Connect Machine', async function() {
    const { app } = require('../../test');
    await checkExist('.headline', 15000);

    const optionlang = await app.client.$('option[value="zh-tw"]');
    await optionlang.click();
    
    const next = await app.client.$('a.btn');
    await next.click();

    const connectwifi = await app.client.$('button#qa-connect-wifi.button.btn.btn-action');
    await connectwifi.click();
    await new Promise((r) => setTimeout(r, 1000));

    const wifitip1 = await app.client.$('div#qa-collapse-wifi1.collapse-title');
    await wifitip1.click();

    await new Promise((r) => setTimeout(r, 2000));

    const wifitip2 = await app.client.$('div#qa-collapse-wifi2.collapse-title');
    await wifitip2.click();
    
    await new Promise((r) => setTimeout(r, 2000));
    
    const nextstep = await app.client.$('div.btn-page.primary');
    await nextstep.click();
    
    updateInput('input.ip-input', '192.154.16.112');
    const nextstepaftwrongIP = await app.client.$('div.btn-page.next.primary');
    await nextstepaftwrongIP.click();
    await new Promise((r) => setTimeout(r, 3000));

    updateInput('input.ip-input', '192.168.16.117');
    const nextstepaftrightIP = await app.client.$('div.btn-page.next.primary');
    await nextstepaftrightIP.click();
    await new Promise((r) => setTimeout(r, 3000));

    const nextstepatocheck = await app.client.$('div.btn-page.next.primary');
    await nextstepatocheck.click();
    await new Promise((r) => setTimeout(r, 3000));

    const time = await app.client.$('div.test-info');
    const setFinishText = await time.getText();

    expect(setFinishText).toEqual(["Checking IP availability... OK", "Checking Machine Connection... OK", "Checking firmware version... 3.4", "Checking camera availability... OK"]); 

    const nextstepatofinish = await app.client.$('div.btn-page.next.primary');
    await nextstepatofinish.click();

    await new Promise((r) => setTimeout(r, 5000));

});