const { checkExist, setAppPage, setReload} = require('../../../util/utils');
const { mouseAction } = require('../../../util/actions');

test('Check Preference Substitute Unsupported Characters', async function() {
    const { app } = require('../../../test');
    await setReload();
    await checkExist('#svgcanvas',15000);

    const text = await app.client.$('#left-Text');
    await text.click();
    await mouseAction([
        { type: 'pointerMove', x: 300, y: 300, duration: 10, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerUp', button: 0, },
    ]);
    await app.client.keys(['T', 'E', 'S', 'T', 'F', 'O', 'N', 'T', 'S', 'U', 'B', 'S', 'T', 'I', 'T', 'U', 'T', 'E',"NULL"]);

    await setAppPage('#studio/settings');    
    const units = await app.client.$('select#font-substitue option[value="FALSE"]');
    await units.click();

    const unitscheck= await app.client.$('select#font-substitue');
    const unitscheck2 = await unitscheck.getAttribute('value');
    expect(unitscheck2).toEqual('FALSE');

    const done = await app.client.$('div.btn.btn-done');
    await done.click();

    await checkExist('#svgcanvas',15000);

    const text2 = await app.client.$('#left-Text');
    await text2.click();
  
    await mouseAction([
        { type: 'pointerMove', x: 300, y: 300, duration: 10, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerUp', button: 0, },
    ]);
    await app.client.keys(['T', 'E', 'S', 'T', 'F', 'O', 'N', 'T', 'S', 'U', 'B', 'S', 'T', 'I', 'T', 'U', 'T', 'E',"NULL"]);

    const optionfont = await app.client.$('option[value="標楷體"]');
    await optionfont.click();

    const gobutton2 = await app.client.$('div.go-button-container');
    await gobutton2.click(); 

    const beamo = await app.client.$('[data-test-key="FLPUAG5YEG"]');
    await beamo.click();
});
