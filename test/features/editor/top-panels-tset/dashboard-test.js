const { checkExist ,callMenuEvent } = require('../../../util/utils');

test('Check Dashboard', async function() {
    const { app } = require('../../../test');
    await checkExist('#svgcanvas',15000);
    await callMenuEvent({ id: 'DOCUMENT_SETTING' });

    const resolutionSlider = await app.client.$('input.slider');
    await resolutionSlider.dragAndDrop({ x: 50, y: 0 });

    const resolutionValue = await app.client.$('input.value');
    const dpi = await resolutionValue.getAttribute('value');
    expect(dpi).toEqual("Ultra High (1000 DPI)");
});