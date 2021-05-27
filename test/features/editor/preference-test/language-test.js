const { pause, checkExist, checkVisible, updateInput } = require('../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../util/actions');
const { dialog } = require('electron');

test('Check Preference Language', async function() {
    const { app } = require('../../../test');
    
    await checkExist('#svgcanvas',15000);

    await app.client.execute(() => {
        location.hash = '#studio/settings';
    });
    const selectde = await app.client.$('select#select-lang option[value="de"]');
    await selectde.click();
    const decheck= await app.client.$('select#select-lang');
    const decheck2 = await decheck.getAttribute('value');
    expect(decheck2).toEqual('de');
    const done = await app.client.$('a.btn.btn-done');
    await done.click();
    await checkExist('#svgcanvas',15000);
    const selectdecheck= await app.client.$('div#left-Cursor');
    const selectdecheck2 = await selectdecheck.getAttribute('title');
    expect(selectdecheck2).toEqual('Wählen (V)');

    await app.client.execute(() => {
        location.hash = '#studio/settings';
    });
    const selecten = await app.client.$('select#select-lang option[value="en"]');
    await selecten.click();
    const encheck= await app.client.$('select#select-lang');
    const encheck2 = await encheck.getAttribute('value');
    expect(encheck2).toEqual('en');
    const done2 = await app.client.$('a.btn.btn-done');
    await done2.click();
    await checkExist('#svgcanvas',15000);
    const selectencheck= await app.client.$('div#left-Cursor');
    const selectencheck2 = await selectencheck.getAttribute('title');
    expect(selectencheck2).toEqual('Select (V)');

    await app.client.execute(() => {
        location.hash = '#studio/settings';
    });
    const selectes = await app.client.$('select#select-lang option[value="es"]');
    await selectes.click();
    const escheck= await app.client.$('select#select-lang');
    const escheck2 = await escheck.getAttribute('value');
    expect(escheck2).toEqual('es');
    const done3 = await app.client.$('a.btn.btn-done');
    await done3.click();
    await checkExist('#svgcanvas',15000);
    const selectescheck= await app.client.$('div#left-Cursor');
    const selectescheck2 = await selectescheck.getAttribute('title');
    expect(selectescheck2).toEqual('Selecciona (V)');

    await app.client.execute(() => {
        location.hash = '#studio/settings';
    });
    const selectzhtw = await app.client.$('select#select-lang option[value="zh-tw"]');
    await selectzhtw.click();
    const zhtwcheck = await app.client.$('select#select-lang');
    const zhtwcheck2 = await zhtwcheck.getAttribute('value');
    expect(zhtwcheck2).toEqual('zh-tw');
    const done4 = await app.client.$('a.btn.btn-done');
    await done4.click();
    await checkExist('#svgcanvas',15000);
    const selectzhtwcheck= await app.client.$('div#left-Cursor');
    const selectzhtwcheck2 = await selectzhtwcheck.getAttribute('title');
    expect(selectzhtwcheck2).toEqual('選取 (V)');

    await app.client.execute(() => {
        location.hash = '#studio/settings';
    });
    const selectja = await app.client.$('select#select-lang option[value="ja"]');
    await selectja.click();
    const jacheck = await app.client.$('select#select-lang');
    const jacheck2 = await jacheck.getAttribute('value');
    expect(jacheck2).toEqual('ja');
    const done5 = await app.client.$('a.btn.btn-done');
    await done5.click();
    await checkExist('#svgcanvas',15000);
    const selectjacheck= await app.client.$('div#left-Cursor');
    const selectjacheck2 = await selectjacheck.getAttribute('title');
    expect(selectjacheck2).toEqual('選択する (V)');

    await app.client.execute(() => {
        location.hash = '#studio/settings';
    });
    const selectzhcn = await app.client.$('select#select-lang option[value="zh-cn"]');
    await selectzhcn.click();
    const zhcncheck = await app.client.$('select#select-lang');
    const zhcncheck2 = await zhcncheck.getAttribute('value');
    expect(zhcncheck2).toEqual('zh-cn');
    const done6 = await app.client.$('a.btn.btn-done');
    await done6.click();
    await checkExist('#svgcanvas',15000);
    const selectzhcncheck= await app.client.$('div#left-Cursor');
    const selectzhcncheck2 = await selectzhcncheck.getAttribute('title');
    expect(selectzhcncheck2).toEqual('选取 (V)');

    
});