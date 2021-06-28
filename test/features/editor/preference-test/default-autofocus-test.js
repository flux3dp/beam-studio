const { checkExist, setAppPage } = require('../../../util/utils');

test('Check Preference Autofocus Default', async function() {
    const { app } = require('../../../test');
    
    await checkExist('#svgcanvas',15000);

    await setAppPage('#studio/settings');
    const autofocus = await app.client.$('select#default-autofocus option[value="TRUE"]');
    await autofocus.click();

    const autofocuscheck= await app.client.$('select#default-autofocus');
    const autofocuscheck2 = await autofocuscheck.getAttribute('value');
    expect(autofocuscheck2).toEqual('TRUE');

    const done = await app.client.$('div.btn.btn-done');
    await done.click();
    
    await checkExist('#svgcanvas',15000);
});