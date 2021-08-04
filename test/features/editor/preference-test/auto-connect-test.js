const { setAppPage } = require('../../../util/utils');

test('Check Preference Auto Connect One Machine ', async function() {
    const { app } = require('../../../test');
    await setAppPage('#initialize/connect/select-connection-type');

    const connectwifi = await app.client.$('#qa-connect-wifi');
    await connectwifi.click();

    const nextstep = await app.client.$('div.btn-page.primary');
    await nextstep.click();
    await new Promise((r) => setTimeout(r, 15000));

    const nextstepaftrightIP = await app.client.$('div.btn-page.next.primary');
    await nextstepaftrightIP.click();
    await new Promise((r) => setTimeout(r, 3000));

    const input = await app.client.$('input.ip-input');
    // console.log(await input.getValue());
    expect(await input.getValue()).not.toEqual('');
});
