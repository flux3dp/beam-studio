const { checkExist } = require('../../../util/utils');
const { mouseAction } = require('../../../util/actions');

test('Check Calculate Time Geometry', async function() {
    const { app } = require('../../../test');
   
    await app.client.execute(() => {
        location.reload();
    });
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
    expect(await timereult.getText()).toEqual('Estimated Time: 9 秒');
});

test('Check Calculate Time Text', async function() {
    const { app } = require('../../../test');
    const text = await app.client.$('#left-Text');
    await text.click();
    await mouseAction([
        { type: 'pointerMove', x: 400, y: 400, duration: 10, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerUp', button: 0, },
    ]);
    await app.client.keys(['Path', 'Space', 'Time', 'Space', 'TEST']);
    
    const time2 = await app.client.$('div.time-est-btn');
    await time2.click();
    const timereult2 = await app.client.$('div.time-est-result');
    expect(await timereult2.getText()).toEqual('Estimated Time: 30 秒');

});

test('Check Calculate Time Path', async function() {
    const { app } = require('../../../test');
    const line = await app.client.$('#left-Line');
    await line.click(); 
    await mouseAction([
        { type: 'pointerMove', x: 300, y: 300, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 500, y: 500, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    const time3 = await app.client.$('div.time-est-btn');
    await time3.click();
    const timereult3 = await app.client.$('div.time-est-result');
    expect(await timereult3.getText()).toEqual('Estimated Time: 36 秒');

});