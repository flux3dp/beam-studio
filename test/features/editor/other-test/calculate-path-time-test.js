const { checkExist, setReload, uploadFile } = require('../../../util/utils');
const { mouseAction } = require('../../../util/actions');

test('Check Calculate Time Geometry', async function() {
    const { app } = require('../../../test');
    await setReload();
    await checkExist('#svgcanvas',15000);

    const rect = await app.client.$('#left-Rectangle');
    await rect.click();
    await mouseAction([
        { type: 'pointerMove', x: 200, y: 200, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 300, y: 300, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);

    const time = await app.client.$('div.time-est-btn');
    await time.click();
    const timereult = await app.client.$('div.time-est-result');
    expect(await timereult.getText()).toEqual('Estimated Time: 9 s');
});

test('Check Calculate Time Text', async function() {
    const { app } = require('../../../test');
    await app.client.execute(() => {
        svgCanvas.clear();
    });
    const text = await app.client.$('#left-Text');
    await text.click();
    await mouseAction([
        { type: 'pointerMove', x: 400, y: 400, duration: 10, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerUp', button: 0, },
    ]);
    await app.client.keys(['Path', 'Space', 'Time', 'Space', 'TEST']);
    
    const time = await app.client.$('div.time-est-btn');
    await time.click();
    const timereult = await app.client.$('div.time-est-result');
    expect(await timereult.getText()).toEqual('Estimated Time: 1 s');
});

test('Check Calculate Time Path', async function() {
    const { app } = require('../../../test');
    await setReload();
    await checkExist('#svgcanvas',15000);

    const line = await app.client.$('#left-Line');
    await line.click(); 
    await mouseAction([
        { type: 'pointerMove', x: 300, y: 300, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 500, y: 500, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);

    const time = await app.client.$('div.time-est-btn');
    await time.click();
    const timereult = await app.client.$('div.time-est-result');
    expect(await timereult.getText()).toEqual('Estimated Time: 9 s');
});

test('Check Calculate Time Image', async function() {
    const { app } = require('../../../test');
    await setReload();
    await checkExist('#svgcanvas',15000);
    await uploadFile('testfile/map.png');

    const time = await app.client.$('div.time-est-btn');
    await time.click();
    const timereult = await app.client.$('div.time-est-result');
    expect(await timereult.getText()).toEqual('Estimated Time: 8 h 9 m');
});