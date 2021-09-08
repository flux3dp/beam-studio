const { setAppPage, checkExist } = require('../../../util/utils');

test('Check Connect Wifi', async function() {
    const { app } = require('../../../test');
    await setAppPage('#initialize/connect/select-connection-type');

    const connectWifi = await app.client.$('#connect-wifi');
    await connectWifi.click();

    const wifiTip1 = await app.client.$('div#collapse-wifi1.collapse-title');
    await wifiTip1.click();
    await new Promise((r) => setTimeout(r, 500));

    const wifiTip2 = await app.client.$('div#collapse-wifi2.collapse-title');
    await wifiTip2.click();
    await new Promise((r) => setTimeout(r, 500));

    const nextStep = await app.client.$('div.btn-page.primary');
    await nextStep.click();
    
    const inputWrongip = await app.client.$('input.ip-input');
    await inputWrongip.setValue('192.154.16.112');//set wrong ip
    const nextWrongip = await app.client.$('div.btn-page.next.primary');
    await nextWrongip.click();
    await new Promise((r) => setTimeout(r, 15000));

    const wrongIp = await app.client.$('div.test-infos');
    const ipMessage = await wrongIp.getText();
    await new Promise((r) => setTimeout(r, 5000));
    expect(ipMessage).toEqual("Checking IP availability... IP unreachable"); 

    const inputRightip = await app.client.$('input.ip-input');
    await inputRightip.setValue('192.168.1.123');//set right ip 

    const nextRightip = await app.client.$('div.btn-page.next.primary');
    await nextRightip.click();
    await checkExist('#ip-test-info',5000);

    const ipInfo = await app.client.$('div#ip-test-info');
    const ip = await ipInfo.getText();
    await new Promise((r) => setTimeout(r, 5000));
    expect(ip).toEqual("Checking IP availability... OK"); 

    const machineInfo = await app.client.$('div#machine-test-info');
    const machine = await machineInfo.getText();
    await new Promise((r) => setTimeout(r, 2000));
    expect(machine).toEqual("Checking Machine Connection... OK");

    const firmwareInfo = await app.client.$('div#firmware-test-info');
    const firmware = await firmwareInfo.getText();
    await new Promise((r) => setTimeout(r, 2000));
    expect(firmware).toEqual("Checking firmware version... 3.5.1");


    const cameraInfo = await app.client.$('div#camera-test-info');
    await new Promise((r) => setTimeout(r, 5000));
    const camera = await cameraInfo.getText();
    expect(camera).toEqual("Checking camera availability... OK");

    const finishSetting = await app.client.$('div.btn-page.next.primary');
    await finishSetting.click();

    await checkExist('#svgcanvas',15000);
});

test('Check Connect Wired', async function() {
    const { app } = require('../../../test');
    await setAppPage('#initialize/connect/select-connection-type');

    const connectWired = await app.client.$('#connect-wired');
    await connectWired.click();

    const wiredTip1 = await app.client.$('div#collapse-wired1.collapse-title');
    await wiredTip1.click();
    await new Promise((r) => setTimeout(r, 500));

    const wiredTip2 = await app.client.$('div#collapse-wired2.collapse-title');
    await wiredTip2.click();
    await new Promise((r) => setTimeout(r, 500));

    const nextStep = await app.client.$('div.btn-page.primary');
    await nextStep.click();
    
    const inputWrongip = await app.client.$('input.ip-input');
    await inputWrongip.setValue('192.169');//set wrong ip
    const nextWrongip = await app.client.$('div.btn-page.next.primary');
    await nextWrongip.click();
    await new Promise((r) => setTimeout(r, 5000));

    const wrongIp = await app.client.$('div.test-infos');
    const ipMessage = await wrongIp.getText();
    await new Promise((r) => setTimeout(r, 2000));
    expect(ipMessage).toEqual("Checking IP availability... IP Invalid: Invalid format"); 

    const inputRightip = await app.client.$('input.ip-input');
    await inputRightip.setValue('192.168.1.123');//set right ip 

    const nextRightip = await app.client.$('div.btn-page.next.primary');
    await nextRightip.click();
    await checkExist('#ip-test-info',15000);

    const ipInfo = await app.client.$('div#ip-test-info');
    const ip = await ipInfo.getText();
    await new Promise((r) => setTimeout(r, 5000));
    expect(ip).toEqual("Checking IP availability... OK"); 

    const machineInfo = await app.client.$('div#machine-test-info');
    const machine = await machineInfo.getText();
    await new Promise((r) => setTimeout(r, 2000));
    expect(machine).toEqual("Checking Machine Connection... OK");

    const firmwareInfo = await app.client.$('div#firmware-test-info');
    const firmware = await firmwareInfo.getText();
    await new Promise((r) => setTimeout(r, 2000));
    expect(firmware).toEqual("Checking firmware version... 3.5.1");

    const cameraInfo = await app.client.$('div#camera-test-info');
    await new Promise((r) => setTimeout(r, 5000));
    const camera = await cameraInfo.getText();
    expect(camera).toEqual("Checking camera availability... OK");

    const finishSetting = await app.client.$('div.btn-page.next.primary');
    await finishSetting.click();

    await checkExist('#svgcanvas',15000);
});

test('Check Connect Etherent', async function() {
    const { app } = require('../../../test');
    await setAppPage('#initialize/connect/select-connection-type');

    const connectEtherent = await app.client.$('#connect-ether2ether');
    await connectEtherent.click();

    const nextStep = await app.client.$('div.btn-page.primary');
    await nextStep.click();
    
    const inputWrongip = await app.client.$('input.ip-input');
    await inputWrongip.setValue('169.254.1.1');//set wrong ip
    const nextWrongip = await app.client.$('div.btn-page.next.primary');
    await nextWrongip.click();
    await new Promise((r) => setTimeout(r, 5000));

    const wrongIp = await app.client.$('div.test-infos');
    const ipMessage = await wrongIp.getText();
    await new Promise((r) => setTimeout(r, 5000));
    expect(ipMessage).toEqual("Checking IP availability... IP Invalid: Starts with 169.254"); 

    const inputRightip = await app.client.$('input.ip-input');
    await inputRightip.setValue('192.168.1.123');//set right ip 

    const nextRightip = await app.client.$('div.btn-page.next.primary');
    await nextRightip.click();
    await checkExist('#ip-test-info',15000);

    const ipInfo = await app.client.$('div#ip-test-info');
    const ip = await ipInfo.getText();
    await new Promise((r) => setTimeout(r, 5000));
    expect(ip).toEqual("Checking IP availability... OK"); 

    const machineInfo = await app.client.$('div#machine-test-info');
    const machine = await machineInfo.getText();
    await new Promise((r) => setTimeout(r, 2000));
    expect(machine).toEqual("Checking Machine Connection... OK");

    const firmwareInfo = await app.client.$('div#firmware-test-info');
    const firmware = await firmwareInfo.getText();
    await new Promise((r) => setTimeout(r, 2000));
    expect(firmware).toEqual("Checking firmware version... 3.5.1");


    const cameraInfo = await app.client.$('div#camera-test-info');
    await new Promise((r) => setTimeout(r, 5000));
    const camera = await cameraInfo.getText();
    expect(camera).toEqual("Checking camera availability... OK");

    const finishSetting = await app.client.$('div.btn-page.next.primary');
    await finishSetting.click();

    await checkExist('#svgcanvas',15000);
});
