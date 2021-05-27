const { pause, checkExist, checkVisible, updateInput } = require('../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../util/actions');


test('Connect Etherent', async function() {
    const { app } = require('../../../test');


    await app.client.execute(() => {
        location.hash = '#initialize/connect/select-connection-type';
    });

    await new Promise((r) => setTimeout(r, 15000));

    const connectwifi = await app.client.$('#qa-connect-direct');
    await connectwifi.click();
    
    const nextstep = await app.client.$('div.btn-page.primary');
    await nextstep.click();
    
    const intput = await app.client.$('input.ip-input');
    await intput.setValue('192.154.16.112');
    const nextstepaftwrongIP = await app.client.$('div.btn-page.next.primary');
    await nextstepaftwrongIP.click();

    await new Promise((r) => setTimeout(r, 15000));

    const setip = await app.client.$('#qa-ip-test-info');
    const ipmessage = await setip.getText();
    expect(ipmessage).toEqual("Checking IP availability... IP unreachable"); 

    const intput2 = await app.client.$('input.ip-input');
    await intput2.setValue('192.168.16.117');

    const nextstepaftrightIP = await app.client.$('div.btn-page.next.primary');
    await nextstepaftrightIP.click();
    await new Promise((r) => setTimeout(r, 3000));

    const nextstepatocheck = await app.client.$('div.btn-page.next.primary');
    await nextstepatocheck.click();
    await new Promise((r) => setTimeout(r, 5000));

    const ipinfo = await app.client.$('#qa-ip-test-info');
    const ip = await ipinfo.getText();
    expect(ip).toEqual("Checking IP availability... OK"); 

    const machineinfo = await app.client.$('#qa-machine-test-info');
    const machine = await machineinfo.getText();
    expect(machine).toEqual("Checking Machine Connection... OK");

    const firmwareinfo = await app.client.$('#qa-firmware-test-info');
    const firmware = await firmwareinfo.getText();
    expect(firmware).toEqual("Checking firmware version... 3.4");

    const camerainfo = await app.client.$('#qa-camera-test-info');
    const camera = await camerainfo.getText();
    expect(camera).toEqual("Checking camera availability... OK");

    const nextstepatofinish = await app.client.$('div.btn-page.next.primary');
    await nextstepatofinish.click();

    await new Promise((r) => setTimeout(r, 6000));

});