const { checkExist, setAppPage, setReload } = require('../../../util/utils');
const { mouseAction } = require('../../../util/actions');

test('Check Preference Loop Compensation', async function() {
    const { app } = require('../../../test');
    await setReload();
    const poly = await app.client.$('#left-Polygon');
    await poly.click();

    await mouseAction([
        { type: 'pointerMove', x: 500, y: 500, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 600, y: 600, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    await checkExist('#svg_1');

    const time = await app.client.$('div.time-est-btn');
    await time.click();

    const timeresult = await app.client.$('div.time-est-result');
    await timeresult.getText();
    expect(await timeresult.getText()).toEqual('Estimated Time: 21 s');

    await setAppPage('#studio/settings'); 

    const selectloop = await app.client.$('input#qa-set-loop-compensation');
    await selectloop.doubleClick();
    await app.client.keys(['Delete', '10', 'Enter', "NULL"]);

    const loopcheck= await app.client.$('input#qa-set-loop-compensation');
    const loopcheck2 = await loopcheck.getAttribute('value');
    expect(loopcheck2).toEqual('10');

    const done = await app.client.$('div.btn.btn-done');
    await done.click();

    const poly2 = await app.client.$('#left-Polygon');
    await poly2.click();

    await mouseAction([
        { type: 'pointerMove', x: 500, y: 500, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 600, y: 600, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    await checkExist('#svg_1');

    const time2 = await app.client.$('div.time-est-btn');
    await time2.click();

    const timeresult2 = await app.client.$('div.time-est-result');
    await timeresult2.getText();
    expect(await timeresult2.getText()).toEqual('Estimated Time: 21 秒');
});
