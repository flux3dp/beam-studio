const { pause, checkExist, checkVisible, updateInput } = require('../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../util/actions');



test('Check Preference Auto Connect One Machine ', async function() {
    const { app } = require('../../../test');

    await app.client.execute(() => {
        location.hash = '#studio/settings';
    });

    const selectnoti = await app.client.$('select#qa-set-auto-connect option[value="1"]');
    await selectnoti.click();
    const noticheck= await app.client.$('select#qa-set-auto-connect');
    const noticheck2 = await noticheck.getAttribute('value');
    expect(noticheck2).toEqual('1');

    const done = await app.client.$('a.btn.btn-done');
    await done.click();

    await checkExist('#svgcanvas',15000);

    await app.client.execute(() => {
        location.hash = '#initialize/connect/select-connection-type';
    });

    const connectwifi = await app.client.$('#qa-connect-wifi');
    await connectwifi.click();

    const wifitip1 = await app.client.$('div#qa-collapse-wifi1.collapse-title');
    await wifitip1.click();

    await new Promise((r) => setTimeout(r, 500));

    const wifitip2 = await app.client.$('div#qa-collapse-wifi2.collapse-title');
    await wifitip2.click();
    
    await new Promise((r) => setTimeout(r, 500));
    
    const nextstep = await app.client.$('div.btn-page.primary');
    await nextstep.click();
    
    const intput = await app.client.$('input.ip-input');
    await intput.setValue('192.154.16.112');
    const nextstepaftwrongIP = await app.client.$('div.btn-page.next.primary');
    await nextstepaftwrongIP.click();

    await new Promise((r) => setTimeout(r, 15000));

    const setip = await app.client.$('div#qa-ip-test-info');
    const ipmessage = await setip.getText();
    expect(ipmessage).toEqual("Checking IP availability... IP unreachable"); 

    const intput2 = await app.client.$('input.ip-input');
    await intput2.setValue('192.168.16.117');

    const nextstepaftrightIP = await app.client.$('div.btn-page.next.primary');
    await nextstepaftrightIP.click();
    await new Promise((r) => setTimeout(r, 3000));

    const nextstepatocheck = await app.client.$('div.btn-page.next.primary');
    await nextstepatocheck.click();
    await new Promise((r) => setTimeout(r, 3000));

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