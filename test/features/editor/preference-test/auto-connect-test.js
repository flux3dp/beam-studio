const { setAppPage } = require('../../../util/utils');

test('Check Preference Auto Connect One Machine ', async function() {
    const { app } = require('../../../test');
    await setAppPage('#initialize/connect/select-connection-type');

    const connectwifi = await app.client.$('#qa-connect-wifi');
    await connectwifi.click();

    const nextstep = await app.client.$('div.btn-page.primary');
    await nextstep.click();
    // await new Promise((r) => setTimeout(r, 15000));
    const input2 = await app.client.$('input.ip-input');
    await input2.setValue('192.168.68.102');

    const nextstepaftrightIP = await app.client.$('div.btn-page.next.primary');
    await nextstepaftrightIP.click();
    await new Promise((r) => setTimeout(r, 3000));

    const nextstepatocheck = await app.client.$('div.btn-page.next.primary');
    await nextstepatocheck.click();
    await new Promise((r) => setTimeout(r, 15000));

    const ipinfo = await app.client.$('div#qa-ip-test-info');
    const ip = await ipinfo.getText();
    expect(ip).toEqual("Checking IP availability... OK"); 

    const machineinfo = await app.client.$('div#qa-machine-test-info');
    const machine = await machineinfo.getText();
    expect(machine).toEqual("Checking Machine Connection... OK");

    const firmwareinfo = await app.client.$('div#qa-firmware-test-info');
    const firmware = await firmwareinfo.getText();
    expect(firmware).toEqual("Checking firmware version... 4.0");
    await new Promise((r) => setTimeout(r, 5000));

    const camerainfo = await app.client.$('div#qa-camera-test-info');
    const camera = await camerainfo.getText();
    expect(camera).toEqual("Checking camera availability... OK");
});
