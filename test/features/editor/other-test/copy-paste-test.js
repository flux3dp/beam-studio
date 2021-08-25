const { checkExist, setReload, uploadFile } = require('../../../util/utils');
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
    if(process.platform === 'darwin'){
        await app.client.keys(['Command', 'c', "NULL"]);
        await app.client.keys(['Command', 'v', "NULL"]);
    } 
    else{
        await app.client.keys(['Control', 'c', "NULL"]);
        await app.client.keys(['Control', 'v', "NULL"]);
    }

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
    if(process.platform === 'darwin'){
        await app.client.keys(['Command', 'c', "NULL"]);
        await app.client.keys(['Command', 'v', "NULL"]);
    } 
    else{
        await app.client.keys(['Control', 'c', "NULL"]);
        await app.client.keys(['Control', 'v', "NULL"]);
    }
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
    if(process.platform === 'darwin'){
        await app.client.keys(['Command', 'c', "NULL"]);
        await app.client.keys(['Command', 'v', "NULL"]);
    } 
    else{
        await app.client.keys(['Control', 'c', "NULL"]);
        await app.client.keys(['Control', 'v', "NULL"]);
    }

    const svg_7line = await app.client.$('#svg_7');
    const line2x1 = await svg_7line.getAttribute('x1');
    const line2y1 = await svg_7line.getAttribute('y1');
    const line2x2 = await svg_7line.getAttribute('x2');
    const line2y2 = await svg_7line.getAttribute('y2');
    const line2value = Math.sqrt(Math.pow((line2x2-line2x1),2)+Math.pow((line2y2-line2y1),2));

    const svg_8line = await app.client.$('#svg_8');
    const line1x1 = await svg_8line.getAttribute('x1');
    const line1y1 = await svg_8line.getAttribute('y1');
    const line1x2 = await svg_8line.getAttribute('x2');
    const line1y2 = await svg_8line.getAttribute('y2');
    const line1value = Math.sqrt(Math.pow((line1x2-line1x1),2)+Math.pow((line1y2-line1y1),2));

    const line1valuefix = parseFloat(line1value).toFixed(10);
    const line2valuefix = parseFloat(line2value).toFixed(10);

    expect(line1valuefix).toEqual(line2valuefix);
});

test('Check Copy Paste Image', async function() {
    const { app } = require('../../../test');
    await uploadFile('testfile/cat.jpg');
    await checkExist('image#svg_10', 5000);
    
    if(process.platform === 'darwin'){
        await app.client.keys(['Command', 'c', "NULL"]);
        await app.client.keys(['Command', 'v', "NULL"]);
    } 
    else{
        await app.client.keys(['Control', 'c', "NULL"]);
        await app.client.keys(['Control', 'v', "NULL"]);
    }
    await checkExist('image#svg_11', 50000);

    const image_svg_10 = await app.client.$('#svg_10');
    const svg10Width = await image_svg_10.getAttribute('width');
    const svg10Height = await image_svg_10.getAttribute('height');

    const image_svg_11 = await app.client.$('#svg_11');
    const svg11Width = await image_svg_11.getAttribute('width');
    const svg11Height = await image_svg_11.getAttribute('height');

    expect(Math.round(svg10Width)).toEqual(Math.round(svg11Width));
    expect(Math.round(svg10Height)).toEqual(Math.round(svg11Height));
});