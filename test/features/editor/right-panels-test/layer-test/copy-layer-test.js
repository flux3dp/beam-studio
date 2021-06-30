const { checkExist, setReload } = require('../../../../util/utils');

test('Check Copy Layer', async function() {
    const { app } = require('../../../../test');
    await setReload();
    await checkExist('#svgcanvas', 15000);

    const rightclick = await app.client.$('[data-test-key="layer-0"]');
    await rightclick.click({ button: 2});

    const choosedupe = await app.client.$('div#dupelayer');
    await choosedupe.click();

    const checklayername = await app.client.$('[data-test-key="layer-1"]');
    await checklayername.getText();

    // console.log(await checklayername.getText('class'));
    expect(await checklayername.getText()).toEqual('預設圖層 copy');
});

test('Check Copy Layer Color', async function() {
    const { app } = require('../../../../test');
    await setReload();
    await checkExist('#svgcanvas', 15000);

    const rightclick = await app.client.$('[data-test-key="layer-0"]');
    await rightclick.click({ button: 2});

    const choosedupe = await app.client.$('div#dupelayer');
    await choosedupe.click();

    const checklayer0color = await app.client.$('div#layerbackgroundColor-0');
    await checklayer0color.getAttribute('style');

    const checklayer1color = await app.client.$('div#layerbackgroundColor-1');
    await checklayer1color.getAttribute('style');
    expect(await checklayer0color.getAttribute('style')).toEqual(await checklayer1color.getAttribute('style'));
});
