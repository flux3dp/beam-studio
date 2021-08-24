const { checkExist } = require('../../util/utils');

test('Init Connect Machine', async function() {
    const { app } = require('../../test');
    await checkExist('.headline', 15000);

    const optionlang = await app.client.$('option[value="en"]');
    await optionlang.click();

    const next = await app.client.$('a.btn');
    await next.click();

    const skip = await app.client.$('div.skip');
    await skip.click();

    const connectwifi = await app.client.$('#connect-wifi');
    await connectwifi.click();

    const wifitip1 = await app.client.$('div#collapse-wifi1.collapse-title');
    await wifitip1.click();
    await new Promise((r) => setTimeout(r, 500));

    const wifitip2 = await app.client.$('div#collapse-wifi2.collapse-title');
    await wifitip2.click();
    await new Promise((r) => setTimeout(r, 500));

    const nextstep = await app.client.$('div.btn-page.primary');
    await nextstep.click();
    
    const input = await app.client.$('input.ip-input');
    await input.setValue('192.154.16.112');
    const nextstepaftwrongIP = await app.client.$('div.btn-page.next.primary');
    await nextstepaftwrongIP.click();
    await new Promise((r) => setTimeout(r, 15000));

    const setip = await app.client.$('div#ip-test-info');
    const ipmessage = await setip.getText();
    await new Promise((r) => setTimeout(r, 5000));
    expect(ipmessage).toEqual("Checking IP availability... IP unreachable"); 

    const input2 = await app.client.$('input.ip-input');
    await input2.setValue('192.168.68.102');

    const nextstepaftrightIP = await app.client.$('div.btn-page.next.primary');
    await nextstepaftrightIP.click();
    await new Promise((r) => setTimeout(r, 3000));

    const nextstepatocheck = await app.client.$('div.btn-page.next.primary');
    await nextstepatocheck.click();
    await new Promise((r) => setTimeout(r, 15000));

    const ipinfo = await app.client.$('div#ip-test-info');
    const ip = await ipinfo.getText();
    expect(ip).toEqual("Checking IP availability... OK"); 

    const machineinfo = await app.client.$('div#machine-test-info');
    const machine = await machineinfo.getText();
    expect(machine).toEqual("Checking Machine Connection... OK");

    const firmwareinfo = await app.client.$('div#firmware-test-info');
    const firmware = await firmwareinfo.getText();
    expect(firmware).toEqual("Checking firmware version... 4.0");
    await new Promise((r) => setTimeout(r, 5000));

    const camerainfo = await app.client.$('div#camera-test-info');
    const camera = await camerainfo.getText();
    expect(camera).toEqual("Checking camera availability... OK");

});