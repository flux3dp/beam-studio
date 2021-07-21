const { checkExist, checknotExist, setReload } = require('../../../util/utils');
const { mouseAction } = require('../../../util/actions');

test('Check Preview Camera', async function() {
    const { app } = require('../../../test');
    await setReload();
    await checkExist('#svgcanvas', 15000);

    const camera = await app.client.$('div.img-container');
    await camera.click();

    const chooseCamera = await app.client.$('div.img-container');
    await chooseCamera.click();

    const beamo = await app.client.$('[data-test-key="FLPUAG5YEG"]');
    await beamo.click();

    // const yes = await app.client.$('button.btn.btn-default.primary');
    // await yes.click();
    await new Promise((r) => setTimeout(r, 10000));
    await mouseAction([
        { type: 'pointerMove', x: 200, y: 200, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 400, y: 400, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    await new Promise((r) => setTimeout(r, 10000));
    checkExist("#background_image");
});

test('Check Second Preview Camera', async function() {
    const { app } = require('../../../test');
    const previewImage1 = await app.client.$('image#background_image');
    const xlink1 = await previewImage1.getAttribute('xlink:href');
    await mouseAction([
        { type: 'pointerMove', x: 300, y: 300, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerMove', x: 500, y: 500, duration: 1000, },
        { type: 'pointerUp', button: 0, },
    ]);
    await new Promise((r) => setTimeout(r, 10000));
    checkExist("#background_image");
    const previewImage2 = await app.client.$('image#background_image');
    const xlink2 = await previewImage2.getAttribute('xlink:href');
    expect(xlink1).not.toEqual(xlink2);
});

test('Check Delate Preview Camera', async function() {
    const { app } = require('../../../test');
    const deletePerview = await app.client.$('div#left-Trash');
    await deletePerview.click();
    checknotExist('image#background_image');
});
