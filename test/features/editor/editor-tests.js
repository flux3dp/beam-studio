const { checkExist, restartApp, stopApp, setAppStorage } = require('../../util/utils');
const application = require('../../test');

test('Init Editor', async function() {
    const app = await restartApp();
    await setAppStorage({
        'printer-is-ready': true,
        'enable-sentry': 0,
        'active-lang': 'zh-tw',
        'alert-config': {
            'skip-interface-tutorial': true,
        },
        'beambox-preference': {
            should_remind_calibrate_camera: false,
            model: "fbm1",
            show_guides: false,
            guide_x0: 0,
            guide_y0: 0,
            engrave_dpi: "medium",
            workarea: "fbm1",
            show_rulers: true,
            use_layer_color: true,
        },
    });
    
    let isVisible = await app.browserWindow.isVisible();
    expect(isVisible).toBe(true);
    await checkExist('#svgcanvas', 15000);
});

require('./shape-test');

test('End Editor', async function() {
    const { app } = application;
    // Remove unsaved changes before close
    await app.client.execute(() => {
        svgCanvas.setHasUnsavedChange(false);
        return svgCanvas;
    });
});
