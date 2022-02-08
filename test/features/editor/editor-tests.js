const { checkExist, restartAndSetStorage, setAppPage} = require('../../util/utils');
const application = require('../../../test/test');

test('Init Editor', async function() {
    const app = await restartAndSetStorage();
    let isVisible = await app.browserWindow.isVisible();
    await setAppPage('#/studio/beambox');
    expect(isVisible).toBe(true);
    await checkExist('#svgcanvas', 150000);
});

/* Create(left-panels) */
require('./left-panels-test/ellipse-test');
require('./left-panels-test/line-test');
require('./left-panels-test/pen-test');
require('./left-panels-test/polygon-test');
require('./left-panels-test/rectangle-test');
require('./left-panels-test/select-test');
require('./left-panels-test/text-test');

/* Modify Action */
require('./modify-action-test/align-test');
require('./modify-action-test/array-test');
require('./modify-action-test/change-object-test');
require('./modify-action-test/decompose-path-test');
require('./modify-action-test/distribute-test');
require('./modify-action-test/group-layer-test');
require('./modify-action-test/group-test');
require('./modify-action-test/mirror-test');
require('./modify-action-test/offset-test');
require('./modify-action-test/union-test');

/* Other Test */
require('./other-test/calculate-path-time-test');
require('./other-test/copy-paste-test');
require('./other-test/undo-redo');

/* Perefence */
require('./preference-test/allreset-test');
require('./preference-test/auto-check-update-test');
require('./preference-test/auto-connect-test');
require('./preference-test/beambox-model-test');
require('./preference-test/bitmap-previewing-quality-test');
require('./preference-test/continuous-drawing-test');
require('./preference-test/default-autofocus-test');
require('./preference-test/default-diode-test');
require('./preference-test/default-font-family');
require('./preference-test/default-font-style');
require('./preference-test/default-open-bottom-test');
require('./preference-test/default-units-test');
require('./preference-test/font-substitue-test');
require('./preference-test/language-test');
require('./preference-test/loop-compensation-test');
require('./preference-test/notification-test');
require('./preference-test/path-optimize');
require('./preference-test/preview-camera-speed-test');
require('./preference-test/save-connection-ip-test');
require('./preference-test/set-diode-offset-test');
require('./preference-test/set-guide-test');
require('./preference-test/speed-optimization-test');
require('./preference-test/vector-speed-constraint-test');
require('./preference-test/workarea-clipping-test');

/* Laser-Cut-Parameter(right-panels) */
require('./right-panels-test/laser-cut-parameter-test/add-parameter-test');
require('./right-panels-test/laser-cut-parameter-test/custom-parameter-list-test');
require('./right-panels-test/laser-cut-parameter-test/remove-speed-limit-test');
require('./right-panels-test/laser-cut-parameter-test/reset-parameter-test');
require('./right-panels-test/laser-cut-parameter-test/speed-caption-test');
require('./right-panels-test/laser-cut-parameter-test/power-caption-test');
require('./right-panels-test/laser-cut-parameter-test/power-enter-text-test');
require('./right-panels-test/laser-cut-parameter-test/switch-parameter-test');

/* Layer(right-panels) */
require('./right-panels-test/layer-test/copy-layer-test');
require('./right-panels-test/layer-test/create-layer-test');
require('./right-panels-test/layer-test/create-object-diffierent-layer');
require('./right-panels-test/layer-test/delete-layer-test');
require('./right-panels-test/layer-test/drag-layer-test');
require('./right-panels-test/layer-test/hide-layer-test');
require('./right-panels-test/layer-test/lock-layer-test');
require('./right-panels-test/layer-test/merge-layer-test');
require('./right-panels-test/layer-test/move-object-layer-test');
require('./right-panels-test/layer-test/switch-layer-parameter-test');

/* Top-panels */
require('./top-panels-tset/connect-test');
require('./top-panels-tset');

/* Viewport */
require('./viewport-test/zoom_in_out-test');
require('./viewport-test/fit-to-window-test');
require('./viewport-test/auto-fit-to-window-test');
require('./viewport-test/view-color-test');
require('./viewport-test/percentage-test');

/* setting */
require('../settings/home-lang-test');
require('../settings/connect-machine');

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
