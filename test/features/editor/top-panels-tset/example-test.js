const { checkExist, callMenuEvent, setReload } = require('../../../util/utils');

test('Example of Beamo', async function() {
    const { app } = require('../../../test');
    await setReload();
    await checkExist('#svgcanvas', 15000);
    await callMenuEvent({ id: 'IMPORT_EXAMPLE' });
    const time = await app.client.$('div.time-est-btn');
    await time.click();
    const timereult = await app.client.$('div.time-est-result');
    expect(await timereult.getText()).toEqual('Estimated Time: 2 m 22 s');
});

test('Example of Beambox', async function() {
    const { app } = require('../../../test');
    await setReload();
    await checkExist('#svgcanvas', 15000);
    await callMenuEvent({ id: 'IMPORT_HELLO_BEAMBOX' });
    const time = await app.client.$('div.time-est-btn');
    await time.click();
    const timereult = await app.client.$('div.time-est-result');
    expect(await timereult.getText()).toEqual('Estimated Time: 1 m 25 s');
});

test('Example of Material Engrave ', async function() {
    const { app } = require('../../../test');
    await setReload();
    await checkExist('#svgcanvas', 15000);
    await callMenuEvent({ id: 'IMPORT_MATERIAL_TESTING_ENGRAVE' });
    const time = await app.client.$('div.time-est-btn');
    await time.click();
    await checkExist('div.time-est-result', 150000);
    const timereult = await app.client.$('div.time-est-result');
    expect(await timereult.getText()).toEqual('Estimated Time: 12 m 11 s');
});

test('Example of Material Engrave Classic', async function() {
    const { app } = require('../../../test');
    await setReload();
    await checkExist('#svgcanvas', 15000);
    await callMenuEvent({ id: 'IMPORT_MATERIAL_TESTING_OLD' });
    const time = await app.client.$('div.time-est-btn');
    await time.click();
    await checkExist('div.time-est-result', 80000);
    const timereult = await app.client.$('div.time-est-result');
    expect(await timereult.getText()).toEqual('Estimated Time: 4 m 30 s');
});

test('Example of Material Cut', async function() {
    const { app } = require('../../../test');
    await setReload();
    await checkExist('#svgcanvas', 15000);
    await callMenuEvent({ id: 'IMPORT_MATERIAL_TESTING_CUT' });

    const time = await app.client.$('div.time-est-btn');
    await time.click();
    await checkExist('div.time-est-result', 80000);
    const timereult = await app.client.$('div.time-est-result');
    expect(await timereult.getText()).toEqual('Estimated Time: 10 m 6 s');
});

test('Example of Material Cut Sample', async function() {
    const { app } = require('../../../test');
    await setReload();
    await checkExist('#svgcanvas', 15000);
    await callMenuEvent({ id: 'IMPORT_MATERIAL_TESTING_SIMPLECUT' });

    const time = await app.client.$('div.time-est-btn');
    await time.click();
    await checkExist('div.time-est-result', 80000);
    const timereult = await app.client.$('div.time-est-result');
    expect(await timereult.getText()).toEqual('Estimated Time: 4 m 56 s');
});

test('Example of Material Line', async function() {
    const { app } = require('../../../test');
    await setReload();
    await checkExist('#svgcanvas', 15000);
    await callMenuEvent({ id: 'IMPORT_MATERIAL_TESTING_LINE' });

    const time = await app.client.$('div.time-est-btn');
    await time.click();
    await checkExist('div.time-est-result', 80000);
    const timereult = await app.client.$('div.time-est-result');
    expect(await timereult.getText()).toEqual('Estimated Time: 4 m 12 s');
});

test('Example of Acrylic Focus Probe', async function() {
    const { app } = require('../../../test');
    await setReload();
    await checkExist('#svgcanvas', 15000);
    await callMenuEvent({ id: 'IMPORT_ACRYLIC_FOCUS_PROBE' });

    const time = await app.client.$('div.time-est-btn');
    await time.click();
    await checkExist('div.time-est-result', 80000);
    const timereult = await app.client.$('div.time-est-result');
    expect(await timereult.getText()).toEqual('Estimated Time: 25 s');
});
