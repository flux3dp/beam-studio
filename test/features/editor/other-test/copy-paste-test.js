const { pause, checkExist, checkVisible, updateInput } = require('../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../util/actions');


test('Copy Paste', async function() {
    const { app } = require('../../../test');
    
    await app.client.execute(() => {
        location.reload();
    });
    await checkExist('#svgcanvas',5000);

    const rect = await app.client.$('#left-Rectangle');
    await rect.click();
    
    await mouseAction([
        { type: 'pointerMove', x: 200, y: 200, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 300, y: 300, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    await app.client.keys(['Control', 'c', "NULL"]);
    await app.client.keys(['Control', 'v', "NULL"]);

    const svg_1width = await app.client.$('#svg_1');
    const rect1W = await svg_1width.getAttribute('width');

    const svg_1height = await app.client.$('#svg_1');
    const rect1H = await svg_1height.getAttribute('height');

    const svg_2width = await app.client.$('#svg_2');
    const rect2W = await svg_2width.getAttribute('width');

    const svg_2height = await app.client.$('#svg_2');
    const rect2H = await svg_2height.getAttribute('height');


    const r1W = parseFloat(rect1W).toFixed(10);
    const r1H = parseFloat(rect1H).toFixed(10);
    const r2W = parseFloat(rect2W).toFixed(10);
    const r2H = parseFloat(rect2H).toFixed(10);
    expect(r1H).toEqual(r2H);
    expect(r1W).toEqual(r2W);

    await app.client.keys(['Control', 'Shift', 'v', "NULL"]);


    const svg_1x = await app.client.$('#svg_1');
    const rect1X = await svg_1x.getAttribute('x');

    const svg_1y = await app.client.$('#svg_1');
    const rect1Y = await svg_1y.getAttribute('y');

    const svg_4x = await app.client.$('#svg_4');
    const rect4X = await svg_4x.getAttribute('x');

    const svg_4y = await app.client.$('#svg_4');
    const rect4Y = await svg_4y.getAttribute('y');

    /*使用ctrl+shift+v原地貼上時，會出現兩物件，此測試還跳過svg_3，直接變成svg_4 */
    expect(rect1X).toEqual(rect4X);
    expect(rect1Y).toEqual(rect4Y);


    await new Promise((r) => setTimeout(r, 1000));

});