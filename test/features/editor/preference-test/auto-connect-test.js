const { checkExist, setAppPage } = require('../../../util/utils');

test('Check Preference Auto Connect One Machine ', async function() {
    const { app } = require('../../../test');
    await setAppPage('#initialize/connect/select-connection-type');

    const connectwifi = await app.client.$('#qa-connect-wifi');
    await connectwifi.click();
    
    const nextstep = await app.client.$('div.btn-page.primary');
    await nextstep.click();
    await new Promise((r) => setTimeout(r, 5000));

    const input2 = await app.client.$('input.ip-input');
    await input2.click();
    // await input2.setValue('192.168.68.148');
    await new Promise((r) => setTimeout(r, 5000));

    const nextstepaftrightIP = await app.client.$('div.btn-page.next.primary');
    await nextstepaftrightIP.click();
    await new Promise((r) => setTimeout(r, 3000));

    const nextstepatocheck = await app.client.$('div.btn-page.next.primary');
    await nextstepatocheck.click();
    await new Promise((r) => setTimeout(r, 15000));

    const nextstepatofinish = await app.client.$('div.btn-page.next.primary');
    await nextstepatofinish.click();

    await checkExist('#svgcanvas', 15000);
});
