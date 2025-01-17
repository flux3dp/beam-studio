const { checkExist, setAppPage } = require('../../../util/utils');
const { mouseAction } = require('../../../util/actions');

test('Check Preference Continuous Drawing', async function() {
    const { app } = require('../../../test');
    await setAppPage('#studio/settings');

    const drawing = await app.client.$('select#qa-set-continuous-drawing option[value="TRUE"]');
    await drawing.click();

    const drawingcheck= await app.client.$('select#qa-set-continuous-drawing');
    const drawingcheck2 = await drawingcheck.getAttribute('value');
    expect(drawingcheck2).toEqual('TRUE');

    const done = await app.client.$('div.btn.btn-done');
    await done.click();

    const rect = await app.client.$('#left-Rectangle');
    await rect.click();
    await mouseAction([
        { type: 'pointerMove', x: 250, y: 250, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 300, y: 300, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    await checkExist('#svg_1');
    
    await mouseAction([
        { type: 'pointerMove', x: 350, y: 350, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 400, y: 400, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    await checkExist('#svg_2');
    
    await mouseAction([
        { type: 'pointerMove', x: 450, y: 450, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 500, y: 500, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    await checkExist('#svg_3');
});
