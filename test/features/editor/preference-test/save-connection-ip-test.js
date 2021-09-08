const { checkExist, setAppPage } = require('../../../util/utils');

test('Check Preference Save Connection IP', async function() {
    const { app } = require('../../../test');
    await setAppPage('#studio/settings');
    
    const connectioncheck= await app.client.$('input#ip-input');
    const connectioncheck2 = await connectioncheck.getAttribute('value');  
    const ip = '192.168.68.102';
    connectioncheck2.includes(ip);
    const done2 = await app.client.$('div.btn.btn-done');
    await done2.click();

    await checkExist('#svgcanvas',15000);
});
