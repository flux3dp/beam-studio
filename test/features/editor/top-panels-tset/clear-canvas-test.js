const { checkExist ,callMenuEvent, checknotExist } = require('../../../util/utils');
const { mouseAction } = require('../../../util/actions');

test('Check Clear Scene ', async function() {
    const { app } = require('../../../test');
    await checkExist('#svgcanvas',15000);
    const pen = await app.client.$('#left-Pen');
    await pen.click(); 

    await mouseAction([
        { type: 'pointerMove', x: 100, y: 100, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerUp', button: 0, },
        { type: 'pointerMove', x: 600, y: 100, duration: 1000, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerUp', button: 0, },
        { type: 'pointerMove', x: 100, y: 600, duration: 1000, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerUp', button: 0, },
        { type: 'pointerMove', x: 600, y: 600, duration: 1000, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerDown', button: 0, },
    ]);
    await checkExist('#svg_1');
    await callMenuEvent({ id: 'CLEAR_SCENE' });
    const yes = await app.client.$('button.btn.btn-default.primary');
    await yes.click();
    await checknotExist('#svg_1');
});
