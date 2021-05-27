const { pause, checkExist, checkVisible, updateInput } = require('../../../util/utils');
const { pageCoordtoCanvasCoord, getCurrentZoom } = require('../../../util/editor-utils');
const { mouseAction, keyAction } = require('../../../util/actions');

test('Draw Pen', async function() {
    const { app } = require('../../../test');

    await app.client.execute(() => {
        location.reload()
    });
    await checkExist('#svgcanvas',15000);

    const elem = await app.client.$('#left-Pen');
    await elem.click(); 

    await mouseAction([
        { type: 'pointerMove', x: 200, y: 200, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerUp', button: 0, },
        { type: 'pointerMove', x: 250, y: 200, duration: 1000, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerUp', button: 0, },
        { type: 'pointerMove', x: 300, y: 200, duration: 1000, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerUp', button: 0, },
        { type: 'pointerMove', x: 300, y: 250, duration: 1000, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerUp', button: 0, },
        { type: 'pointerMove', x: 300, y: 300, duration: 1000, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerUp', button: 0, },
        { type: 'pointerMove', x: 250, y: 300, duration: 1000, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerUp', button: 0, },
        { type: 'pointerMove', x: 200, y: 300, duration: 1000, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerUp', button: 0, },
        { type: 'pointerMove', x: 200, y: 250, duration: 1000, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerUp', button: 0, },
        { type: 'pointerMove', x: 200, y: 200, duration: 100, },
        { type: 'pointerDown', button: 0, },
        { type: 'pointerDown', button: 0, },
    ]);
    
    await checkExist('#svg_1');
    // await new Promise((r) => setTimeout(r, 50000));
    const svg_1d = await app.client.$('#svg_1');
    const pend = await svg_1d.getAttribute('d');
    expect(pend).toEqual("M 106.55794517829963 395.018199746274 L 303.40557275541795 394.0332113706727 L 500.4221784407543 394.0332113706727 L 500.4221784407543 591.049817056009 L 500.4221784407543 788.0664227413454 L 303.40557275541795 788.0664227413454 L 106.38896707008162 788.0664227413454 L 106.38896707008162 591.049817056009 L 106.55794517829963 395.018199746274 z");
    
    // const svg_1node = await app.client.$('#svg_1');
    // const pennode = await svg_1node.getAttribute('data-nodeTypes');
    // expect(pend).toEqual("{"0":0,"1":0,"2":0,"3":0,"4":0}");

});
