const { checkExist, setReload, uploadFile} = require('../../../util/utils');
const { mouseAction } = require('../../../util/actions');

test('Upload Jpg of File', async function() {
    const { app } = require('../../../test');
    await setReload();
    await checkExist('#svgcanvas', 15000);
    await uploadFile('testfile/cat.jpg');
    await checkExist('image#svg_1', 50000);
    await new Promise((r) => setTimeout(r, 2000));

    const time = await app.client.$('div.time-est-btn');
    await time.click();
    await checkExist('div.time-est-result', 150000);

    const timereult = await app.client.$('div.time-est-result');
    expect(await timereult.getText()).toEqual('Estimated Time: 4 m 40 s');

    await mouseAction([
        { type: 'pointerMove', x: 0, y: 0, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 100, y: 100, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);

    const rectWidth = await app.client.$('input#width');
    const rectHeight = await app.client.$('input#height');
    expect(Math.round(await rectWidth.getAttribute('value'))).toEqual(22);
    expect(Math.round(await rectHeight.getAttribute('value'))).toEqual(22);
});

test('Upload Png of File', async function() {
    const { app } = require('../../../test');
    await setReload();
    await checkExist('#svgcanvas', 15000);
    await uploadFile('testfile/flux.png');
    await checkExist('image#svg_1', 50000);
    await new Promise((r) => setTimeout(r, 2000));

    const time = await app.client.$('div.time-est-btn');
    await time.click();
    await checkExist('div.time-est-result', 150000);

    const timereult = await app.client.$('div.time-est-result');
    expect(await timereult.getText()).toEqual('Estimated Time: 2 m 41 s');

    await mouseAction([
        { type: 'pointerMove', x: 0, y: 0, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 100, y: 100, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);

    const rectWidth = await app.client.$('input#width');
    const rectHeight = await app.client.$('input#height');
    expect(Math.round(await rectWidth.getAttribute('value'))).toEqual(44);
    expect(Math.round(await rectHeight.getAttribute('value'))).toEqual(15);
});

test('Upload Svg Path of File', async function() {
    const { app } = require('../../../test');
    await setReload();
    await checkExist('#svgcanvas', 15000);
    await uploadFile('testfile/svg_path_rect.svg');

    const btnLayer = await app.client.$('[data-test-key="layer"]');
    await btnLayer.click();
    await checkExist('use#svg_2', 50000);
    await new Promise((r) => setTimeout(r, 1000));

    const time = await app.client.$('div.time-est-btn');
    await time.click();

    await checkExist('div.time-est-result', 150000);
    const timereult = await app.client.$('div.time-est-result');
    expect(await timereult.getText()).toEqual('Estimated Time: 9 s');

    await mouseAction([
        { type: 'pointerMove', x: 0, y: 0, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 100, y: 100, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);

    const rectWidth = await app.client.$('input#width');
    const rectHeight = await app.client.$('input#height');
    expect(Math.round(await rectWidth.getAttribute('value'))).toEqual(40);
    expect(Math.round(await rectHeight.getAttribute('value'))).toEqual(40);
});

test('Upload Svg Infill of File', async function() {
    const { app } = require('../../../test');
    await setReload();
    await checkExist('#svgcanvas', 15000);
    await uploadFile('testfile/svg_infill_rect.svg');

    const btnLayer = await app.client.$('[data-test-key="layer"]');
    await btnLayer.click();
    await checkExist('use#svg_2', 50000);
    await new Promise((r) => setTimeout(r, 1000));

    const time = await app.client.$('div.time-est-btn');
    await time.click();
    await checkExist('div.time-est-result', 150000);

    const timereult = await app.client.$('div.time-est-result');
    expect(await timereult.getText()).toEqual('Estimated Time: 15 m 9 s');

    await mouseAction([
        { type: 'pointerMove', x: 0, y: 0, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 100, y: 100, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);

    const rectWidth = await app.client.$('input#width');
    const rectHeight = await app.client.$('input#height');
    expect(Math.round(await rectWidth.getAttribute('value'))).toEqual(40);
    expect(Math.round(await rectHeight.getAttribute('value'))).toEqual(40);
});

test('Upload Svg Path Infill of File', async function() {
    const { app } = require('../../../test');
    await setReload();
    await checkExist('#svgcanvas', 15000);
    await uploadFile('testfile/svg_path_infill_rect.svg');

    const btnLayer = await app.client.$('[data-test-key="layer"]');
    await btnLayer.click();
    await checkExist('use#svg_2', 50000);
    await new Promise((r) => setTimeout(r, 1000));

    const time = await app.client.$('div.time-est-btn');
    await time.click();
    await checkExist('div.time-est-result', 150000);

    const timereult = await app.client.$('div.time-est-result');
    expect(await timereult.getText()).toEqual('Estimated Time: 15 m 17 s');

    await mouseAction([
        { type: 'pointerMove', x: 0, y: 0, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 100, y: 100, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);

    const rectWidth = await app.client.$('input#width');
    const rectHeight = await app.client.$('input#height');
    expect(Math.round(await rectWidth.getAttribute('value'))).toEqual(80);
    expect(Math.round(await rectHeight.getAttribute('value'))).toEqual(80);
});

test('Upload Svg Gradient of File', async function() {
    const { app } = require('../../../test');
    await setReload();
    await checkExist('#svgcanvas', 15000);
    await uploadFile('testfile/svg_gradient.svg');

    const btnLayer = await app.client.$('[data-test-key="layer"]');
    await btnLayer.click();
    await checkExist('use#svg_2', 50000);
    await new Promise((r) => setTimeout(r, 1000));

    const time = await app.client.$('div.time-est-btn');
    await time.click();
    await checkExist('div.time-est-result', 150000);

    const timereult = await app.client.$('div.time-est-result');
    expect(await timereult.getText()).toEqual('Estimated Time: 7 h 45 m');

    await mouseAction([
        { type: 'pointerMove', x: 0, y: 0, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 100, y: 100, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);

    const rectWidth = await app.client.$('input#width');
    const rectHeight = await app.client.$('input#height');
    expect(Math.round(await rectWidth.getAttribute('value'))).toEqual(265);
    expect(Math.round(await rectHeight.getAttribute('value'))).toEqual(265);
});

test('Upload Svg With Bitmap of File', async function() {
    const { app } = require('../../../test');
    await setReload();
    await checkExist('#svgcanvas', 15000);
    await uploadFile('testfile/svg_bitmap.svg');

    const btnLayer = await app.client.$('[data-test-key="layer"]');
    await btnLayer.click();
    await checkExist('use#svg_2', 50000);
    await new Promise((r) => setTimeout(r, 1000));

    const time = await app.client.$('div.time-est-btn');
    await time.click();
    await checkExist('div.time-est-result', 150000);

    const timereult = await app.client.$('div.time-est-result');
    expect(await timereult.getText()).toEqual('Estimated Time: 18 m 55 s');

    await mouseAction([
        { type: 'pointerMove', x: 0, y: 0, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 100, y: 100, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);

    const rectWidth = await app.client.$('input#width');
    const rectHeight = await app.client.$('input#height');
    expect(Math.round(await rectWidth.getAttribute('value'))).toEqual(45);
    expect(Math.round(await rectHeight.getAttribute('value'))).toEqual(45);
});

test('Upload Svg 2.0 of File', async function() {
    const { app } = require('../../../test');
    await setReload();
    await checkExist('#svgcanvas', 15000);
    await uploadFile('testfile/svg_version2.svg');

    const btnLayer = await app.client.$('[data-test-key="layer"]');
    await btnLayer.click();
    await checkExist('use#svg_2', 50000);
    await new Promise((r) => setTimeout(r, 1000));

    const time = await app.client.$('div.time-est-btn');
    await time.click();
    await checkExist('div.time-est-result', 150000);

    const timereult = await app.client.$('div.time-est-result');
    expect(await timereult.getText()).toEqual('Estimated Time: 21 s');

    await mouseAction([
        { type: 'pointerMove', x: 0, y: 0, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 100, y: 100, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);

    const rectWidth = await app.client.$('input#width');
    const rectHeight = await app.client.$('input#height');
    expect(Math.round(await rectWidth.getAttribute('value'))).toEqual(100);
    expect(Math.round(await rectHeight.getAttribute('value'))).toEqual(100);
});

test('Upload Ai of File', async function() {
    const { app } = require('../../../test');
    await setReload();
    await checkExist('#svgcanvas', 15000);
    await app.client.execute(() =>{
        localStorage.setItem('dev', 'true');
    });
    await uploadFile('testfile/illustrator.ai');

    await setReload();
    await checkExist('#svgcanvas', 15000);
    await uploadFile('testfile/illustrator.ai');

    const btnstyle = await app.client.$('div.modal-body button');
    await btnstyle.click();

    await checkExist('#svg_1', 50000);
    await new Promise((r) => setTimeout(r, 1000));

    const time = await app.client.$('div.time-est-btn');
    await time.click();
    await checkExist('div.time-est-result', 150000);

    const timereult = await app.client.$('div.time-est-result');
    expect(await timereult.getText()).toEqual('Estimated Time: 3 m 27 s');

    await mouseAction([
        { type: 'pointerMove', x: 0, y: 0, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 100, y: 100, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);

    const rectWidth = await app.client.$('input#width');
    const rectHeight = await app.client.$('input#height');
    expect(Math.round(await rectWidth.getAttribute('value'))).toEqual(156);
    expect(Math.round(await rectHeight.getAttribute('value'))).toEqual(54);
});

test('Upload Pdf of File', async function() {
    const { app } = require('../../../test');
    await setReload();
    await checkExist('#svgcanvas', 15000);
    await app.client.execute(() =>{
        localStorage.setItem('dev', 'true');
    });
    await uploadFile('testfile/portable_document_format.pdf');

    await setReload();
    await checkExist('#svgcanvas', 15000);
    await uploadFile('testfile/portable_document_format.pdf');

    const btnstyle = await app.client.$('div.modal-body button');
    await btnstyle.click();

    await checkExist('#svg_1', 50000);
    await new Promise((r) => setTimeout(r, 1000));

    const time = await app.client.$('div.time-est-btn');
    await time.click();
    await checkExist('div.time-est-result', 150000);

    const timereult = await app.client.$('div.time-est-result');
    expect(await timereult.getText()).toEqual('Estimated Time: 3 m 27 s');

    await mouseAction([
        { type: 'pointerMove', x: 0, y: 0, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 100, y: 100, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);

    const rectWidth = await app.client.$('input#width');
    const rectHeight = await app.client.$('input#height');
    expect(Math.round(await rectWidth.getAttribute('value'))).toEqual(156);
    expect(Math.round(await rectHeight.getAttribute('value'))).toEqual(54);
});

test('Upload Dxf of File', async function() {
    const { app } = require('../../../test');
    await setReload();
    await checkExist('#svgcanvas', 15000);
    await uploadFile('testfile/drawing_Interchange_format.dxf');

    const versionWarning = await app.client.$('div.alerts-container button');
    await versionWarning.click();
    await checkExist('#dpi-input', 3000);

    const dpiInput = await app.client.$('#dpi-input');
    await dpiInput.click();
    await app.client.keys(['1', 'Enter', "NULL"]);

    await checkExist('#svg_1', 50000);
    await new Promise((r) => setTimeout(r, 1000));

    const time = await app.client.$('div.time-est-btn');
    await time.click();
    await checkExist('div.time-est-result', 150000);

    const timereult = await app.client.$('div.time-est-result');
    expect(await timereult.getText()).toEqual('Estimated Time: 5 s');
    
    if(process.platform === 'darwin'){
        await app.client.keys(['Command', 'a', "NULL"]);
    } 
    else{
        await app.client.keys(['Control', 'a', "NULL"]);
    }

    const rectWidth = await app.client.$('input#width');
    const rectHeight = await app.client.$('input#height');
    expect(Math.round(await rectWidth.getAttribute('value'))).toEqual(20);
    expect(Math.round(await rectHeight.getAttribute('value'))).toEqual(20);
});
