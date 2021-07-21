const { checkExist, callMenuEvent } = require('../../../util/utils');

test('Change Network', async function() {
    const { app } = require('../../../test');
    await checkExist('#svgcanvas',15000);
    await callMenuEvent({ id: 'NETWORK_TESTING' });

    const address = await app.client.$('div.right-part input');
    await address.click();
    await app.client.keys(['192.168.68.148']);

    const start = await app.client.$('button.btn.btn-default.pull-right.primary');
    await start.click();
    await checkExist('div.modal-alert.progress');
    await new Promise((r) => setTimeout(r, 32000));
    
    const caption = await app.client.$('h2.caption');
    expect(await caption.getText()).toEqual("Test Completed");
});
