const { checkExist ,callMenuEvent } = require('../../../util/utils');

test('Document of Setting Resolution', async function() {
    const { app } = require('../../../test');
    await checkExist('#svgcanvas',15000);
    await callMenuEvent({ id: 'DOCUMENT_SETTING' });

    const resolutionSlider = await app.client.$('input.slider');
    await resolutionSlider.dragAndDrop({ x: 50, y: 0 });

    const resolutionValue = await app.client.$('input.value');
    const dpi = await resolutionValue.getAttribute('value');
    expect(dpi).toEqual("Ultra High (1000 DPI)");
});

test('Document of Setting Beambox Workarea ', async function() {
    const { app } = require('../../../test');
    await checkExist('#svgcanvas',15000);
    await callMenuEvent({ id: 'DOCUMENT_SETTING' });

    const workareaOption = await app.client.$('option[value="fbb1b"]');
    await workareaOption.click();

    const save = await app.client.$('button.btn.btn-default.primary.pull-right');
    await save.click();

    const fbb1bheightcheck= await app.client.$("svg#canvasBackground")
    const fbb1bheightcheck2 = await fbb1bheightcheck.getAttribute('height');
    expect(fbb1bheightcheck2).toEqual('537.6999999999999');

    const fbb1bwidthcheck= await app.client.$("svg#canvasBackground")
    const fbb1bwidthcheck2 = await fbb1bwidthcheck.getAttribute('width');
    expect(fbb1bwidthcheck2).toEqual('573.5466666666666');
});

test('Document of Setting Beamboxpro Workarea ', async function() {
    const { app } = require('../../../test');
    await checkExist('#svgcanvas',15000);
    await callMenuEvent({ id: 'DOCUMENT_SETTING' });

    const workareaOption = await app.client.$('option[value="fbb1p"]');
    await workareaOption.click();

    const save = await app.client.$('button.btn.btn-default.primary.pull-right');
    await save.click();

    const fbb1pheightcheck= await app.client.$("svg#canvasBackground")
    const fbb1pheightcheck2 = await fbb1pheightcheck.getAttribute('height');
    expect(fbb1pheightcheck2).toEqual('537.6999999999999');

    const fbb1pwidthcheck= await app.client.$("svg#canvasBackground")
    const fbb1pwidthcheck2 = await fbb1pwidthcheck.getAttribute('width');
    expect(fbb1pwidthcheck2).toEqual('860.3199999999999');
});

test('Document of Setting Beamo Workarea ', async function() {
    const { app } = require('../../../test');
    await checkExist('#svgcanvas',15000);
    await callMenuEvent({ id: 'DOCUMENT_SETTING' });

    const workareaOption = await app.client.$('option[value="fbm1"]');
    await workareaOption.click();

    const save = await app.client.$('button.btn.btn-default.primary.pull-right');
    await save.click();

    const fbm1heightcheck= await app.client.$("svg#canvasBackground")
    const fbm1heightcheck2 = await fbm1heightcheck.getAttribute('height');
    expect(fbm1heightcheck2).toEqual('537.6999999999999');

    const fbm1widthcheck= await app.client.$("svg#canvasBackground")
    const fbm1widthcheck2 = await fbm1widthcheck.getAttribute('width');
    expect(fbm1widthcheck2).toEqual('768.1428571428571');
});

test('Document of Setting Rotary', async function() {
    const { app } = require('../../../test');
    await checkExist('#svgcanvas',15000);
    await callMenuEvent({ id: 'DOCUMENT_SETTING' });
    const workareaOption = await app.client.$('option[value="fbm1"]');
    await workareaOption.click();
    const rotarySwitch = await app.client.$('[for="rotary_mode"]');
    await rotarySwitch.click();
    const save = await app.client.$('button.btn.btn-default.primary.pull-right');
    await save.click();

    await checkExist('#transparentRotaryLine');
});

test('Change Document Set Open Button ', async function() {
    const { app } = require('../../../test');
    await checkExist('#svgcanvas',15000);
    await callMenuEvent({ id: 'DOCUMENT_SETTING' });
    const workareaOption = await app.client.$('option[value="fbm1"]');
    await workareaOption.click();

    const openSwitch = await app.client.$('[for="borderless_mode"]');
    await openSwitch.click();

    const save = await app.client.$('button.btn.btn-default.primary.pull-right');
    await save.click();

    await checkExist('#open-bottom-boundary');
});

test('Change Document Set Autofocus ', async function() {
    const { app } = require('../../../test');
    await checkExist('#svgcanvas',15000);
    await callMenuEvent({ id: 'DOCUMENT_SETTING' });
    const workareaOption = await app.client.$('option[value="fbm1"]');
    await workareaOption.click();

    const autofocusSwitch = await app.client.$('[for="autofocus-module"]');
    await autofocusSwitch.click();

    const save = await app.client.$('button.btn.btn-default.primary.pull-right');
    await save.click();

    const addon = await app.client.$('div.panel.checkbox span.title');
    expect(await addon.getText()).toEqual('Focus Adjustment');
});

test('Change Document Set Diode Laser ', async function() {
    const { app } = require('../../../test');
    await checkExist('#svgcanvas',15000);
    await callMenuEvent({ id: 'DOCUMENT_SETTING' });
    const workareaOption = await app.client.$('option[value="fbm1"]');
    await workareaOption.click();

    const diodeSwitch = await app.client.$('[for="diode_module"]');
    await diodeSwitch.click();

    const save = await app.client.$('button.btn.btn-default.primary.pull-right');
    await save.click();
    
    const checkbox = await app.client.$('div.panel.checkbox input');
    await checkbox.click();

    await checkExist('#diode-boundary');
});
