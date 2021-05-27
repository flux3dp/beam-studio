const { checkExist, restartApp, stopApp, setAppStorage, restartAndSetStorage } = require('../../util/utils');
const application = require('../../../test/test');
const request = require('request');

test('Init Editor', async function() {
    const app = await restartAndSetStorage();
    let isVisible = await app.browserWindow.isVisible();
    expect(isVisible).toBe(true);
    await checkExist('#svgcanvas', 15000);
});


/* Create(left-panels) */
// require('./left-panels-test/ellipse-test');
// require('./left-panels-test/line-test');
// require('./left-panels-test/pen-curve-test');
// require('./left-panels-test/pen-doubleclicks-test');
// require('./left-panels-test/pen-node-test');
// require('./left-panels-test/pen-test');
// require('./left-panels-test/polygon-sides-test');
// require('./left-panels-test/polygon-test');
// // require('./left-panels-test/polygon-use-shift-test');
// require('./left-panels-test/rectangle-corner-test');
// require('./left-panels-test/rectangle-test');
// require('./left-panels-test/select-multi-test');
// require('./left-panels-test/select-test');
// require('./left-panels-test/text-convert-to-path-test');
// require('./left-panels-test/text-test');



/* Perefence */
// // require('./preference-test/allreset-test');
// // require('./preference-test/auto-check-update-test');
// // require('./preference-test/auto-connect-test');
// require('./preference-test/beambox-model-test');
// // require('./preference-test/bitmap-previewing-quality-test');
// require('./preference-test/continuous-drawing-test');
// require('./preference-test/default-autofocus-test');
// require('./preference-test/default-diode-test');
// require('./preference-test/default-font-family');
// require('./preference-test/default-font-style');
// require('./preference-test/default-open-bottom-test');
// require('./preference-test/default-units-test');
// // require('./preference-test/font-substitue-test');
// require('./preference-test/language-test');
// require('./preference-test/loop-compensation-test');
// require('./preference-test/notification-test');
// require('./preference-test/path-optimize');
// require('./preference-test/path-optimize-text');
// require('./preference-test/preview-camera-speed-test');
// require('./preference-test/save-connection-ip-test');
// require('./preference-test/set-diode-offset-test');
// require('./preference-test/set-guide-test');
// require('./preference-test/speed-optimization-test');
// require('./preference-test/vector-speed-constraint-test');
// require('./preference-test/workarea-clipping-test');



/* Presets & Parameters(right-panels) */
// require('./right-panels-test/laser-cut-parameter-test/add-parameter-test');
// require('./right-panels-test/laser-cut-parameter-test/custom-parameter-list-test');
// require('./right-panels-test/laser-cut-parameter-test/remove-speed-limit-test');
// require('./right-panels-test/laser-cut-parameter-test/reset-parameter-test');
// require('./right-panels-test/laser-cut-parameter-test/speed-caption-test');
// require('./right-panels-test/laser-cut-parameter-test/strength-caption-test');
// require('./right-panels-test/laser-cut-parameter-test/strength-enter-text-test');
// require('./right-panels-test/laser-cut-parameter-test/switch-parameter-test');

/* Layer(right-panels) */
require('./right-panels-test/layer-test/add-layer-test');
// require('./right-panels-test/layer-test');
// require('./right-panels-test/layer-test');
// require('./right-panels-test/layer-test');
// require('./right-panels-test/layer-test');
// require('./right-panels-test/layer-test');
// require('./right-panels-test/layer-test');
// require('./right-panels-test/layer-test');
// require('./right-panels-test/layer-test');
// require('./right-panels-test/layer-test');
// require('./right-panels-test/layer-test');
// require('./right-panels-test/layer-test');


test('End Editor', async function() {
    const { app } = application;
    try {
        // Remove unsaved changes before close
        await app.client.execute(() => {
            svgCanvas.setHasUnsavedChange(false);
            return svgCanvas;
        });
    } catch (error) {
        if (error.name !== 'stale element reference') {
            throw error;
        }
    }
});
