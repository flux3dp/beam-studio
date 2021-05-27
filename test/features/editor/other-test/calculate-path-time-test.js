const { pause, checkExist, checkVisible, updateInput } = require('../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../util/actions');
test('Calculate Path Time', async function() {
    const { app } = require('../../../test');
   
    await app.client.execute(() => {
        location.reload();
    });
    await checkExist('#svgcanvas',5000);

    await app.client.click('#left-Rectangle');
    
    await mouseAction([
        { type: 'pointerMove', x: 200, y: 200, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 300, y: 300, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    

    await app.client.click('#left-Text');
    await mouseAction([
        { type: 'pointerMove', x: 400, y: 400, duration: 10, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerUp', button: 0, },
    ]);
    await new Promise((r) => setTimeout(r, 1000));

    await app.client.keys(['T', 'E', 'S', 'T', "NULL"]);
    await new Promise((r) => setTimeout(r, 1000));
    
    
    await app.client.click('div.time-est-btn');
    await new Promise((r) => setTimeout(r, 2000));
    const time = await app.client.getText('div.time-est-result');
    console.log(time);
    expect(time).toEqual('Estimated Time: 17 秒');
    await new Promise((r) => setTimeout(r, 1000));
    

});