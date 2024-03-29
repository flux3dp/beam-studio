const { checkExist, setReload } = require('../../../util/utils');
const { mouseAction } = require('../../../util/actions');

test('Check Copy Paste Geometry', async function() {
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

    const text = await app.client.$('#left-Text');
    await text.click();
    await mouseAction([
        { type: 'pointerMove', x: 400, y: 400, duration: 10, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerUp', button: 0, },
    ]);
    await app.client.keys(['Copy', 'Space', 'Paste', 'Space', 'TEST']);
    await app.client.keys(['Enter', "NULL"]);
    await app.client.keys(['Control', 'c', "NULL"]);
    await app.client.keys(['Control', 'v', "NULL"]);

    const svg_4text = await app.client.$('#svg_4');
    const text1 = await svg_4text.getText();

    const svg_5text = await app.client.$('#svg_5');
    const text2 = await svg_5text.getText();
    expect(text1).toEqual(text2);
});

test('Check Copy Paste Text', async function() {
    const { app } = require('../../../test');

    const text = await app.client.$('#left-Text');
    await text.click();
    await mouseAction([
        { type: 'pointerMove', x: 400, y: 400, duration: 10, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerUp', button: 0, },
    ]);
    await app.client.keys(['Copy', 'Space', 'Paste', 'Space', 'TEST']);
    await app.client.keys(['Enter', "NULL"]);
    await app.client.keys(['Control', 'c', "NULL"]);
    await app.client.keys(['Control', 'v', "NULL"]);

    const svg_4text = await app.client.$('#svg_4');
    const text1 = await svg_4text.getText();

    const svg_5text = await app.client.$('#svg_5');
    const text2 = await svg_5text.getText();
    expect(text1).toEqual(text2);
});

test('Check Copy Paste Path', async function() {
    const { app } = require('../../../test');

    const line = await app.client.$('#left-Line');
    await line.click(); 
    await mouseAction([
        { type: 'pointerMove', x: 300, y: 300, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 500, y: 500, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    await app.client.keys(['Control', 'c', "NULL"]);
    await app.client.keys(['Control', 'v', "NULL"]);

    const svg_10line = await app.client.$('#svg_10');
    const line1x1 = await svg_10line.getAttribute('x1');
    const line1y1 = await svg_10line.getAttribute('y1');
    const line1x2 = await svg_10line.getAttribute('x2');
    const line1y2 = await svg_10line.getAttribute('y2');
    const line1value = Math.sqrt(Math.pow((line1x2-line1x1),2)+Math.pow((line1y2-line1y1),2));

    const svg_11line = await app.client.$('#svg_11');
    const line2x1 = await svg_11line.getAttribute('x1');
    const line2y1 = await svg_11line.getAttribute('y1');
    const line2x2 = await svg_11line.getAttribute('x2');
    const line2y2 = await svg_11line.getAttribute('y2');
    const line2value = Math.sqrt(Math.pow((line2x2-line2x1),2)+Math.pow((line2y2-line2y1),2));

    const line1valuefix = parseFloat(line1value).toFixed(10);
    const line2valuefix = parseFloat(line2value).toFixed(10);

    expect(line1valuefix).toEqual(line2valuefix);
});
