const { checkExist, setAppPage } = require('../../../util/utils');
const { mouseAction } = require('../../../util/actions');
const { dialog } = require('electron');

test('Check Preference All Reset', async function() {
    const { app } = require('../../../test');
    await setAppPage('#studio/settings');
    const reset = await app.client.$('div.font5');
    await reset.click();
    await mouseAction([
        { type: 'pointerMove', x: 400, y: 400, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerUp', button: 0, },
    ]);
    await app.client.keys(['Enter', "NULL"]);
    await checkExist('h1.headline');
});