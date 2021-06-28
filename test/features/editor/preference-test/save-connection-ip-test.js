const { checkExist, setAppPage } = require('../../../util/utils');

test('Check Preference Save Connection IP', async function() {
    const { app } = require('../../../test');
    

    await setAppPage('#studio/settings');

    const selectconnection = await app.client.$('input#qa-settings-ip');
    await selectconnection.doubleClick();
    await app.client.keys(['Delete',  "NULL"]);

    // await new Promise((r) => setTimeout(r, 1000));

    const done = await app.client.$('div.btn.btn-done');
    await done.click();
    await checkExist('#svgcanvas',15000);


    await setAppPage('#initialize/connect/select-connection-type');

    const connectwifi = await app.client.$('#qa-connect-wifi');
    await connectwifi.click();

    const nextstep = await app.client.$('div.btn-page.primary');
    await nextstep.click();

    const input2 = await app.client.$('input.ip-input');
    // await input2.duebleClick();
    await app.client.keys(['Delete',  "NULL"]);
    await input2.setValue('192.168.68.145');
    const nextstepatocheck = await app.client.$('div.btn-page.next.primary');
    await nextstepatocheck.click();
    await new Promise((r) => setTimeout(r, 5000));

    const nextstepaftrightIP = await app.client.$('div.btn-page.next.primary');
    await nextstepaftrightIP.click();
    await new Promise((r) => setTimeout(r, 5000));

    const nextstepatofinish = await app.client.$('div.btn-page.next.primary');
    await nextstepatofinish.click();

    await checkExist('#svgcanvas',15000);


    await setAppPage('#studio/settings');

    const connectioncheck= await app.client.$('input#qa-settings-ip');
    const connectioncheck2 = await connectioncheck.getAttribute('value');  
    // expect(connectioncheck2).toEqual('192.168.1.1, , , , 192.168.68.148, 192.168.68.111, 192.168.68.161, 192.168.68.113, 192.168.68.158, 192.168.68.149');
    expect([connectioncheck2].some(isEqual('192.168.68.145'))).toBeTrue();
    const done2 = await app.client.$('div.btn.btn-done');
    await done2.click();

    await checkExist('#svgcanvas',15000);


});